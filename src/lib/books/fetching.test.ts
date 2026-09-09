import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import searchFixture from "../../../tests/fixtures/openlibrary-search-dune.json";
import workFixture from "../../../tests/fixtures/openlibrary-work-dune.json";
import googleFixture from "../../../tests/fixtures/google-books-dune.json";
import { fetchWork, searchBooks } from "./openlibrary";
import { enrich } from "./google-books";
import type { BookDetail } from "./types";

/** Minimal stand-in for the bits of Response our code touches. */
function res(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as unknown as Response;
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GOOGLE_BOOKS_API_KEY;
});

describe("searchBooks", () => {
  it("short-circuits a blank query without touching the network", async () => {
    await expect(searchBooks("   ")).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends an explicit field list, a limit, and a User-Agent", async () => {
    fetchMock.mockResolvedValue(res(searchFixture));
    await searchBooks("dune herbert", 5);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("https://openlibrary.org/search.json");
    expect(url).toContain("q=dune%20herbert");
    expect(url).toContain("limit=5");
    // Without an explicit field list the response is enormous.
    expect(url).toContain("fields=key,title");
    expect(url).toContain("cover_i");
    expect(init.headers["User-Agent"]).toContain("Marginalia");
  });

  it("asks Next to cache for 24h, as Open Library requests", async () => {
    fetchMock.mockResolvedValue(res(searchFixture));
    await searchBooks("dune");
    expect(fetchMock.mock.calls[0][1].next.revalidate).toBe(86400);
  });

  it("returns normalized summaries", async () => {
    fetchMock.mockResolvedValue(res(searchFixture));
    const results = await searchBooks("dune");
    expect(results).toHaveLength(3);
    expect(results[0].olWorkKey).toBe("OL893415W");
  });

  it("throws with the status code when Open Library errors", async () => {
    fetchMock.mockResolvedValue(res(null, false, 503));
    await expect(searchBooks("dune")).rejects.toThrow(/503/);
  });
});

describe("fetchWork", () => {
  it("combines the search summary with the work description", async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(res(url.includes("/search.json") ? searchFixture : workFixture)),
    );

    const detail = await fetchWork("/works/OL893415W");
    expect(detail).not.toBeNull();
    expect(detail!.title).toBe("Dune");
    expect(detail!.authors).toEqual(["Frank Herbert"]);
    expect(detail!.description).toContain("Arrakis");
    expect(detail!.coverId).toBe(240727);
  });

  it("still returns a book when search is down but the work endpoint is up", async () => {
    fetchMock.mockImplementation((url: string) =>
      url.includes("/search.json")
        ? Promise.reject(new Error("search down"))
        : Promise.resolve(res(workFixture)),
    );

    const detail = await fetchWork("OL893415W");
    expect(detail!.title).toBe("Dune");
    expect(detail!.authors).toEqual([]);
  });

  it("returns null when the work itself cannot be fetched", async () => {
    fetchMock.mockImplementation((url: string) =>
      url.includes("/search.json")
        ? Promise.resolve(res(searchFixture))
        : Promise.reject(new Error("work down")),
    );
    await expect(fetchWork("OL893415W")).resolves.toBeNull();
  });
});

describe("enrich", () => {
  const thin: BookDetail = {
    olWorkKey: "OL893415W",
    title: "Dune",
    authors: ["Frank Herbert"],
    isbn13: "9780441013593",
    source: "openlibrary",
  };

  it("is a no-op without an API key", async () => {
    await expect(enrich(thin)).resolves.toEqual(thin);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("skips the request when nothing is missing", async () => {
    process.env.GOOGLE_BOOKS_API_KEY = "test-key";
    const complete = { ...thin, description: "d", pageCount: 100 };
    await expect(enrich(complete)).resolves.toEqual(complete);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("queries by ISBN when we have one", async () => {
    process.env.GOOGLE_BOOKS_API_KEY = "test-key";
    fetchMock.mockResolvedValue(res(googleFixture));

    const enriched = await enrich(thin);
    expect(fetchMock.mock.calls[0][0]).toContain("isbn%3A9780441013593");
    expect(enriched.pageCount).toBe(604);
    expect(enriched.source).toBe("openlibrary+google");
  });

  it("falls back to title and author when there is no ISBN", async () => {
    process.env.GOOGLE_BOOKS_API_KEY = "test-key";
    fetchMock.mockResolvedValue(res(googleFixture));

    await enrich({ ...thin, isbn13: undefined });
    const url = fetchMock.mock.calls[0][0];
    expect(url).toContain("intitle");
    expect(url).toContain("inauthor");
  });

  it("never lets an enrichment failure break the caller", async () => {
    process.env.GOOGLE_BOOKS_API_KEY = "test-key";

    fetchMock.mockRejectedValue(new Error("network"));
    await expect(enrich(thin)).resolves.toEqual(thin);

    fetchMock.mockResolvedValue(res(null, false, 429));
    await expect(enrich(thin)).resolves.toEqual(thin);
  });
});

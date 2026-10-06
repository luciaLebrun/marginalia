import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { must } from "../../../tests/must";

import searchFixture from "../../../tests/fixtures/openlibrary-search-dune.json";
import workFixture from "../../../tests/fixtures/openlibrary-work-dune.json";
import googleFixture from "../../../tests/fixtures/google-books-dune.json";
import redirectFixture from "../../../tests/fixtures/openlibrary-work-redirect.json";
import { fetchWork, searchWorks } from "./openlibrary";
import { enrich, fetchVolume } from "./google-books";
import type { BookDetail } from "./types";

/** Minimal stand-in for the bits of Response our code touches. */
function res(body: unknown, ok = true, status = 200) {
  return { ok, status, json: () => Promise.resolve(body) } as unknown as Response;
}

// A cache that stores only what returns, as unstable_cache does: a throw is not kept.
vi.mock("next/cache.js", () => ({
  unstable_cache: (fn: (url: string) => Promise<unknown>) => {
    const store = new Map<string, unknown>();
    stores.push(store);
    return async (url: string) => {
      if (store.has(url)) return store.get(url);
      const value = await fn(url);
      store.set(url, value);
      return value;
    };
  },
}));

const stores = vi.hoisted(() => [] as Map<string, unknown>[]);

const fetchMock = vi.fn<
  (...args: [url: string, init: { headers: Record<string, string>; next: { revalidate: number } }]) => Promise<unknown>
>();

beforeEach(() => {
  fetchMock.mockReset();
  for (const store of stores) store.clear();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GOOGLE_BOOKS_API_KEY;
});

describe("searchWorks", () => {
  it("short-circuits a blank query without touching the network", async () => {
    await expect(searchWorks({ title: "  ", author: "" })).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  /*
   * Open Library takes `title` and `author` as first-class parameters, so
   * since MRG-068 neither has to be guessed out of one free-text box.
   */
  it("scopes the title and the author to their own parameters", async () => {
    fetchMock.mockResolvedValue(res(searchFixture));
    await searchWorks({ title: "dune", author: "frank herbert" }, 5);

    const [url, init] = must(fetchMock.mock.calls[0]);
    expect(url).toContain("https://openlibrary.org/search.json");
    expect(url).toContain("title=dune");
    expect(url).toContain("author=frank+herbert");
    expect(url).not.toContain("q=");
    expect(url).toContain("limit=5");
    // Without an explicit field list the response is enormous.
    expect(url).toContain("key%2Ctitle");
    expect(url).toContain("cover_i");
    expect(init.headers["User-Agent"]).toContain("Marginalia");
  });

  it("sends only the field the reader filled", async () => {
    fetchMock.mockResolvedValue(res(searchFixture));
    await searchWorks({ title: "", author: "le guin" });
    const [url] = must(fetchMock.mock.calls[0]);
    expect(url).toContain("author=le+guin");
    expect(url).not.toContain("title=");
  });

  it("asks Next to cache for 24h, as Open Library requests", async () => {
    fetchMock.mockResolvedValue(res(searchFixture));
    await searchWorks({ title: "dune", author: "" });
    expect(fetchMock.mock.calls[0]?.[1].next.revalidate).toBe(86400);
  });

  it("returns normalized summaries", async () => {
    fetchMock.mockResolvedValue(res(searchFixture));
    const results = await searchWorks({ title: "dune", author: "" });
    expect(results).toHaveLength(3);
    expect(results[0]?.sourceKey).toBe("OL893415W");
  });

  it("throws with the status code when Open Library errors", async () => {
    fetchMock.mockResolvedValue(res(null, false, 503));
    await expect(searchWorks({ title: "dune", author: "" })).rejects.toThrow(/503/);
  });
});

describe("fetchWork", () => {
  it("combines the search summary with the work description", async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(res(url.includes("/search.json") ? searchFixture : workFixture)),
    );

    const detail = await fetchWork("/works/OL893415W");
    expect(detail).not.toBeNull();
    expect(must(detail).title).toBe("Dune");
    expect(must(detail).authors).toEqual(["Frank Herbert"]);
    expect(must(detail).description).toContain("Arrakis");
    expect(must(detail).coverId).toBe(11481354);
  });

  it("still returns a book when search is down but the work endpoint is up", async () => {
    fetchMock.mockImplementation((url: string) =>
      url.includes("/search.json")
        ? Promise.reject(new Error("search down"))
        : Promise.resolve(res(workFixture)),
    );

    const detail = await fetchWork("OL893415W");
    expect(must(detail).title).toBe("Dune");
    expect(must(detail).authors).toEqual([]);
  });

  it("follows a redirect stub to the surviving work", async () => {
    // OL893415W is a real redirect to OL893414W. Without following it we would
    // create a book row titled "OL893415W" with no author and no cover.
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/search.json")) return Promise.resolve(res(searchFixture));
      if (url.includes("OL893415W")) return Promise.resolve(res(redirectFixture));
      return Promise.resolve(res(workFixture));
    });

    const detail = await fetchWork("OL893415W");
    expect(must(detail).title).toBe("Dune");
    // The resolved key wins over the one the caller passed in.
    expect(must(detail).sourceKey).toBe("OL893414W");
    expect(must(detail).description).toContain("Arrakis");
  });

  it("gives up on a redirect cycle instead of looping forever", async () => {
    const a = { key: "/works/OLaW", type: { key: "/type/redirect" }, location: "/works/OLbW" };
    const b = { key: "/works/OLbW", type: { key: "/type/redirect" }, location: "/works/OLaW" };
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/search.json")) return Promise.resolve(res(searchFixture));
      return Promise.resolve(res(url.includes("OLaW") ? a : b));
    });

    await expect(fetchWork("OLaW")).resolves.toBeNull();
  });

  it("gives up on a redirect chain that is too long", async () => {
    let n = 0;
    fetchMock.mockImplementation((url: string) =>
      url.includes("/search.json")
        ? Promise.resolve(res(searchFixture))
        : Promise.resolve(
            res({
              key: `/works/OL${n}W`,
              type: { key: "/type/redirect" },
              location: `/works/OL${++n}W`,
            }),
          ),
    );

    await expect(fetchWork("OL0W")).resolves.toBeNull();
  });

  it("returns null for a work that genuinely does not exist (404)", async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        url.includes("/search.json") ? res(searchFixture) : res(null, false, 404),
      ),
    );
    await expect(fetchWork("OL000000W")).resolves.toBeNull();
  });

  it("throws when Open Library is erroring, so 'down' is not shown as 'not found'", async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        url.includes("/search.json") ? res(searchFixture) : res(null, false, 503),
      ),
    );
    await expect(fetchWork("OL893414W")).rejects.toThrow(/503/);
  });

  it("throws when the connection itself fails", async () => {
    // Open Library fails at the connection level often enough that this is the
    // common case, not the exotic one.
    fetchMock.mockImplementation((url: string) =>
      url.includes("/search.json")
        ? Promise.resolve(res(searchFixture))
        : Promise.reject(new TypeError("fetch failed")),
    );
    await expect(fetchWork("OL893414W")).rejects.toThrow(/fetch failed/);
  });
});

describe("enrich", () => {
  const thin: BookDetail = {
    sourceKey: "OL893415W",
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

  it("queries by plain ISBN, not isbn:, and enriches on a matching ISBN", async () => {
    process.env.GOOGLE_BOOKS_API_KEY = "test-key";
    fetchMock.mockResolvedValue(res(googleFixture));

    const enriched = await enrich(thin);
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("q=9780441013593");
    expect(url).not.toMatch(/isbn%3A|intitle|inauthor/);
    expect(enriched.pageCount).toBe(604);
    expect(enriched.source).toBe("openlibrary+google");
  });

  it("falls back to plain title and author when there is no ISBN", async () => {
    process.env.GOOGLE_BOOKS_API_KEY = "test-key";
    fetchMock.mockResolvedValue(res(googleFixture));

    const enriched = await enrich({ ...thin, isbn13: undefined });
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("q=Dune%20Herbert");
    expect(url).not.toMatch(/intitle|inauthor/);
    expect(enriched.pageCount).toBe(604);
  });

  it("rejects a wrong book: no enrichment", async () => {
    process.env.GOOGLE_BOOKS_API_KEY = "test-key";
    const wrong = {
      items: [
        {
          id: "zzzzzzzzzzzz",
          volumeInfo: {
            title: "Dunes of Mars",
            authors: ["Other Person"],
            pageCount: 99,
            industryIdentifiers: [{ type: "ISBN_13", identifier: "9781111111111" }],
          },
        },
      ],
    };
    fetchMock.mockResolvedValue(res(wrong));
    await expect(enrich(thin)).resolves.toEqual(thin);
    await expect(enrich({ ...thin, isbn13: undefined })).resolves.toEqual({ ...thin, isbn13: undefined });
  });

  it("does not cache a degraded title-only 200", async () => {
    process.env.GOOGLE_BOOKS_API_KEY = "test-key";
    const degraded = { items: [{ id: "B1hSG45JCX4C", volumeInfo: { title: "Dune" } }] };
    fetchMock.mockResolvedValueOnce(res(degraded));
    await expect(enrich(thin)).resolves.toEqual(thin);

    fetchMock.mockResolvedValueOnce(res(googleFixture));
    expect((await enrich(thin)).pageCount).toBe(604);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("fetchVolume (MRG-092)", () => {
  const volume = googleFixture.items[0];

  it("is a path lookup, not an operator query", async () => {
    fetchMock.mockResolvedValue(res(volume));
    const detail = await fetchVolume("B1hSG45JCX4C");
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("/volumes/B1hSG45JCX4C?");
    expect(url).not.toContain("q=");
    expect(detail?.pageCount).toBe(604);
  });

  it("returns null on 404", async () => {
    fetchMock.mockResolvedValue(res(null, false, 404));
    await expect(fetchVolume("missing00000")).resolves.toBeNull();
  });

  it("serves a degraded 200 but does not cache it", async () => {
    const degraded = { id: "degradedid01", volumeInfo: { title: "Dune" } };
    fetchMock.mockResolvedValue(res(degraded));
    const first = await fetchVolume("degradedid01");
    expect(first?.title).toBe("Dune");
    expect(first?.pageCount).toBeUndefined();

    fetchMock.mockClear();
    fetchMock.mockResolvedValue(res({ ...volume, id: "degradedid01" }));
    expect((await fetchVolume("degradedid01"))?.pageCount).toBe(604);
    expect(fetchMock).toHaveBeenCalled();
  });

  it("caches a healthy body", async () => {
    fetchMock.mockResolvedValue(res({ ...volume, id: "healthyid001" }));
    await fetchVolume("healthyid001");
    await fetchVolume("healthyid001");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("enrich failures", () => {
  const thin: BookDetail = {
    sourceKey: "OL893415W",
    title: "Dune",
    authors: ["Frank Herbert"],
    isbn13: "9780441013593",
    source: "openlibrary",
  };

  it("never lets an enrichment failure break the caller", async () => {
    process.env.GOOGLE_BOOKS_API_KEY = "test-key";

    fetchMock.mockRejectedValue(new Error("network"));
    await expect(enrich(thin)).resolves.toEqual(thin);

    fetchMock.mockResolvedValue(res(null, false, 429));
    await expect(enrich(thin)).resolves.toEqual(thin);
  });
});

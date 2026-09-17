import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import googleSearch from "../../../tests/fixtures/google-books-search-dune.json";
import openLibrarySearch from "../../../tests/fixtures/openlibrary-search-dune.json";
import { fetchBook, searchBooks } from "./index";

/**
 * The order the two sources are asked in, which is the whole of MRG-063:
 * Google Books first for relevance, Open Library when Google cannot answer.
 *
 * These drive `fetch` rather than injected functions on purpose — the ordering
 * only means anything if it is the real clients being ordered.
 */

function res(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as unknown as Response;
}

const fetchMock = vi.fn();

/** Which host each call went to, in order. */
function hosts(): string[] {
  return fetchMock.mock.calls.map(([url]) => new URL(url as string).hostname);
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  process.env.GOOGLE_BOOKS_API_KEY = "test-key";
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GOOGLE_BOOKS_API_KEY;
});

describe("searchBooks", () => {
  it("short-circuits a blank query without touching either source", async () => {
    await expect(searchBooks("   ")).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks Google first and stops there when it has answers", async () => {
    fetchMock.mockResolvedValue(res(googleSearch));

    const books = await searchBooks("dune herbert", 5);

    expect(hosts()).toEqual(["www.googleapis.com"]);
    expect(books[0].sourceKey).toBe("gb:B1hSG45JCX4C");
  });

  it("sends the key, and asks for books rather than magazine scans", async () => {
    fetchMock.mockResolvedValue(res(googleSearch));
    await searchBooks("dune", 5);

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("q=dune");
    expect(url).toContain("maxResults=5");
    expect(url).toContain("printType=books");
    expect(url).toContain("key=test-key");
  });

  /*
   * An obscure or non-English title is exactly where Google is weakest, and it
   * answers "nothing" rather than failing. A second query costs one request;
   * an empty page costs the reader their search.
   */
  it("falls through to Open Library when Google finds nothing", async () => {
    fetchMock
      .mockResolvedValueOnce(res({ kind: "books#volumes", totalItems: 0 }))
      .mockResolvedValueOnce(res(openLibrarySearch));

    const books = await searchBooks("dune herbert", 5);

    expect(hosts()).toEqual(["www.googleapis.com", "openlibrary.org"]);
    expect(books[0].sourceKey).toMatch(/^OL\d+W$/);
  });

  it("falls through to Open Library when Google errors", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock
      .mockResolvedValueOnce(res({}, false, 429))
      .mockResolvedValueOnce(res(openLibrarySearch));

    const books = await searchBooks("dune herbert", 5);

    expect(hosts()).toEqual(["www.googleapis.com", "openlibrary.org"]);
    expect(books.length).toBeGreaterThan(0);
    quiet.mockRestore();
  });

  /*
   * Keyless Google Books is rate limited per IP and Vercel shares egress IPs
   * between every project on it, so no key means Google is not asked at all.
   */
  it("does not touch Google without an API key", async () => {
    delete process.env.GOOGLE_BOOKS_API_KEY;
    fetchMock.mockResolvedValue(res(openLibrarySearch));

    await searchBooks("dune herbert", 5);

    expect(hosts()).toEqual(["openlibrary.org"]);
  });

  /*
   * By the time Open Library fails there is nothing left to fall back to, and
   * `runSearch` needs the throw to show "unavailable" rather than "no matches".
   */
  it("lets an Open Library failure through, so an outage is not shown as no matches", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue(res({}, false, 503));

    await expect(searchBooks("dune herbert", 5)).rejects.toThrow(/503/);
    quiet.mockRestore();
  });
});

describe("fetchBook", () => {
  it("sends a tagged key to Google and nowhere else", async () => {
    fetchMock.mockResolvedValue(res((googleSearch as { items: unknown[] }).items[0]));

    const book = await fetchBook("gb:B1hSG45JCX4C");

    expect(hosts()).toEqual(["www.googleapis.com"]);
    expect(fetchMock.mock.calls[0][0]).toContain("/volumes/B1hSG45JCX4C");
    expect(book?.title).toBe("Dune");
  });

  /*
   * No cross-source fallback: a key names one record at one source, and asking
   * the other for it would answer with a different book, or with none.
   */
  it("sends a bare work key to Open Library and nowhere else", async () => {
    fetchMock.mockResolvedValue(res({}, false, 404));

    await expect(fetchBook("OL893414W")).resolves.toBeNull();
    expect(hosts()).toEqual(["openlibrary.org"]);
  });
});

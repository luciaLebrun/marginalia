import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import googleSearch from "../../../tests/fixtures/google-books-search-dune.json";
import openLibrarySearch from "../../../tests/fixtures/openlibrary-search-dune.json";
import { fetchBook, searchBooks } from "./index";

/**
 * How the two sources combine, which is the whole of MRG-063 and MRG-067:
 * both are asked every time, and Google holds the top of the grid while Open
 * Library is guaranteed room below it.
 *
 * These drive `fetch` rather than injected functions on purpose — the merge
 * only means anything if it is the real clients being merged.
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

  /*
   * The fallback this replaced fired on absence and never on wrongness, so a
   * query Google ranked badly never reached Open Library at all. Asking both
   * every time is the only thing that fixes it — nothing here can tell a
   * confident wrong answer from a right one.
   */
  it("asks both sources, in parallel, and leads with Google", async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        url.includes("googleapis.com") ? res(googleSearch) : res(openLibrarySearch),
      ),
    );

    const books = await searchBooks("dune herbert", 20);

    expect(hosts().sort()).toEqual(["openlibrary.org", "www.googleapis.com"]);
    expect(books[0].sourceKey).toBe("gb:B1hSG45JCX4C");
    // Open Library's works are on the page too, not merely appended into space
    // that a full page of Google results would have left empty.
    expect(books.some((b) => /^OL\d+W$/.test(b.sourceKey))).toBe(true);
  });

  it("asks for books rather than magazine scans", async () => {
    fetchMock.mockResolvedValue(res(googleSearch));
    await searchBooks("dune", 5);

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("q=dune");
    expect(url).toContain("maxResults=5");
    expect(url).toContain("printType=books");
    // relevance is the documented default; passing it is noise.
    expect(url).not.toContain("orderBy");
  });

  /*
   * A URL reaches error messages, server logs and Next's cache key. The key
   * therefore travels in a header and must never appear in the query string —
   * `searchBooks()` logs its error on the fallback path, so a `?key=` there
   * would put the credential in Vercel's runtime logs on every Google outage.
   */
  it("sends the key as a header and never in the URL", async () => {
    fetchMock.mockResolvedValue(res(googleSearch));
    await searchBooks("dune", 5);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).not.toContain("test-key");
    expect(url).not.toContain("key=");
    expect(init.headers["X-Goog-Api-Key"]).toBe("test-key");
  });

  it("keeps the key out of the error a failure logs", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock
      .mockResolvedValueOnce(res({}, false, 403))
      .mockResolvedValueOnce(res(openLibrarySearch));

    await searchBooks("dune", 5);

    const logged = quiet.mock.calls.flat().map(String).join(" ");
    expect(logged).not.toContain("test-key");
    quiet.mockRestore();
  });

  it("gives the whole page to Open Library when Google finds nothing", async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        url.includes("googleapis.com")
          ? res({ kind: "books#volumes", totalItems: 0 })
          : res(openLibrarySearch),
      ),
    );

    const books = await searchBooks("dune herbert", 20);

    expect(books.length).toBeGreaterThan(0);
    expect(books.every((b) => /^OL\d+W$/.test(b.sourceKey))).toBe(true);
  });

  it("stands on Open Library alone when Google errors", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(url.includes("googleapis.com") ? res({}, false, 429) : res(openLibrarySearch)),
    );

    const books = await searchBooks("dune herbert", 20);

    expect(books.length).toBeGreaterThan(0);
    expect(books.every((b) => /^OL\d+W$/.test(b.sourceKey))).toBe(true);
    quiet.mockRestore();
  });

  /* The mirror case: Open Library is the flakier of the two, and its outage
     must not take the reader's search down when Google answered fine. */
  it("stands on Google alone when Open Library errors", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(url.includes("googleapis.com") ? res(googleSearch) : res({}, false, 503)),
    );

    const books = await searchBooks("dune herbert", 20);

    expect(books.length).toBeGreaterThan(0);
    expect(books.every((b) => b.sourceKey.startsWith("gb:"))).toBe(true);
    quiet.mockRestore();
  });

  /*
   * Keyless Google Books is rate limited per IP and Vercel shares egress IPs
   * between every project on it, so no key means Google is not asked at all.
   */
  it("does not touch Google without an API key", async () => {
    delete process.env.GOOGLE_BOOKS_API_KEY;
    fetchMock.mockResolvedValue(res(openLibrarySearch));

    await searchBooks("dune herbert", 20);

    expect(hosts()).toEqual(["openlibrary.org"]);
  });

  /*
   * By the time Open Library fails there is nothing left to fall back to, and
   * `runSearch` needs the throw to show "unavailable" rather than "no matches".
   */
  it("throws only when BOTH sources fail, so an outage is not shown as no matches", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue(res({}, false, 503));

    await expect(searchBooks("dune herbert", 20)).rejects.toThrow(/503/);
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

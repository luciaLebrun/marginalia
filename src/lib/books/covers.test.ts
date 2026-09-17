import { describe, expect, it } from "vitest";

import { coverUrl, jacket, sampleUrl } from "./covers";

describe("coverUrl", () => {
  it("builds a CoverID URL, which is the unrestricted path", () => {
    expect(coverUrl(240727, "L")).toBe(
      "https://covers.openlibrary.org/b/id/240727-L.jpg",
    );
  });

  it("defaults to medium", () => {
    expect(coverUrl(240727)).toBe(
      "https://covers.openlibrary.org/b/id/240727-M.jpg",
    );
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["zero", 0],
    ["negative", -1],
    ["non-integer", 12.5],
  ])("returns null for %s so callers must render a placeholder", (_label, input) => {
    expect(coverUrl(input as number | null | undefined)).toBeNull();
  });

  it("never emits an ISBN-addressed URL, which is rate limited to 100/IP/5min", () => {
    for (const size of ["S", "M", "L"] as const) {
      const url = coverUrl(240727, size);
      expect(url).not.toBeNull();
      expect(url).toContain("/b/id/");
      expect(url).not.toContain("/b/isbn/");
    }
  });
});

describe("jacket", () => {
  /*
   * Open Library serves a size ladder, so it gets a real srcset. Google hands
   * out one URL per volume, so a Google jacket is a single src — there is
   * nothing for the browser to choose from.
   */
  it("gives an Open Library cover its srcset", () => {
    expect(jacket({ coverId: 11481354 })).toEqual({
      src: "https://covers.openlibrary.org/b/id/11481354-L.jpg",
      srcSet:
        "https://covers.openlibrary.org/b/id/11481354-M.jpg 180w, https://covers.openlibrary.org/b/id/11481354-L.jpg 500w",
    });
  });

  it("gives a Google jacket one src and no srcset", () => {
    const url = "https://books.google.com/books/content?id=X&zoom=2";
    expect(jacket({ coverUrl: url })).toEqual({ src: url, srcSet: undefined });
  });

  it("prefers the stored URL, so a row keeps rendering from its own source", () => {
    const url = "https://books.google.com/books/content?id=X&zoom=2";
    expect(jacket({ coverId: 11481354, coverUrl: url })?.src).toBe(url);
  });

  it("returns null for a book with no jacket at all", () => {
    expect(jacket({})).toBeNull();
    expect(jacket({ coverId: null, coverUrl: null })).toBeNull();
    expect(jacket({ coverId: 0 })).toBeNull();
  });
});

describe("sampleUrl", () => {
  /*
   * The band colour is sampled from the smallest jacket we can get: a 180px
   * scan decodes in a fraction of the time a 500px one does, for the same hue.
   */
  it("samples Open Library at M, never at L and never by ISBN", () => {
    const url = sampleUrl({ coverId: 11481354 });
    expect(url).toBe("https://covers.openlibrary.org/b/id/11481354-M.jpg");
    expect(url).not.toContain("/b/isbn/");
  });

  it("samples a Google book from the one jacket it has", () => {
    const url = "https://books.google.com/books/content?id=X&zoom=2";
    expect(sampleUrl({ coverUrl: url })).toBe(url);
  });

  it("is null for a book with no jacket, so no colour is attempted", () => {
    expect(sampleUrl({})).toBeNull();
  });
});

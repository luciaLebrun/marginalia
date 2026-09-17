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

  /*
   * Google serves a ladder too, reached by `w` rather than a size letter. It
   * must not ship one fixed rendition: a 256px scan upscaled into the 768
   * device px frontispiece is the softness "-L.jpg" was added to fix on a
   * smaller element.
   */
  it("gives a Google jacket a real srcset, asked for by width", () => {
    const art = jacket({ coverUrl: "https://books.google.com/books/content?id=X&zoom=2" });

    expect(art?.src).toContain("w=800");
    expect(art?.srcSet).toContain("w=256 256w");
    expect(art?.srcSet).toContain("w=512 512w");
    expect(art?.srcSet).toContain("w=800 800w");
    // The zoom ladder tops out at 300px wide; it is dropped, never tuned.
    expect(art?.srcSet).not.toContain("zoom");
  });

  it("prefers the stored URL, so a row keeps rendering from its own source", () => {
    const url = "https://books.google.com/books/content?id=X&zoom=2";
    expect(jacket({ coverId: 11481354, coverUrl: url })?.src).toContain("id=X");
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

  it("samples a Google book at the narrowest width, not the shipping one", () => {
    const url = sampleUrl({ coverUrl: "https://books.google.com/books/content?id=X&zoom=2" });
    expect(url).toContain("w=256");
    expect(url).not.toContain("w=800");
  });

  it("is null for a book with no jacket, so no colour is attempted", () => {
    expect(sampleUrl({})).toBeNull();
  });
});

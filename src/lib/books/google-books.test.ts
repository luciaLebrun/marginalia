import { describe, expect, it } from "vitest";

import googleFixture from "../../../tests/fixtures/google-books-dune.json";
import { buildQuery, mergeGoogleVolume } from "./google-books";
import type { BookDetail } from "./types";

const base: BookDetail = {
  olWorkKey: "OL893415W",
  title: "Dune",
  authors: ["Frank Herbert"],
  source: "openlibrary",
};

describe("mergeGoogleVolume", () => {
  it("fills the gaps and marks the row as enriched", () => {
    const merged = mergeGoogleVolume(base, googleFixture);
    expect(merged.pageCount).toBe(604);
    expect(merged.description).toContain("deluxe hardcover");
    expect(merged.source).toBe("openlibrary+google");
  });

  it("never overwrites a value Open Library already gave us", () => {
    const merged = mergeGoogleVolume(
      { ...base, description: "From Open Library", pageCount: 412 },
      googleFixture,
    );
    expect(merged.description).toBe("From Open Library");
    expect(merged.pageCount).toBe(412);
    expect(merged.source).toBe("openlibrary");
  });

  it("returns the input unchanged for an empty or malformed body", () => {
    expect(mergeGoogleVolume(base, {})).toEqual(base);
    expect(mergeGoogleVolume(base, { items: [] })).toEqual(base);
    expect(mergeGoogleVolume(base, null)).toEqual(base);
    expect(mergeGoogleVolume(base, { items: [{}] })).toEqual(base);
  });

  it("ignores a nonsensical page count", () => {
    const merged = mergeGoogleVolume(base, {
      items: [{ volumeInfo: { pageCount: 0 } }],
    });
    expect(merged.pageCount).toBeUndefined();
  });
});

describe("buildQuery", () => {
  it("prefers the ISBN, which is an exact match", () => {
    expect(buildQuery({ ...base, isbn13: "9780441013593" })).toBe(
      "isbn:9780441013593",
    );
  });

  it("falls back to title narrowed by the first author", () => {
    expect(buildQuery(base)).toBe("intitle:Dune+inauthor:Frank Herbert");
  });

  it("omits the author clause when there is no author", () => {
    expect(buildQuery({ ...base, authors: [] })).toBe("intitle:Dune");
  });
});

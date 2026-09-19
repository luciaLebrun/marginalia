import { describe, expect, it } from "vitest";

import googleFixture from "../../../tests/fixtures/google-books-dune.json";
import searchFixture from "../../../tests/fixtures/google-books-search-dune.json";
import {
  buildQuery,
  buildSearchQuery,
  jacketFromImageLinks,
  mergeGoogleVolume,
  withJacketWidth,
  normalizeSearchResponse,
  normalizeVolume,
  parseVolumeId,
  pickIsbn13,
  publishYear,
} from "./google-books";
import type { BookDetail } from "./types";

const base: BookDetail = {
  sourceKey: "OL893415W",
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

describe("parseVolumeId", () => {
  it("accepts a tagged volume id and hands back the bare one", () => {
    expect(parseVolumeId("gb:B1hSG45JCX4C")).toBe("B1hSG45JCX4C");
    expect(parseVolumeId("gb:aZ-_09XyZabc")).toBe("aZ-_09XyZabc");
  });

  it("ignores an untagged key, which belongs to the other source", () => {
    expect(parseVolumeId("OL893414W")).toBeNull();
  });

  /*
   * The id is interpolated into a Google Books path. Anything that could steer
   * that path to another resource has to stop here.
   */
  it("refuses anything that is not a bare id", () => {
    expect(parseVolumeId("gb:")).toBeNull();
    expect(parseVolumeId("gb:../../oauth")).toBeNull();
    expect(parseVolumeId("gb:B1hSG45JCX4C/other")).toBeNull();
    expect(parseVolumeId("gb:B1hSG.JCX4C")).toBeNull();
    expect(parseVolumeId("gb:short")).toBeNull();
  });
});

describe("withJacketWidth", () => {
  /*
   * Measured against a live volume: zoom=1 and zoom=5 BOTH return 128x192, and
   * zoom=2 returns 300x462, while w=800 returns 800x1232 and w=1280 returns
   * 1280x1972. `zoom` is a short ladder of small renditions whose highest
   * number is not the largest image, so it is dropped rather than tuned.
   */
  it("asks by width and drops the zoom ladder entirely", () => {
    const url = withJacketWidth(
      "https://books.google.com/books/content?id=X&zoom=5",
      800,
    );
    expect(url).toContain("w=800");
    expect(url).not.toContain("zoom");
  });

  it("replaces a width already on the URL rather than adding a second", () => {
    const url = withJacketWidth("https://books.google.com/books/content?id=X&w=256", 800);
    expect(url).toContain("w=800");
    expect(url).not.toContain("w=256");
  });

  it("keeps the volume id and the rest of the query", () => {
    const url = withJacketWidth(
      "https://books.google.com/books/content?id=X&printsec=frontcover&img=1",
      512,
    );
    expect(url).toContain("id=X");
    expect(url).toContain("printsec=frontcover");
    expect(url).toContain("img=1");
  });

  /* A caller must not be able to rewrite an Open Library address by accident. */
  it("leaves a URL that is not Google's untouched", () => {
    const ol = "https://covers.openlibrary.org/b/id/1-M.jpg";
    expect(withJacketWidth(ol, 800)).toBe(ol);
    expect(withJacketWidth("not a url", 800)).toBe("not a url");
  });
});

describe("jacketFromImageLinks", () => {
  /*
   * Every imageLinks entry addresses the same scan and differs only in the
   * rendition asked for, so the key picked does not matter — the width does.
   */
  it("canonicalises any entry to the shipping width", () => {
    const fromThumb = jacketFromImageLinks({
      thumbnail: "https://books.google.com/books/content?id=X&zoom=1",
    });
    const fromLarge = jacketFromImageLinks({
      large: "https://books.google.com/books/content?id=X&zoom=4",
    });
    expect(fromThumb).toContain("w=800");
    expect(fromLarge).toContain("w=800");
  });

  /*
   * smallThumbnail is 128px wide however "large" its zoom number looks, which
   * is the trap: taking it as-is shipped an ~80-128px image into a 768 device
   * px well.
   */
  it("rescues a volume that offers only smallThumbnail", () => {
    const url = jacketFromImageLinks({
      smallThumbnail: "http://books.google.com/books/content?id=X&zoom=5",
    });
    expect(url).toContain("w=800");
    expect(url).not.toContain("zoom");
  });

  /*
   * Google hands these out over plain http and with a page-curl graphic burnt
   * into the edge. The first is mixed content on an https page; the second is
   * a picture of a book rather than a jacket.
   */
  it("forces https and drops the page curl", () => {
    const url = jacketFromImageLinks({
      thumbnail:
        "http://books.google.com/books/content?id=X&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
    });
    expect(url).toContain("https://books.google.com/");
    expect(url).not.toContain("edge=curl");
  });

  /*
   * This value becomes an <img src> on a public page, so it is a trust
   * boundary: only Google may be pointed at from it.
   */
  it("refuses a link to any host but Google, and anything unparseable", () => {
    expect(jacketFromImageLinks({ thumbnail: "https://evil.example/x.jpg" })).toBeUndefined();
    expect(jacketFromImageLinks({ thumbnail: "https://notgoogle.com/x.jpg" })).toBeUndefined();
    expect(jacketFromImageLinks({ thumbnail: "not a url" })).toBeUndefined();
    expect(jacketFromImageLinks({ thumbnail: 42 as unknown as string })).toBeUndefined();
    expect(jacketFromImageLinks(undefined)).toBeUndefined();
  });
});

describe("publishYear", () => {
  it("takes the year out of every shape Google uses", () => {
    expect(publishYear("1965")).toBe(1965);
    expect(publishYear("1965-06")).toBe(1965);
    expect(publishYear("1965-06-01")).toBe(1965);
  });

  it("returns undefined rather than a nonsense year", () => {
    expect(publishYear("")).toBeUndefined();
    expect(publishYear("n.d.")).toBeUndefined();
    expect(publishYear(1965)).toBeUndefined();
    expect(publishYear(undefined)).toBeUndefined();
  });
});

describe("pickIsbn13", () => {
  it("takes the ISBN-13 and ignores the ISBN-10 beside it", () => {
    expect(
      pickIsbn13([
        { type: "ISBN_10", identifier: "0441013597" },
        { type: "ISBN_13", identifier: "9780441013593" },
      ]),
    ).toBe("9780441013593");
  });

  it("refuses an ISBN-13 that is not thirteen digits, and a missing list", () => {
    expect(pickIsbn13([{ type: "ISBN_13", identifier: "97804410135" }])).toBeUndefined();
    expect(pickIsbn13([{ type: "OTHER", identifier: "9780441013593" }])).toBeUndefined();
    expect(pickIsbn13(undefined)).toBeUndefined();
  });
});

describe("normalizeVolume", () => {
  const items = (searchFixture as { items: unknown[] }).items;

  it("tags the key with its source, so a book page knows where to look", () => {
    expect(normalizeVolume(items[0])?.sourceKey).toBe("gb:B1hSG45JCX4C");
  });

  it("carries every field we persist across", () => {
    expect(normalizeVolume(items[0])).toEqual({
      sourceKey: "gb:B1hSG45JCX4C",
      title: "Dune",
      subtitle: undefined,
      authors: ["Frank Herbert"],
      firstPublishYear: 1965,
      coverUrl: expect.stringContaining("w=800"),
      isbn13: "9780441013593",
      pageCount: 604,
      description: "Set on the desert planet Arrakis.",
      source: "google",
    });
  });

  it("leaves a volume without a jacket or a description unfilled, not empty", () => {
    const messiah = normalizeVolume(items[1]);
    expect(messiah?.subtitle).toBe("Book Two");
    expect(messiah?.coverUrl).toBeUndefined();
    expect(messiah?.description).toBeUndefined();
    expect(messiah?.pageCount).toBeUndefined();
  });

  /*
   * A volume with no id cannot be linked to and one with no title cannot be
   * listed, so it is dropped rather than half-rendered — the rule Open
   * Library's normalizer keeps.
   */
  it("drops a volume too thin to render", () => {
    expect(normalizeVolume(items[2])).toBeNull();
    expect(normalizeVolume({ volumeInfo: { title: "No id" } })).toBeNull();
    expect(normalizeVolume(undefined)).toBeNull();
  });
});

describe("normalizeSearchResponse", () => {
  it("returns the volumes that can be rendered and silently skips the rest", () => {
    const books = normalizeSearchResponse(searchFixture);
    expect(books.map((b) => b.title)).toEqual(["Dune", "Dune Messiah"]);
  });

  it("returns [] for the body Google sends when nothing matched", () => {
    expect(normalizeSearchResponse({ kind: "books#volumes", totalItems: 0 })).toEqual([]);
    expect(normalizeSearchResponse(null)).toEqual([]);
  });
});

describe("buildSearchQuery", () => {
  /*
   * Measured live 2026-09-19: the free-text `the dispossessed` returns no Le
   * Guin in twenty results, while the scoped form returns her novel first.
   * That gap is the whole of MRG-068.
   */
  it("scopes each field to its own operator", () => {
    expect(buildSearchQuery({ title: "dune", author: "herbert" })).toBe(
      'intitle:"dune" inauthor:"herbert"',
    );
  });

  it("quotes a multi-word term so it stays one phrase", () => {
    // Unquoted this means "the" in the title AND "dispossessed" anywhere.
    expect(buildSearchQuery({ title: "the dispossessed", author: "" })).toBe(
      'intitle:"the dispossessed"',
    );
  });

  it("sends only the field the reader filled", () => {
    expect(buildSearchQuery({ title: "", author: "le guin" })).toBe('inauthor:"le guin"');
  });

  it("is empty for an empty query, so no request is made", () => {
    expect(buildSearchQuery({ title: "", author: "" })).toBe("");
    expect(buildSearchQuery({ title: "  ", author: "\t" })).toBe("");
  });

  /*
   * Google has no escape inside a phrase, so an interior quote would end the
   * phrase early and leak the rest of the title into the free-text part.
   */
  it("drops interior quotes rather than letting them close the phrase", () => {
    const q = buildSearchQuery({ title: 'a "good" book', author: "" });
    expect(q).toBe('intitle:"a good book"');
    expect(q.match(/"/g)).toHaveLength(2);
  });
});

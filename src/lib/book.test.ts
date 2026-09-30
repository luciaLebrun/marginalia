import { describe, expect, it, vi } from "vitest";

import type { BookDetail } from "@/lib/books";
import { openBook, parseBookKey, toBookRow, type BookSources } from "./book";

describe("parseBookKey", () => {
  it("accepts a bare Open Library work key", () => {
    expect(parseBookKey("OL893414W")).toBe("OL893414W");
  });

  it("accepts the /works/ form and strips it, as every boundary must", () => {
    expect(parseBookKey("/works/OL893414W")).toBe("OL893414W");
    expect(parseBookKey("  OL893414W ")).toBe("OL893414W");
  });

  it("accepts a tagged Google Books volume", () => {
    expect(parseBookKey("gb:B1hSG45JCX4C")).toBe("gb:B1hSG45JCX4C");
    expect(parseBookKey("gb:aZ-_09XyZabc")).toBe("gb:aZ-_09XyZabc");
  });

  /*
   * The bug this exists for: Next hands a page's dynamic segment
   * percent-encoded and a route handler the same segment decoded. A Google key
   * carries a colon, so every Google book arrived as `gb%3A…`, failed this
   * guard and opened as "not found" — while Open Library's bare keys, which
   * encode to themselves, worked throughout.
   */
  it("accepts a segment as a page receives it, percent-encoded", () => {
    expect(parseBookKey("gb%3AB1hSG45JCX4C")).toBe("gb:B1hSG45JCX4C");
    expect(parseBookKey("gb%3aB1hSG45JCX4C")).toBe("gb:B1hSG45JCX4C");
    expect(parseBookKey("%2Fworks%2FOL893414W")).toBe("OL893414W");
  });

  /* Decoding happens before validation, so it must not open a way past it. */
  it("refuses an encoded path once it is decoded", () => {
    expect(parseBookKey("gb%3A..%2F..%2Fsearch")).toBeNull();
    expect(parseBookKey("gb:..%2F..%2Fsearch")).toBeNull();
    expect(parseBookKey("OL893414W%2Feditions")).toBeNull();
    expect(parseBookKey("%2E%2E%2Fsearch")).toBeNull();
  });

  /* A malformed escape is refused, not thrown out of the guard. */
  it("refuses a malformed escape rather than throwing", () => {
    expect(parseBookKey("gb:%E0%A4%A")).toBeNull();
    expect(parseBookKey("%")).toBeNull();
  });

  it("refuses keys for things that are not works", () => {
    expect(parseBookKey("OL7353617M")).toBeNull(); // an edition
    expect(parseBookKey("OL23919A")).toBeNull(); // an author
  });

  /*
   * The key is interpolated into an upstream path, so anything that is not
   * exactly a key at one of the two sources must stop here rather than reach
   * the network. A "gb:" prefix must never fall through to the Open Library
   * branch either — that is how a Google-shaped attack would get two tries.
   */
  it("refuses anything that could address a different resource", () => {
    expect(parseBookKey("../search")).toBeNull();
    expect(parseBookKey("OL893414W/editions")).toBeNull();
    expect(parseBookKey("OL893414W.json")).toBeNull();
    expect(parseBookKey("")).toBeNull();
    expect(parseBookKey("OLW")).toBeNull();
    expect(parseBookKey("ol893414w")).toBeNull();
    expect(parseBookKey("gb:../../oauth")).toBeNull();
    expect(parseBookKey("gb:B1hSG45JCX4C/other")).toBeNull();
    expect(parseBookKey("gb:")).toBeNull();
  });
});

describe("toBookRow", () => {
  const full: BookDetail = {
    sourceKey: "OL893414W",
    olEditionKey: "OL7353617M",
    title: "Dune",
    subtitle: "Deluxe Edition",
    authors: ["Frank Herbert"],
    firstPublishYear: 1965,
    coverId: 240727,
    isbn13: "9780441013593",
    editionCount: 120,
    pageCount: 604,
    description: "Set on the desert planet Arrakis.",
    category: "Science Fiction",
    source: "openlibrary+google",
  };

  it("carries every persisted field across, and the derived colour", () => {
    expect(toBookRow(full, "#8a4b2f")).toEqual({
      sourceKey: "OL893414W",
      olEditionKey: "OL7353617M",
      title: "Dune",
      subtitle: "Deluxe Edition",
      authors: ["Frank Herbert"],
      firstPublishYear: 1965,
      coverId: 240727,
      coverUrl: null,
      coverColor: "#8a4b2f",
      isbn13: "9780441013593",
      pageCount: 604,
      description: "Set on the desert planet Arrakis.",
      category: "Science Fiction",
      source: "openlibrary+google",
    });
  });

  it("writes what Open Library did not have as null, never undefined", () => {
    const row = toBookRow(
      { sourceKey: "OL1W", title: "Thin", authors: [], source: "openlibrary" },
      null,
    );
    for (const field of [
      "olEditionKey",
      "subtitle",
      "firstPublishYear",
      "coverId",
      "coverUrl",
      "coverColor",
      "isbn13",
      "pageCount",
      "description",
    ] as const) {
      expect(row[field]).toBeNull();
    }
  });

  it("leaves the id and timestamp to the insert", () => {
    const row = toBookRow(full, null);
    expect(row).not.toHaveProperty("id");
    expect(row).not.toHaveProperty("cachedAt");
  });
});

describe("openBook", () => {
  it("answers not-found for a malformed key without reaching anything", async () => {
    const sources: BookSources = {
      fetchBook: vi.fn(),
      enrich: vi.fn(),
      bandColor: vi.fn(),
    };

    await expect(openBook("../search", sources)).resolves.toEqual({ kind: "not-found" });
    expect(sources.fetchBook).not.toHaveBeenCalled();
  });
});

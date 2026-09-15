import { describe, expect, it, vi } from "vitest";

import type { BookDetail } from "@/lib/books";
import { openBook, parseWorkKey, toBookRow, type BookSources } from "./book";

describe("parseWorkKey", () => {
  it("accepts a bare work key", () => {
    expect(parseWorkKey("OL893414W")).toBe("OL893414W");
  });

  it("accepts the /works/ form and strips it, as every boundary must", () => {
    expect(parseWorkKey("/works/OL893414W")).toBe("OL893414W");
    expect(parseWorkKey("  OL893414W ")).toBe("OL893414W");
  });

  it("refuses keys for things that are not works", () => {
    expect(parseWorkKey("OL7353617M")).toBeNull(); // an edition
    expect(parseWorkKey("OL23919A")).toBeNull(); // an author
  });

  /*
   * The key is interpolated into an Open Library path, so anything that is not
   * exactly a work key must stop here rather than reach the network.
   */
  it("refuses anything that could address a different resource", () => {
    expect(parseWorkKey("../search")).toBeNull();
    expect(parseWorkKey("OL893414W/editions")).toBeNull();
    expect(parseWorkKey("OL893414W.json")).toBeNull();
    expect(parseWorkKey("")).toBeNull();
    expect(parseWorkKey("OLW")).toBeNull();
    expect(parseWorkKey("ol893414w")).toBeNull();
  });
});

describe("toBookRow", () => {
  const full: BookDetail = {
    olWorkKey: "OL893414W",
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
    source: "openlibrary+google",
  };

  it("carries every persisted field across, and the derived colour", () => {
    expect(toBookRow(full, "#8a4b2f")).toEqual({
      olWorkKey: "OL893414W",
      olEditionKey: "OL7353617M",
      title: "Dune",
      subtitle: "Deluxe Edition",
      authors: ["Frank Herbert"],
      firstPublishYear: 1965,
      coverId: 240727,
      coverColor: "#8a4b2f",
      isbn13: "9780441013593",
      pageCount: 604,
      description: "Set on the desert planet Arrakis.",
      source: "openlibrary+google",
    });
  });

  it("writes what Open Library did not have as null, never undefined", () => {
    const row = toBookRow(
      { olWorkKey: "OL1W", title: "Thin", authors: [], source: "openlibrary" },
      null,
    );
    for (const field of [
      "olEditionKey",
      "subtitle",
      "firstPublishYear",
      "coverId",
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
      fetchWork: vi.fn(),
      enrich: vi.fn(),
      bandColor: vi.fn(),
    };

    await expect(openBook("../search", sources)).resolves.toEqual({ kind: "not-found" });
    expect(sources.fetchWork).not.toHaveBeenCalled();
  });
});

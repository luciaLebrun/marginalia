import { afterEach, describe, expect, it, vi } from "vitest";

import fixture from "../../tests/fixtures/openlibrary-search-dune.json";
import { OpenLibraryError } from "@/lib/books";
import { normalizeSearchResponse } from "@/lib/books/openlibrary";
import {
  MAX_QUERY_LENGTH,
  SEARCH_LIMIT,
  bandText,
  bookPath,
  parseQuery,
  runSearch,
  type Search,
} from "./search";

const dune = normalizeSearchResponse(fixture);

describe("parseQuery", () => {
  it("reads a plain query", () => {
    expect(parseQuery("dune")).toBe("dune");
  });

  it("treats a missing or unusable value as the blank query", () => {
    expect(parseQuery(undefined)).toBe("");
    expect(parseQuery(42)).toBe("");
    expect(parseQuery({ q: "dune" })).toBe("");
    expect(parseQuery([])).toBe("");
  });

  it("takes the first value when the parameter is repeated", () => {
    expect(parseQuery(["dune", "emma"])).toBe("dune");
  });

  it("trims and collapses whitespace", () => {
    expect(parseQuery("  frank   herbert \n dune ")).toBe("frank herbert dune");
    expect(parseQuery("   ")).toBe("");
  });

  it("cuts a pasted paragraph down to a search", () => {
    const parsed = parseQuery(`${"a".repeat(MAX_QUERY_LENGTH - 1)} ${"b".repeat(50)}`);
    expect(parsed.length).toBeLessThanOrEqual(MAX_QUERY_LENGTH);
    // Never ends on the space the cut landed beside.
    expect(parsed).not.toMatch(/\s$/);
  });
});

describe("runSearch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not search for the blank query", async () => {
    const search = vi.fn<Search>();
    expect(await runSearch("", search)).toEqual({ kind: "blank" });
    expect(search).not.toHaveBeenCalled();
  });

  it("asks for SEARCH_LIMIT works and returns them", async () => {
    const search = vi.fn<Search>().mockResolvedValue(dune);
    const outcome = await runSearch("dune", search);

    expect(search).toHaveBeenCalledWith("dune", SEARCH_LIMIT);
    expect(outcome).toEqual({
      kind: "results",
      query: "dune",
      books: dune,
      limited: false,
    });
  });

  it("marks a full page as limited, so the reader knows to narrow it", async () => {
    const full = Array.from({ length: SEARCH_LIMIT }, (_, i) => ({
      ...dune[0],
      olWorkKey: `OL${i}W`,
    }));
    const outcome = await runSearch("dune", vi.fn<Search>().mockResolvedValue(full));
    expect(outcome).toMatchObject({ kind: "results", limited: true });
  });

  it("reports no matches as none", async () => {
    const outcome = await runSearch("zzqx", vi.fn<Search>().mockResolvedValue([]));
    expect(outcome).toEqual({ kind: "none", query: "zzqx" });
  });

  /*
   * The distinction the page exists to keep: an outage is not "no such book".
   */
  it("reports an Open Library error status as unavailable, not none", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const search = vi
      .fn<Search>()
      .mockRejectedValue(new OpenLibraryError(503, "https://openlibrary.org/search.json"));

    expect(await runSearch("dune", search)).toEqual({
      kind: "unavailable",
      query: "dune",
    });
  });

  it("reports a transport failure as unavailable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const search = vi.fn<Search>().mockRejectedValue(new TypeError("fetch failed"));
    expect(await runSearch("dune", search)).toMatchObject({ kind: "unavailable" });
  });
});

describe("bandText", () => {
  it("guides a blank search", () => {
    expect(bandText({ kind: "blank" })).toBe("A title, an author, or both");
  });

  it("counts results, singular and plural", () => {
    const one = { kind: "results", query: "q", books: dune.slice(0, 1), limited: false } as const;
    const many = { kind: "results", query: "q", books: dune, limited: false } as const;
    expect(bandText(one)).toBe("1 book");
    expect(bandText(many)).toBe(`${dune.length} books`);
  });

  it("tells a limited search how to narrow", () => {
    expect(
      bandText({ kind: "results", query: "q", books: dune, limited: true }),
    ).toBe(`First ${dune.length} — add the author to narrow it`);
  });

  it("names none and unavailable differently", () => {
    expect(bandText({ kind: "none", query: "q" })).toBe("No matches");
    expect(bandText({ kind: "unavailable", query: "q" })).toBe("Search unavailable");
  });
});

describe("bookPath", () => {
  it("addresses the book page by bare work key", () => {
    expect(bookPath("OL893414W")).toBe("/book/OL893414W");
  });
});

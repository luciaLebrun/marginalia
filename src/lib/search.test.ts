import { afterEach, describe, expect, it, vi } from "vitest";

import fixture from "../../tests/fixtures/openlibrary-search-dune.json";
import { OpenLibraryError } from "@/lib/books";
import { normalizeSearchResponse } from "@/lib/books/openlibrary";
import {
  MAX_QUERY_LENGTH,
  MAX_SHOWN,
  SEARCH_LIMIT,
  bandText,
  endLine,
  isBlank,
  noMatch,
  parseQuery,
  parseShown,
  parseTerm,
  queryPhrase,
  runSearch,
  type BookQuery,
  type Search,
} from "./search";

const dune = normalizeSearchResponse(fixture);
const q = (title: string, author = ""): BookQuery => ({ title, author });

describe("parseTerm", () => {
  it("reads a plain term", () => {
    expect(parseTerm("dune")).toBe("dune");
  });

  it("treats a missing or unusable value as the blank term", () => {
    expect(parseTerm(undefined)).toBe("");
    expect(parseTerm(42)).toBe("");
    expect(parseTerm({ q: "dune" })).toBe("");
    expect(parseTerm([])).toBe("");
  });

  it("takes the first value when the parameter is repeated", () => {
    expect(parseTerm(["dune", "emma"])).toBe("dune");
  });

  it("trims and collapses whitespace", () => {
    expect(parseTerm("  the   left hand \n of darkness ")).toBe(
      "the left hand of darkness",
    );
    expect(parseTerm("   ")).toBe("");
  });

  it("cuts a pasted paragraph down to a search", () => {
    const parsed = parseTerm(`${"a".repeat(MAX_QUERY_LENGTH - 1)} ${"b".repeat(50)}`);
    expect(parsed.length).toBeLessThanOrEqual(MAX_QUERY_LENGTH);
    // Never ends on the space the cut landed beside.
    expect(parsed).not.toMatch(/\s$/);
  });
});

describe("parseQuery", () => {
  it("reads the two fields apart", () => {
    expect(parseQuery({ title: "dune", author: "herbert" })).toEqual({
      title: "dune",
      author: "herbert",
    });
  });

  it("accepts either field alone", () => {
    expect(parseQuery({ title: "piranesi" })).toEqual({ title: "piranesi", author: "" });
    expect(parseQuery({ author: "le guin" })).toEqual({ title: "", author: "le guin" });
  });

  /* An old bookmark of ?q= carries nothing usable, and must land on a blank
     search rather than an error. */
  it("ignores a parameter it does not know", () => {
    expect(parseQuery({ q: "dune herbert" } as never)).toEqual({ title: "", author: "" });
  });
});

describe("parseShown", () => {
  it("reads whole pages up to the cap", () => {
    expect(parseShown("40")).toBe(40);
    expect(parseShown(["60", "20"])).toBe(60);
    expect(parseShown("1000")).toBe(MAX_SHOWN);
  });

  /* A hand-edited URL gets the ordinary search, never an error. */
  it("falls back to the first page on anything else", () => {
    for (const raw of [undefined, "", "abc", "25", "0", "-20", "20.5", "1e9x"]) {
      expect(parseShown(raw)).toBe(SEARCH_LIMIT);
    }
  });
});

describe("endLine", () => {
  it("repeats the narrowing offer at the cap, by which line is empty", () => {
    expect(endLine("cap", q("dune"))).toMatch(/add the author/);
    expect(endLine("cap", q("", "herbert"))).toMatch(/add a title/);
    expect(endLine("cap", q("dune", "herbert"))).not.toMatch(/add/);
  });

  it("never offers to narrow when the sources are spent", () => {
    expect(endLine("spent", q("dune"))).not.toMatch(/add/);
  });
});

describe("isBlank", () => {
  it("is blank only when neither field was filled", () => {
    expect(isBlank(q(""))).toBe(true);
    expect(isBlank(q("dune"))).toBe(false);
    expect(isBlank(q("", "herbert"))).toBe(false);
  });
});

describe("runSearch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not search for the blank query", async () => {
    const search = vi.fn<Search>();
    expect(await runSearch(q(""), search)).toEqual({ kind: "blank" });
    expect(search).not.toHaveBeenCalled();
  });

  it("hands both fields down and asks for SEARCH_LIMIT works", async () => {
    const search = vi.fn<Search>().mockResolvedValue(dune);
    const query = q("dune", "herbert");
    const outcome = await runSearch(query, search);

    expect(search).toHaveBeenCalledWith(query, SEARCH_LIMIT);
    expect(outcome).toEqual({ kind: "results", query, books: dune, limited: false });
  });

  it("searches on an author alone", async () => {
    const search = vi.fn<Search>().mockResolvedValue(dune);
    await runSearch(q("", "le guin"), search);
    expect(search).toHaveBeenCalledWith({ title: "", author: "le guin" }, SEARCH_LIMIT);
  });

  it("marks a full page as limited, so the reader knows to narrow it", async () => {
    const full = Array.from({ length: SEARCH_LIMIT }, (_, i) => ({
      ...dune[0],
      sourceKey: `OL${i}W`,
    }));
    const outcome = await runSearch(q("dune"), vi.fn<Search>().mockResolvedValue(full));
    expect(outcome).toMatchObject({ kind: "results", limited: true });
  });

  /* MRG-073: a full page is the only evidence there is more to show. */
  describe("show more", () => {
    const page = (n: number) =>
      Array.from({ length: n }, (_, i) => ({ ...dune[0], sourceKey: `OL${i}W` }));

    it("offers the next page after a full one", async () => {
      const outcome = await runSearch(q("dune"), vi.fn<Search>().mockResolvedValue(page(20)));
      expect(outcome).toMatchObject({ more: 40 });
    });

    it("asks the sources for as many as the URL shows", async () => {
      const search = vi.fn<Search>().mockResolvedValue(page(40));
      const outcome = await runSearch(q("dune"), search, 40);
      expect(search).toHaveBeenCalledWith(q("dune"), 40);
      expect(outcome).toMatchObject({ limited: true, more: 60 });
    });

    it("says the sources are spent after a short page", async () => {
      const outcome = await runSearch(q("dune"), vi.fn<Search>().mockResolvedValue(page(27)), 40);
      expect(outcome).toMatchObject({ limited: false, end: "spent" });
      expect(outcome).not.toHaveProperty("more");
    });

    it("stops offering at the cap, and still says the page is limited", async () => {
      const search = vi.fn<Search>().mockResolvedValue(page(MAX_SHOWN));
      const outcome = await runSearch(q("dune"), search, MAX_SHOWN);
      expect(outcome).toMatchObject({ limited: true, end: "cap" });
      expect(outcome).not.toHaveProperty("more");
    });

    /* A first page draws no control at all unless there is more to show. */
    it("gives a short first page neither more nor an end", async () => {
      const outcome = await runSearch(q("dune"), vi.fn<Search>().mockResolvedValue(page(7)));
      expect(outcome).not.toHaveProperty("more");
      expect(outcome).not.toHaveProperty("end");
    });
  });

  it("reports no matches as none", async () => {
    const outcome = await runSearch(q("zzqx"), vi.fn<Search>().mockResolvedValue([]));
    expect(outcome).toEqual({ kind: "none", query: q("zzqx") });
  });

  /*
   * The distinction the page exists to keep: an outage is not "no such book".
   */
  it("reports an Open Library error status as unavailable, not none", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const search = vi
      .fn<Search>()
      .mockRejectedValue(new OpenLibraryError(503, "https://openlibrary.org/search.json"));

    expect(await runSearch(q("dune"), search)).toEqual({
      kind: "unavailable",
      query: q("dune"),
    });
  });

  it("reports a transport failure as unavailable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const search = vi.fn<Search>().mockRejectedValue(new TypeError("fetch failed"));
    expect(await runSearch(q("dune"), search)).toMatchObject({ kind: "unavailable" });
  });
});

describe("bandText", () => {
  /* The band is the record of the search, not the form's instructions — the
     guidance moved onto the form itself, above the submit rather than below. */
  it("says a blank search is a blank search", () => {
    expect(bandText({ kind: "blank" })).toBe("No search yet");
  });

  it("counts results, singular and plural", () => {
    const query = q("dune");
    const one = { kind: "results", query, books: dune.slice(0, 1), limited: false } as const;
    const many = { kind: "results", query, books: dune, limited: false } as const;
    expect(bandText(one)).toBe("1 book");
    expect(bandText(many)).toBe(`${dune.length} books`);
  });

  it("tells a limited title-only search to add the author", () => {
    expect(
      bandText({ kind: "results", query: q("dune"), books: dune, limited: true }),
    ).toBe(`First ${dune.length} — add the author to narrow it`);
  });

  it("tells a limited author-only search to add the title", () => {
    expect(
      bandText({ kind: "results", query: q("", "herbert"), books: dune, limited: true }),
    ).toBe(`First ${dune.length} — add a title to narrow it`);
  });

  /*
   * With both lines filled there is nothing left to suggest, and the band must
   * not reach for a claim instead: the merge orders by SOURCE, so "closest
   * first" would be untrue — Google leads the grid for latency stability, and
   * its ranking is the worse of the two.
   */
  it("claims no ordering it cannot deliver", () => {
    const text = bandText({
      kind: "results",
      query: q("dune", "herbert"),
      books: dune,
      limited: true,
    });
    expect(text).toBe(`First ${dune.length} of more`);
    expect(text).not.toMatch(/closest|best|relevan/i);
  });

  it("names none and unavailable differently", () => {
    expect(bandText({ kind: "none", query: q("dune") })).toBe("No matches");
    expect(bandText({ kind: "unavailable", query: q("dune") })).toBe("Search unavailable");
  });
});

describe("queryPhrase", () => {
  it("says both fields, or whichever one was filled", () => {
    expect(queryPhrase(q("dune", "herbert"))).toBe("“dune” by “herbert”");
    expect(queryPhrase(q("dune"))).toBe("“dune”");
    expect(queryPhrase(q("", "herbert"))).toBe("“herbert”");
  });
});

describe("noMatch", () => {
  it("quotes the query back", () => {
    expect(noMatch(q("dune", "herbert")).lead).toBe("Nothing matches “dune” by “herbert”.");
    expect(noMatch(q("dune")).lead).toContain("Nothing matches “dune”.");
  });

  /* Dropping the title is the one exit that can rescue a scoped miss, so it is
     offered as a control rather than only described. */
  it("offers the author alone when both lines were filled", () => {
    expect(noMatch(q("dune", "herbert")).widen).toBe("herbert");
  });

  /*
   * The trap this replaced: both sources AND the two terms, so telling a
   * reader whose title-only search found nothing to "add the author" narrows
   * an already-empty search and lands them back on this same page.
   */
  it("never offers to narrow a search that already found nothing", () => {
    for (const query of [q("dune"), q("", "herbert")]) {
      const { lead, widen } = noMatch(query);
      expect(widen).toBeUndefined();
      expect(lead).not.toMatch(/add (the author|a title)/i);
      expect(lead).toMatch(/try (fewer words|the surname alone)/i);
    }
  });
});

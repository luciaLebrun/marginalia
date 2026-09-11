import { describe, expect, it } from "vitest";

import work from "../../tests/fixtures/openlibrary-work-dune.json";
import {
  authorLine,
  bookBand,
  describeReads,
  descriptionParagraphs,
  imprintRows,
  slipDate,
} from "./book-view";
import { CATEGORY_BANDS, INK, PAPER, fallbackBand } from "./color";

describe("descriptionParagraphs", () => {
  it("drops the editorial furniture Open Library keeps under a dashed rule", () => {
    // The recorded Dune work ends "----------\r\nContains: Dune".
    const paragraphs = descriptionParagraphs(work.description.value);
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toMatch(/^Set on the desert planet Arrakis/);
    expect(paragraphs.join(" ")).not.toContain("Contains");
  });

  it("splits paragraphs on blank lines and folds line breaks inside one", () => {
    expect(descriptionParagraphs("First line\nstill first.\n\nSecond.")).toEqual([
      "First line still first.",
      "Second.",
    ]);
  });

  it("removes source citations and link references, keeping link text", () => {
    const text = [
      "A novel about [Arrakis](https://example.org/arrakis) and [spice][2]. ([source][1])",
      "",
      "[1]: https://example.org/source",
      "[2]: https://example.org/spice",
    ].join("\n");

    expect(descriptionParagraphs(text)).toEqual(["A novel about Arrakis and spice."]);
  });

  it("returns nothing for an absent or furniture-only description", () => {
    expect(descriptionParagraphs(null)).toEqual([]);
    expect(descriptionParagraphs(undefined)).toEqual([]);
    expect(descriptionParagraphs("")).toEqual([]);
    expect(descriptionParagraphs("----------\nContains: Dune")).toEqual([]);
  });

  it("keeps a dash that is only punctuation", () => {
    expect(descriptionParagraphs("Spice --- and water.")).toEqual(["Spice --- and water."]);
  });

  it("keeps the innermost link text when brackets nest", () => {
    expect(descriptionParagraphs("See [the [Arrakis](https://example.org) map].")).toEqual([
      "See [the Arrakis map].",
    ]);
  });

  /*
   * Descriptions are contributor-edited, so the parser has to stay linear on
   * hostile input. A line of unmatched brackets made the old link pattern
   * rescan from every bracket — quadratic, seconds at this size.
   */
  it("stays fast on a long run of unmatched brackets and parentheses", () => {
    const hostile = `${"[".repeat(50_000)}${"(".repeat(50_000)}`;

    const started = performance.now();
    const paragraphs = descriptionParagraphs(hostile);
    const elapsed = performance.now() - started;

    expect(paragraphs).toEqual([hostile]);
    expect(elapsed).toBeLessThan(500);
  });
});

describe("authorLine", () => {
  it("names one, two and three authors in a sentence", () => {
    expect(authorLine(["Frank Herbert"])).toBe("Frank Herbert");
    expect(authorLine(["Terry Pratchett", "Neil Gaiman"])).toBe(
      "Terry Pratchett and Neil Gaiman",
    );
    expect(authorLine(["A", "B", "C"])).toBe("A, B and C");
  });

  it("names two and counts the rest past three, so the band stays one line", () => {
    expect(authorLine(["A", "B", "C", "D", "E"])).toBe("A, B and 3 others");
  });

  it("says so when there is no author, rather than printing an empty band", () => {
    expect(authorLine([])).toBe("Author unknown");
    expect(authorLine(["  ", ""])).toBe("Author unknown");
  });
});

describe("imprintRows", () => {
  it("lists what is known, in order, with the source linked last", () => {
    expect(
      imprintRows({ firstPublishYear: 1965, pageCount: 604, olWorkKey: "OL893414W" }),
    ).toEqual([
      { label: "First published", value: "1965" },
      { label: "Pages", value: "604" },
      {
        label: "Source",
        value: "Open Library",
        href: "https://openlibrary.org/works/OL893414W",
      },
    ]);
  });

  it("names the source for a reader and keeps the work key in the address", () => {
    const [source] = imprintRows({ firstPublishYear: null, pageCount: null, olWorkKey: "OL1W" });
    expect(source.value).not.toMatch(/OL\d+W/);
    expect(source.href).toContain("OL1W");
  });

  it("omits a value Open Library did not have instead of printing a dash", () => {
    const rows = imprintRows({ firstPublishYear: null, pageCount: null, olWorkKey: "OL1W" });
    expect(rows.map((row) => row.label)).toEqual(["Source"]);
  });
});

describe("slipDate", () => {
  it("prints a read date in full", () => {
    expect(slipDate(new Date("2026-08-14"))).toBe("14 Aug 2026");
  });

  /*
   * `read_at` is a date at UTC midnight. Formatted in a zone west of UTC it
   * would print the day before, so a reader in New York would see their own
   * entry misdated.
   */
  it("formats in UTC, so a date never slips to the day before", () => {
    expect(slipDate(new Date("2026-01-01T00:00:00Z"))).toBe("1 Jan 2026");
  });

  it("says Undated rather than inventing a date", () => {
    expect(slipDate(null)).toBe("Undated");
  });
});

describe("describeReads", () => {
  it("says how often, in words", () => {
    expect(describeReads(0)).toBe("Not on your shelf");
    expect(describeReads(1)).toBe("Read once");
    expect(describeReads(2)).toBe("Read twice");
    expect(describeReads(5)).toBe("Read 5 times");
  });
});

describe("bookBand", () => {
  const book = { coverColor: "#2F5D8A", olWorkKey: "OL893414W" };

  it("is ink with paper text until the book is on the reader's shelf", () => {
    expect(bookBand(book, false)).toEqual({ background: INK, color: PAPER });
  });

  it("wears the book's own colour once it is on the shelf", () => {
    expect(bookBand(book, true).background).toBe("#2F5D8A");
  });

  it("falls back to the stable category band when the cover gave no colour", () => {
    const band = bookBand({ coverColor: null, olWorkKey: "OL893414W" }, true);
    expect(band.background).toBe(fallbackBand("OL893414W"));
    expect(CATEGORY_BANDS).toContain(band.background);
  });

  it("picks the readable foreground, never a fixed one", () => {
    // Paper on the fiction orange is 3.32:1 and fails AA.
    const orange = bookBand({ coverColor: "#E8501B", olWorkKey: "OL1W" }, true);
    expect(orange.color).toBe(INK);
  });
});

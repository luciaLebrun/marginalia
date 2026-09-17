import { describe, expect, it } from "vitest";

import piranesi from "../../tests/fixtures/google-books-volume-piranesi.json";
import work from "../../tests/fixtures/openlibrary-work-dune.json";
import {
  authorLine,
  bookBand,
  describeReads,
  descriptionParagraphs,
  displaySubtitle,
  imprintRows,
  slipDate,
  sourceRecord,
} from "./book-view";
import { CATEGORY_BANDS, INK, PAPER, fallbackBand } from "./color";
import { cellDate } from "./slip-date";

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

  /*
   * The click path fetches Google's *volume*, not a search hit, and a volume
   * description is HTML, and the page printed the tags.
   */
  it("reads a Google description as HTML, not as text", () => {
    expect(descriptionParagraphs("<b>One.</b><br><br>Two <i>italic</i>.")).toEqual([
      "One.",
      "Two italic.",
    ]);
  });

  it("folds a single line break inside a paragraph, as markdown does", () => {
    expect(descriptionParagraphs("<b>A hook.</b><br>Still the hook.")).toEqual([
      "A hook. Still the hook.",
    ]);
  });

  it("decodes the entities a blurb carries, and drops the tags around them", () => {
    expect(descriptionParagraphs("<b>Tom &amp; Jerry&#39;s &quot;book&quot;</b>")).toEqual([
      `Tom & Jerry's "book"`,
    ]);
  });

  /*
   * Google walls the blurb between two rules of press quotes, where Open
   * Library puts its furniture under one. The real recorded Piranesi volume
   * has both rules, a prize banner above and a page of praise below.
   */
  it("keeps the book and drops the puffery Google packs it in", () => {
    const paragraphs = descriptionParagraphs(piranesi.volumeInfo.description);

    expect(paragraphs[0]).toBe("Piranesi lives in the House. Perhaps he always has.");
    const all = paragraphs.join(" ");
    expect(all).not.toContain("_");
    expect(all).not.toContain("BESTSELLER");
    expect(all).not.toMatch(/Women's Prize/);
    expect(all).not.toMatch(/<[a-z/]/i);
  });

  /*
   * The same rule the bracket patterns keep, for the tag ones: a description
   * is untrusted from either source. `<[^>]*>` was quadratic on a run of
   * unmatched `<`, because each one scanned to the end for a `>` that is not
   * there and then backtracked over the whole string.
   */
  it("stays fast on a long run of unmatched angle brackets", () => {
    const hostile = "<".repeat(50_000);

    const started = performance.now();
    const paragraphs = descriptionParagraphs(hostile);
    const elapsed = performance.now() - started;

    expect(paragraphs).toEqual([hostile]);
    expect(elapsed).toBeLessThan(500);
  });

  it("keeps a dash that is only punctuation", () => {
    expect(descriptionParagraphs("Spice --- and water.")).toEqual(["Spice --- and water."]);
  });

  /*
   * Google fences publisher copy into stretches in no fixed order, so the
   * book is found by being written in sentences, not by its position or its
   * size. Each of these broke a rule that used one of those instead: "above
   * the rule" printed the banner, "below" printed the praise that follows a
   * blurb, "the longest" printed the quotes on a quiet book. Length cannot
   * separate them at all — Piranesi's banner is 231 characters and the blurb
   * below is 60.
   */
  it("keeps a short blurb over the press quotes that outrun it", () => {
    const walled = [
      "<b>Prize winner</b>",
      "<b>____________</b>",
      "A short blurb of it.",
      "<b>____________</b>",
      "'Dazzling' Guardian<br>'A masterpiece' Times",
      "'Unforgettable, luminous, strange and wonderful' Observer",
    ].join("<br>");

    expect(descriptionParagraphs(walled)).toEqual(["A short blurb of it."]);
  });

  it("keeps the blurb when the praise follows it instead of leading it", () => {
    const praiseLast =
      "The blurb of the book, two sentences. It is quiet and short." +
      "<br>__________<br>'Dazzling' Guardian<br>'A masterpiece' Times";

    expect(descriptionParagraphs(praiseLast)).toEqual([
      "The blurb of the book, two sentences. It is quiet and short.",
    ]);
  });

  it("walks past every banner when a publisher stacks two of them", () => {
    const stacked =
      "<b>WINNER</b><br>____<br><b>A NYT BESTSELLER</b><br>____<br>" +
      "The actual blurb of it.<br><br>A second paragraph.";

    expect(descriptionParagraphs(stacked)).toEqual([
      "The actual blurb of it.",
      "A second paragraph.",
    ]);
  });

  /* Nothing to recognise as prose: fall back rather than print nothing. */
  it("keeps an unpunctuated teaser rather than dropping the description", () => {
    expect(
      descriptionParagraphs("A teaser with no full stop<br>____<br>'Dazzling' Guardian"),
    ).toEqual(["A teaser with no full stop"]);
  });

  /*
   * Google writes `&#39;` in descriptions that carry no tags at all, so the
   * decoding cannot hide behind the presence of a `<`.
   */
  it("decodes entities in a description with no markup in it", () => {
    expect(descriptionParagraphs("Salinger&#39;s world &amp; more")).toEqual([
      "Salinger's world & more",
    ]);
  });

  it("decodes the typography a marketing department reaches for", () => {
    expect(
      descriptionParagraphs("<b>its &lt;rules&gt; &mdash; a study&hellip; caf&#233; life</b>"),
    ).toEqual(["its <rules> \u2014 a study\u2026 caf\u00e9 life"]);
  });

  it("leaves an entity it cannot name alone rather than dropping it", () => {
    expect(descriptionParagraphs("Tea &frac12; &notanentity; done")).toEqual([
      "Tea &frac12; &notanentity; done",
    ]);
  });

  /* A lone surrogate is a legal argument to fromCodePoint and an illegal
   * character: decoding it would put broken UTF-16 into the DOM. */
  it("refuses a numeric reference that names no character", () => {
    expect(descriptionParagraphs("lone &#55296; here.")).toEqual(["lone &#55296; here."]);
    expect(descriptionParagraphs("past the end &#1114112; here.")).toEqual([
      "past the end &#1114112; here.",
    ]);
  });

  it("keeps underscores that are only punctuation", () => {
    expect(descriptionParagraphs("A file named dune__book.txt.")).toEqual([
      "A file named dune__book.txt.",
    ]);
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
      imprintRows({ firstPublishYear: 1965, pageCount: 604, sourceKey: "OL893414W" }),
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

  /*
   * Google dates the edition it holds, so its Dune is 2005, not 1965. The
   * number is right and "First published" over it would not be.
   */
  it("calls a Google year what it is: this edition's, not the book's", () => {
    const [year] = imprintRows({
      firstPublishYear: 2005,
      pageCount: 704,
      sourceKey: "gb:B1hSG45JCX4C",
    });
    expect(year).toEqual({ label: "Published", value: "2005" });
  });

  it("names the source for a reader and keeps the work key in the address", () => {
    const [source] = imprintRows({ firstPublishYear: null, pageCount: null, sourceKey: "OL1W" });
    expect(source.value).not.toMatch(/OL\d+W/);
    expect(source.href).toContain("OL1W");
  });

  it("omits a value Open Library did not have instead of printing a dash", () => {
    const rows = imprintRows({ firstPublishYear: null, pageCount: null, sourceKey: "OL1W" });
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

describe("cellDate", () => {
  // Either end of a UTC day: one fails west of Greenwich, the other east.
  it("formats in UTC wherever the renderer is", () => {
    expect(cellDate(new Date("2026-01-01T00:00:00Z"))).toBe("01 Jan");
    expect(cellDate(new Date("2026-01-01T23:59:00Z"))).toBe("01 Jan");
  });

  it("prints a dash for an undated read", () => {
    expect(cellDate(null)).toBe("—");
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
  const book = { coverColor: "#2F5D8A", sourceKey: "OL893414W" };

  it("is ink with paper text until the book is on the reader's shelf", () => {
    expect(bookBand(book, false)).toEqual({ background: INK, color: PAPER });
  });

  it("wears the book's own colour once it is on the shelf", () => {
    expect(bookBand(book, true).background).toBe("#2F5D8A");
  });

  it("falls back to the stable category band when the cover gave no colour", () => {
    const band = bookBand({ coverColor: null, sourceKey: "OL893414W" }, true);
    expect(band.background).toBe(fallbackBand("OL893414W"));
    expect(CATEGORY_BANDS).toContain(band.background);
  });

  it("picks the readable foreground, never a fixed one", () => {
    // Paper on the fiction orange is 3.32:1 and fails AA.
    const orange = bookBand({ coverColor: "#E8501B", sourceKey: "OL1W" }, true);
    expect(orange.color).toBe(INK);
  });
});

describe("sourceRecord", () => {
  /*
   * The tag on the key decides, not what is primary today: a book opened when
   * Open Library was the only source is still an Open Library record, and
   * sending a reader to Google for it would show them a different book.
   */
  it("sends a Google book to its volume on Google Books", () => {
    expect(sourceRecord("gb:B1hSG45JCX4C")).toEqual({
      name: "Google Books",
      href: "https://books.google.com/books?id=B1hSG45JCX4C",
    });
  });

  it("still sends a book stored before the swap to Open Library", () => {
    expect(sourceRecord("OL893414W")).toEqual({
      name: "Open Library",
      href: "https://openlibrary.org/works/OL893414W",
    });
  });
});

/*
 * `subtitle` means a subtitle at Open Library and "whatever the publisher
 * filed" at Google, where a prize-winner's is a jacket banner in full caps.
 */
describe("displaySubtitle", () => {
  it("keeps a real subtitle", () => {
    expect(displaySubtitle("A Novel")).toBe("A Novel");
    expect(displaySubtitle("  The Rise of Dune  ")).toBe("The Rise of Dune");
  });

  /*
   * Only a script with a case distinction can shout. Looking for a lowercase
   * letter deleted these along with the banners.
   */
  it("keeps a subtitle in a script that has no lowercase to find", () => {
    expect(displaySubtitle("\u591C\u306F\u77ED\u3057\u6B69\u3051\u3088\u4E59\u5973")).toBe(
      "\u591C\u306F\u77ED\u3057\u6B69\u3051\u3088\u4E59\u5973",
    );
    expect(displaySubtitle("\u0623\u0637\u0641\u0627\u0644 \u062D\u0627\u0631\u062A\u0646\u0627")).toBe(
      "\u0623\u0637\u0641\u0627\u0644 \u062D\u0627\u0631\u062A\u0646\u0627",
    );
    expect(displaySubtitle("1984")).toBe("1984");
  });

  it("drops a jacket banner filed as one", () => {
    expect(displaySubtitle(piranesi.volumeInfo.subtitle)).toBeNull();
    expect(displaySubtitle("A NEW YORK TIMES BESTSELLER")).toBeNull();
  });

  it("has nothing to show for an absent or empty one", () => {
    expect(displaySubtitle(null)).toBeNull();
    expect(displaySubtitle(undefined)).toBeNull();
    expect(displaySubtitle("   ")).toBeNull();
  });
});

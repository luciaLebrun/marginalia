import { describe, expect, it } from "vitest";

import {
  entryPath,
  parseLogId,
  reviewParagraphs,
  shareDescription,
  type LogEntry,
} from "./entry";

const ID = "3f2c9a4e-8b1d-4c7e-9a2f-6d5e4b3a2c1d";

describe("parseLogId", () => {
  it("accepts a log id as crypto.randomUUID makes them", () => {
    expect(parseLogId(ID)).toBe(ID);
  });

  it("folds case and surrounding space, so one entry has one address", () => {
    expect(parseLogId(`  ${ID.toUpperCase()} `)).toBe(ID);
  });

  /*
   * The segment becomes a query, so anything that is not exactly a UUID stops
   * here rather than reaching the database.
   */
  it("refuses anything that is not a UUID", () => {
    expect(parseLogId("")).toBeNull();
    expect(parseLogId("1")).toBeNull();
    expect(parseLogId("dev-read-2")).toBeNull();
    expect(parseLogId("../settings")).toBeNull();
    expect(parseLogId(`${ID}/edit`)).toBeNull();
    expect(parseLogId(ID.replaceAll("-", ""))).toBeNull();
    expect(parseLogId(`${ID.slice(0, -1)}g`)).toBeNull();
  });
});

describe("entryPath", () => {
  it("files an entry under its reader's handle", () => {
    expect(entryPath("lucia", ID)).toBe(`/@lucia/log/${ID}`);
  });
});

describe("shareDescription", () => {
  const entry = (review: string | null): LogEntry =>
    ({
      reader: { id: "r", name: "Lucia", username: "lucia" },
      book: { title: "Dune" },
      review,
    }) as LogEntry;

  it("states the fact when there are no words to quote", () => {
    expect(shareDescription(entry(null))).toBe("Lucia read Dune.");
  });

  it("uses a short review whole", () => {
    expect(shareDescription(entry("Stranger the second time."))).toBe(
      "Stranger the second time.",
    );
  });

  it("folds line breaks, so a shared card reads as one line", () => {
    expect(shareDescription(entry("One.\n\nTwo."))).toBe("One. Two.");
  });

  /*
   * This is the surface built to be sent to someone, so a cut must fall on a
   * word and say that it was cut.
   */
  it("cuts a long review on a word and marks the cut", () => {
    const long = `${"Arrakis teaches the attitude of the knife. ".repeat(10)}`;
    const shared = shareDescription(entry(long));

    expect(shared.length).toBeLessThanOrEqual(161);
    expect(shared.endsWith("…")).toBe(true);
    expect(shared.slice(0, -1)).not.toMatch(/\s$/);
    expect(long.startsWith(shared.slice(0, -1))).toBe(true);
  });
});

describe("reviewParagraphs", () => {
  const texts = (review: string | null) => reviewParagraphs(review).map((p) => p.text);

  it("breaks on blank lines and keeps single breaks inside a paragraph", () => {
    expect(texts("First line\nstill first.\n\nSecond.")).toEqual([
      "First line\nstill first.",
      "Second.",
    ]);
  });

  it("treats a run of blank lines as one break", () => {
    expect(texts("One.\n\n\n  \n\nTwo.")).toEqual(["One.", "Two."]);
  });

  /*
   * These are the reader's own words. Nothing is stripped the way an Open
   * Library description is — brackets, dashes and asterisks are theirs.
   */
  it("leaves the reader's punctuation alone", () => {
    const written = "I loved it [mostly] — the middle *drags*, and ---- that ending.";
    expect(texts(written)).toEqual([written]);
  });

  it("returns nothing for an absent or blank review", () => {
    expect(reviewParagraphs(null)).toEqual([]);
    expect(reviewParagraphs("   \n\n  ")).toEqual([]);
  });

  /*
   * A reader may write the same line twice. Keys come from where each
   * paragraph sits in the text, so the two stay distinct.
   */
  it("gives repeated paragraphs distinct keys", () => {
    const keys = reviewParagraphs("Same line.\n\nSame line.\n\nSame line.").map((p) => p.key);
    expect(keys).toHaveLength(3);
    expect(new Set(keys).size).toBe(3);
  });
});

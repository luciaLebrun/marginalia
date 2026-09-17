import { describe, expect, it } from "vitest";

import { identityKeys, mergeResults } from "./index";
import type { BookSummary } from "./types";

/**
 * The merge is what makes MRG-067 survivable: Google holds the top of the grid
 * for its latency, and Open Library is guaranteed room to put the actual book
 * on the page.
 */

function google(title: string, extra: Partial<BookSummary> = {}): BookSummary {
  return { sourceKey: `gb:${title}`, title, authors: ["An Author"], ...extra };
}
function ol(title: string, extra: Partial<BookSummary> = {}): BookSummary {
  return { sourceKey: `OL${title}W`, title, authors: ["An Author"], ...extra };
}
const many = (n: number, make: (t: string) => BookSummary) =>
  Array.from({ length: n }, (_, i) => make(`Book ${i}`));

describe("identityKeys", () => {
  /*
   * ISBN-13 alone was the flaw in the original sketch: Google returns editions
   * and Open Library works, so the two hand back different ISBNs for the same
   * book and an ISBN match almost never fires.
   */
  it("matches on folded title and author, not only on ISBN", () => {
    const a = identityKeys({ sourceKey: "gb:x", title: "Piranèse", authors: ["Susanna Clarke"] });
    const b = identityKeys({ sourceKey: "OL1W", title: "  piranese ", authors: ["susanna clarke"] });
    expect(a.some((k) => b.includes(k))).toBe(true);
  });

  it("still uses an ISBN when both sides carry the same one", () => {
    const a = identityKeys({ sourceKey: "gb:x", title: "One", authors: [], isbn13: "9780441013593" });
    const b = identityKeys({ sourceKey: "OL1W", title: "Other", authors: [], isbn13: "9780441013593" });
    expect(a.some((k) => b.includes(k))).toBe(true);
  });

  it("keeps different books apart", () => {
    const a = identityKeys(google("Dune"));
    const b = identityKeys(google("Dune Messiah"));
    expect(a.some((k) => b.includes(k))).toBe(false);
  });
});

describe("mergeResults", () => {
  it("leads with Google and still seats Open Library on a full page", () => {
    const merged = mergeResults(many(20, google), many(20, ol), 20);

    expect(merged).toHaveLength(20);
    expect(merged[0].sourceKey.startsWith("gb:")).toBe(true);
    // The point of the reserved quota: a full page of Google results must not
    // squeeze Open Library off the page entirely, which is what appending did.
    expect(merged.filter((b) => b.sourceKey.startsWith("OL")).length).toBeGreaterThan(0);
  });

  it("never repeats a book the two sources both returned", () => {
    const merged = mergeResults([google("Dune")], [ol("Dune")], 20);
    expect(merged).toHaveLength(1);
  });

  it("gives the whole page to whichever source answered", () => {
    expect(mergeResults(many(20, google), [], 20)).toHaveLength(20);
    expect(mergeResults([], many(20, ol), 20)).toHaveLength(20);
    expect(mergeResults([], [], 20)).toEqual([]);
  });

  /* Google finishes the page rather than leaving it short. */
  it("lets Google back in when Open Library cannot fill its share", () => {
    const merged = mergeResults(many(20, google), [ol("Only One")], 20);
    expect(merged).toHaveLength(20);
  });

  it("never exceeds the limit it is given", () => {
    expect(mergeResults(many(20, google), many(20, ol), 5)).toHaveLength(5);
  });
});

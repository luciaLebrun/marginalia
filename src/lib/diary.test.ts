import { describe, expect, it } from "vitest";

import { groupByYear } from "./diary";
import type { DiaryEntry } from "@/components/Entry";

function entry(id: string, readAt: string | null): DiaryEntry {
  return {
    id,
    title: `Book ${id}`,
    authors: ["An Author"],
    coverId: null,
    coverColor: null,
    olWorkKey: `OL${id}W`,
    rating: null,
    readAt: readAt === null ? null : new Date(readAt),
    isReread: false,
    hasReview: false,
  };
}

describe("groupByYear", () => {
  it("returns nothing for an empty shelf", () => {
    expect(groupByYear([])).toEqual([]);
  });

  it("groups by the year the book was finished", () => {
    const groups = groupByYear([
      entry("a", "2026-08-14"),
      entry("b", "2026-02-11"),
      entry("c", "2025-12-28"),
    ]);
    expect(groups.map((g) => g.year)).toEqual(["2026", "2025"]);
    expect(groups[0].entries.map((e) => e.id)).toEqual(["a", "b"]);
    expect(groups[1].entries.map((e) => e.id)).toEqual(["c"]);
  });

  it("orders years newest first regardless of input order", () => {
    const groups = groupByYear([
      entry("old", "2019-01-01"),
      entry("new", "2026-01-01"),
      entry("mid", "2022-01-01"),
    ]);
    expect(groups.map((g) => g.year)).toEqual(["2026", "2022", "2019"]);
  });

  it("preserves the order entries arrived in within a year", () => {
    // The query already sorts by read date descending; grouping must not
    // reshuffle it, or the shelf would reorder itself against the index.
    const groups = groupByYear([
      entry("first", "2026-09-01"),
      entry("second", "2026-05-01"),
      entry("third", "2026-01-01"),
    ]);
    expect(groups[0].entries.map((e) => e.id)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("collects undated entries under their own heading, last", () => {
    // readAt null means "read at some point, date unknown" — a real state that
    // must be neither hidden nor silently dated today.
    const groups = groupByYear([
      entry("dated", "2026-03-01"),
      entry("undated", null),
      entry("older", "2024-03-01"),
    ]);
    expect(groups.map((g) => g.year)).toEqual(["2026", "2024", "Undated"]);
    expect(groups.at(-1)!.entries.map((e) => e.id)).toEqual(["undated"]);
  });

  it("handles a shelf that is entirely undated", () => {
    const groups = groupByYear([entry("a", null), entry("b", null)]);
    expect(groups).toHaveLength(1);
    expect(groups[0].year).toBe("Undated");
    expect(groups[0].entries).toHaveLength(2);
  });

  it("uses UTC, so a January 1st entry does not slip into the previous year", () => {
    // A date column has no timezone; reading it in local time would move
    // year boundaries for anyone west of UTC.
    const groups = groupByYear([entry("newyear", "2026-01-01")]);
    expect(groups[0].year).toBe("2026");
  });

  it("loses no entries", () => {
    const input = [
      entry("a", "2026-01-01"),
      entry("b", null),
      entry("c", "2025-06-06"),
      entry("d", "2026-12-31"),
    ];
    const total = groupByYear(input).reduce((n, g) => n + g.entries.length, 0);
    expect(total).toBe(input.length);
  });
});

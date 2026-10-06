import { describe, expect, it } from "vitest";

import { matchOwnCopy } from "./book-view";

const row = (id: string, over: Partial<Parameters<typeof matchOwnCopy>[0]> = {}) => ({
  id,
  sourceKey: `OL${id}W`,
  title: "Piranesi",
  authors: ["Susanna Clarke"],
  isbn13: null,
  ...over,
});
const viewed = row("1", { sourceKey: "gb:abc" });

describe("matchOwnCopy", () => {
  it("matches on a shared ISBN-13", () => {
    const a = row("1", { title: "One", authors: [], isbn13: "9780441013593" });
    const b = { ...row("2", { title: "Other", authors: [], isbn13: "9780441013593" }), kind: "read" as const };
    expect(matchOwnCopy(a, [b])).toEqual({ sourceKey: "OL2W", kind: "read" });
  });

  it("matches on folded title and first author", () => {
    const b = { ...row("2", { title: " PIRANESI ", authors: ["susanna clarke"] }), kind: "to-read" as const };
    expect(matchOwnCopy(viewed, [b])?.kind).toBe("to-read");
  });

  it("prefers a read over a to-read", () => {
    const list = { ...row("2"), kind: "to-read" as const };
    const read = { ...row("3"), kind: "read" as const };
    expect(matchOwnCopy(viewed, [list, read])?.sourceKey).toBe("OL3W");
  });

  it("does not match a different author, or the viewed row itself", () => {
    const other = { ...row("2", { authors: ["Someone Else"] }), kind: "read" as const };
    expect(matchOwnCopy(viewed, [other, { ...viewed, kind: "read" as const }])).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import { PASSAGE_MAX, PASSAGE_NOTE_MAX, passageSchema } from "./passage-schema";

const valid = { bookId: "book-1", words: "  A line worth keeping.  ", page: "", note: "" };

function refusal(input: Record<string, unknown>) {
  const parsed = passageSchema.safeParse(input);
  return parsed.success
    ? null
    : { message: parsed.error.issues[0]?.message, field: parsed.error.issues[0]?.path[0] };
}

describe("passageSchema", () => {
  it("trims, and turns an empty page and note into null", () => {
    expect(passageSchema.parse(valid)).toEqual({
      bookId: "book-1",
      words: "A line worth keeping.",
      page: null,
      note: null,
    });
  });

  it("reads a page and a note", () => {
    expect(passageSchema.parse({ ...valid, page: " 214 ", note: " yes " })).toMatchObject({
      page: 214,
      note: "yes",
    });
  });

  it("refuses empty or blank words", () => {
    expect(refusal({ ...valid, words: "   " })?.field).toBe("words");
  });

  it("holds words and note to their limits exactly", () => {
    expect(passageSchema.safeParse({ ...valid, words: "x".repeat(PASSAGE_MAX) }).success).toBe(true);
    expect(refusal({ ...valid, words: "x".repeat(PASSAGE_MAX + 1) })?.field).toBe("words");
    expect(passageSchema.safeParse({ ...valid, note: "x".repeat(PASSAGE_NOTE_MAX) }).success).toBe(true);
    expect(refusal({ ...valid, note: "x".repeat(PASSAGE_NOTE_MAX + 1) })?.field).toBe("note");
  });

  it.each(["0", "-3", "2.5", "1e3", "abc", "100000"])("refuses page %j", (page) => {
    expect(refusal({ ...valid, page })).toEqual({
      message: "A page is a whole number, like 214.",
      field: "page",
    });
  });

  it("accepts the last page", () => {
    expect(passageSchema.parse({ ...valid, page: "99999" }).page).toBe(99999);
  });
});

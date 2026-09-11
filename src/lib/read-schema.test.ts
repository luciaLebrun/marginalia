import { afterEach, describe, expect, it, vi } from "vitest";

import { REVIEW_MAX, isLogReadField, latestReadDate, readSchema } from "./read-schema";

const valid = {
  bookId: "book-1",
  readAt: "2026-08-14",
  rating: "4.5",
  review: "Better the second time.",
  isReread: true,
};

/** The first issue, which is what the action surfaces, with its field. */
function refusal(input: Record<string, unknown>) {
  const parsed = readSchema.safeParse(input);
  return parsed.success
    ? null
    : { message: parsed.error.issues[0].message, field: parsed.error.issues[0].path[0] };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("readSchema", () => {
  it("accepts a full read and hands back typed values", () => {
    expect(readSchema.parse(valid)).toEqual({
      bookId: "book-1",
      readAt: "2026-08-14",
      rating: 4.5,
      review: "Better the second time.",
      isReread: true,
    });
  });

  /*
   * Capture has to be faster than the impulse to skip it, so a read with no
   * rating, no words and no date is still a read.
   */
  it("accepts a bare read: undated, unrated, no review", () => {
    expect(
      readSchema.parse({ bookId: "book-1", readAt: "", rating: "0", review: "  ", isReread: false }),
    ).toEqual({ bookId: "book-1", readAt: null, rating: null, review: null, isReread: false });
  });

  it("treats a missing rating the same as an untouched one", () => {
    expect(readSchema.parse({ ...valid, rating: "" }).rating).toBeNull();
  });

  it("keeps whole and half ratings, and refuses anything between", () => {
    expect(readSchema.parse({ ...valid, rating: "0.5" }).rating).toBe(0.5);
    expect(readSchema.parse({ ...valid, rating: "5" }).rating).toBe(5);
    expect(refusal({ ...valid, rating: "4.3" })).toMatchObject({ field: "rating" });
    expect(refusal({ ...valid, rating: "5.5" })).toMatchObject({ field: "rating" });
    expect(refusal({ ...valid, rating: "-1" })).toMatchObject({ field: "rating" });
    expect(refusal({ ...valid, rating: "four" })).toMatchObject({ field: "rating" });
  });

  it("refuses a date that does not exist rather than rolling it over", () => {
    expect(refusal({ ...valid, readAt: "2026-02-30" })).toMatchObject({ field: "readAt" });
    expect(refusal({ ...valid, readAt: "14/08/2026" })).toMatchObject({ field: "readAt" });
  });

  it("refuses a date that has not happened anywhere yet", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-11T12:00:00Z"));

    // Tomorrow in UTC is somebody's today (UTC+14); the day after is nobody's.
    expect(readSchema.parse({ ...valid, readAt: "2026-09-12" }).readAt).toBe("2026-09-12");
    expect(refusal({ ...valid, readAt: "2026-09-13" })).toEqual({
      message: "That date hasn’t happened yet.",
      field: "readAt",
    });
  });

  it("trims a review and holds it to the limit", () => {
    expect(readSchema.parse({ ...valid, review: "  Words.  " }).review).toBe("Words.");
    expect(readSchema.parse({ ...valid, review: "x".repeat(REVIEW_MAX) }).review).toHaveLength(
      REVIEW_MAX,
    );
    expect(refusal({ ...valid, review: "x".repeat(REVIEW_MAX + 1) })).toMatchObject({
      field: "review",
    });
  });

  it("needs to know which book the read is of", () => {
    expect(refusal({ ...valid, bookId: " " })).toMatchObject({ field: "bookId" });
  });
});

describe("latestReadDate", () => {
  it("is tomorrow in UTC, whatever the hour", () => {
    expect(latestReadDate(new Date("2026-09-11T00:00:00Z"))).toBe("2026-09-12");
    expect(latestReadDate(new Date("2026-09-11T23:59:59Z"))).toBe("2026-09-12");
  });

  it("rolls over months and years", () => {
    expect(latestReadDate(new Date("2026-12-31T10:00:00Z"))).toBe("2027-01-01");
  });
});

describe("isLogReadField", () => {
  it("knows the sheet's own fields and nothing else", () => {
    expect(isLogReadField("readAt")).toBe(true);
    expect(isLogReadField("rating")).toBe(true);
    expect(isLogReadField("review")).toBe(true);
    expect(isLogReadField("bookId")).toBe(false);
    expect(isLogReadField("")).toBe(false);
  });
});

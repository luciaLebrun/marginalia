import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getDb, schema } from "@/db";
import { getDiary, getDiaryCount } from "./diary";

/**
 * The diary read, against real Postgres.
 *
 * This is the query the whole architecture exists to make possible: a reader's
 * record rendering from our own database with no external call, so it survives
 * an Open Library outage. Mocking it would test nothing worth testing.
 */
const url = process.env.DATABASE_URL ?? "";
const hasRealDb = url.length > 0 && !url.includes("placeholder");

const USER = "_it_diary_reader";
const OTHER = "_it_diary_other";
const BOOK_A = "_it_diary_book_a";
const BOOK_B = "_it_diary_book_b";

describe.skipIf(!hasRealDb)("diary (integration)", () => {
  beforeAll(async () => {
    const db = getDb();
    await db
      .insert(schema.user)
      .values([
        { id: USER, name: "Reader", email: "reader@diary.test" },
        { id: OTHER, name: "Other", email: "other@diary.test" },
      ])
      .onConflictDoNothing();

    await db
      .insert(schema.book)
      .values([
        {
          id: BOOK_A,
          olWorkKey: "OL_IT_DIARY_A",
          title: "The Older Book",
          authors: ["A. Author"],
          coverId: 111,
          coverColor: "#2E776E",
        },
        {
          id: BOOK_B,
          olWorkKey: "OL_IT_DIARY_B",
          title: "The Newer Book",
          authors: ["B. Author"],
          coverId: null,
          coverColor: null,
        },
      ])
      .onConflictDoNothing();

    await db.insert(schema.log).values([
      { id: "_it_d1", userId: USER, bookId: BOOK_A, readAt: "2024-05-01", rating: "3.5" },
      { id: "_it_d2", userId: USER, bookId: BOOK_B, readAt: "2026-02-20", rating: "5" },
      { id: "_it_d3", userId: USER, bookId: BOOK_A, readAt: null, isReread: true, reviewText: "  " },
      { id: "_it_d4", userId: OTHER, bookId: BOOK_A, readAt: "2026-01-01" },
    ]);
  });

  afterAll(async () => {
    const db = getDb();
    for (const id of [USER, OTHER]) {
      await db.delete(schema.log).where(eq(schema.log.userId, id));
      await db.delete(schema.user).where(eq(schema.user.id, id));
    }
    for (const id of [BOOK_A, BOOK_B]) {
      await db.delete(schema.book).where(eq(schema.book.id, id));
    }
  });

  it("returns only this reader's entries", async () => {
    const entries = await getDiary(USER);
    expect(entries).toHaveLength(3);
    expect(entries.map((e) => e.id)).not.toContain("_it_d4");
  });

  it("orders newest first, with undated entries last", async () => {
    const entries = await getDiary(USER);
    expect(entries.map((e) => e.id)).toEqual(["_it_d2", "_it_d1", "_it_d3"]);
  });

  it("converts the numeric rating to a number, not a string", async () => {
    const entries = await getDiary(USER);
    const rated = entries.find((e) => e.id === "_it_d1")!;
    expect(rated.rating).toBe(3.5);
    expect(typeof rated.rating).toBe("number");
  });

  it("carries the book's stored band colour through, nulls included", async () => {
    const entries = await getDiary(USER);
    expect(entries.find((e) => e.id === "_it_d1")!.coverColor).toBe("#2E776E");
    expect(entries.find((e) => e.id === "_it_d2")!.coverColor).toBeNull();
  });

  it("treats a whitespace-only review as no review", async () => {
    const entries = await getDiary(USER);
    expect(entries.find((e) => e.id === "_it_d3")!.hasReview).toBe(false);
  });

  it("preserves the reread flag and a null read date", async () => {
    const reread = (await getDiary(USER)).find((e) => e.id === "_it_d3")!;
    expect(reread.isReread).toBe(true);
    expect(reread.readAt).toBeNull();
  });

  it("counts every entry, rereads included", async () => {
    await expect(getDiaryCount(USER)).resolves.toBe(3);
  });

  it("returns an empty diary and a zero count for a reader with nothing", async () => {
    await expect(getDiary("_it_diary_nobody")).resolves.toEqual([]);
    await expect(getDiaryCount("_it_diary_nobody")).resolves.toBe(0);
  });
});

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getDb, schema } from "@/db";
import { findStoredBook } from "./book";
import { getReads } from "./book-view";

/**
 * The date slip's query and the metadata lookup, against a real database.
 * What is under test is the filter and the ordering: only this reader's reads,
 * newest first, undated last.
 */
const url = process.env.DATABASE_URL ?? "";
const hasRealDb = url.length > 0 && !url.includes("placeholder");

const READER = "_it_slip_reader";
const OTHER = "_it_slip_other";
const BOOK_ID = "_it_slip_book";
const BOOK_KEY = "OL990000010W";

describe.skipIf(!hasRealDb)("the date slip (integration)", () => {
  beforeAll(async () => {
    const db = getDb();
    await db
      .insert(schema.user)
      .values([
        { id: READER, name: "Slip Reader", email: "reader@slip.test" },
        { id: OTHER, name: "Slip Other", email: "other@slip.test" },
      ])
      .onConflictDoNothing();
    await db
      .insert(schema.book)
      .values({ id: BOOK_ID, olWorkKey: BOOK_KEY, title: "A Slip Test", authors: [] })
      .onConflictDoNothing();
    await db.insert(schema.log).values([
      { id: "_it_slip_1", userId: READER, bookId: BOOK_ID, readAt: "2024-03-02", rating: "4.5" },
      { id: "_it_slip_2", userId: READER, bookId: BOOK_ID, readAt: null, reviewText: "   " },
      {
        id: "_it_slip_3",
        userId: READER,
        bookId: BOOK_ID,
        readAt: "2026-08-14",
        isReread: true,
        reviewText: "Better the second time.",
      },
      { id: "_it_slip_4", userId: OTHER, bookId: BOOK_ID, readAt: "2026-09-01", rating: "2.0" },
    ]);
  });

  afterAll(async () => {
    const db = getDb();
    // Logs restrict book deletion, and cascade from their users.
    await db.delete(schema.user).where(inArray(schema.user.id, [READER, OTHER]));
    await db.delete(schema.book).where(eq(schema.book.id, BOOK_ID));
  });

  it("lists only this reader's reads, newest first and undated last", async () => {
    const reads = await getReads(READER, BOOK_ID);
    expect(reads.map((read) => read.id)).toEqual(["_it_slip_3", "_it_slip_1", "_it_slip_2"]);
  });

  it("hands back dates, numeric ratings and whether there are words", async () => {
    const [latest, earlier, undated] = await getReads(READER, BOOK_ID);

    expect(latest).toMatchObject({ isReread: true, hasReview: true, rating: null });
    expect(latest.readAt?.toISOString().slice(0, 10)).toBe("2026-08-14");
    expect(earlier.rating).toBe(4.5);
    // Whitespace is not a review.
    expect(undated).toMatchObject({ readAt: null, hasReview: false });
  });

  it("is empty for a reader who has not read the book", async () => {
    await expect(getReads("_it_slip_nobody", BOOK_ID)).resolves.toEqual([]);
  });

  it("finds a stored book by key, and nothing for one never opened or malformed", async () => {
    await expect(findStoredBook(BOOK_KEY)).resolves.toMatchObject({ id: BOOK_ID });
    await expect(findStoredBook(`/works/${BOOK_KEY}`)).resolves.toMatchObject({ id: BOOK_ID });
    await expect(findStoredBook("OL990000011W")).resolves.toBeNull();
    await expect(findStoredBook("../search")).resolves.toBeNull();
  });
});

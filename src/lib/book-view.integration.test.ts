import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getDb, schema } from "@/db";
import { RUN, runKey } from "../../tests/run";
import { findStoredBook } from "./book";
import { getReads } from "./book-view";

/**
 * The date slip's query and the metadata lookup, against a real database.
 * What is under test is the filter and the ordering: only this reader's reads,
 * newest first, undated last.
 */
const url = process.env.DATABASE_URL ?? "";
const hasRealDb = url.length > 0 && !url.includes("placeholder");

const KEY = runKey("slip");
const READER = `_it_slip_reader_${RUN}`;
const OTHER = `_it_slip_other_${RUN}`;
const BOOK_ID = `_it_slip_book_${RUN}`;
const BOOK_KEY = `OL99${KEY}0W`;
const LOGS = [1, 2, 3, 4].map((n) => `_it_slip_${n}_${RUN}`);

describe.skipIf(!hasRealDb)("the date slip (integration)", () => {
  beforeAll(async () => {
    const db = getDb();
    await db
      .insert(schema.user)
      .values([
        { id: READER, name: "Slip Reader", email: `reader-${RUN}@slip.test` },
        { id: OTHER, name: "Slip Other", email: `other-${RUN}@slip.test` },
      ])
      .onConflictDoNothing();
    await db
      .insert(schema.book)
      .values({ id: BOOK_ID, sourceKey: BOOK_KEY, title: "A Slip Test", authors: [] })
      .onConflictDoNothing();
    await db.insert(schema.log).values([
      { id: LOGS[0], userId: READER, bookId: BOOK_ID, readAt: "2024-03-02", rating: "4.5" },
      { id: LOGS[1], userId: READER, bookId: BOOK_ID, readAt: null, reviewText: "   " },
      {
        id: LOGS[2],
        userId: READER,
        bookId: BOOK_ID,
        readAt: "2026-08-14",
        isReread: true,
        reviewText: "Better the second time.",
      },
      { id: LOGS[3], userId: OTHER, bookId: BOOK_ID, readAt: "2026-09-01", rating: "2.0" },
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
    expect(reads.map((read) => read.id)).toEqual([LOGS[2], LOGS[0], LOGS[1]]);
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
    await expect(findStoredBook(`OL99${KEY}1W`)).resolves.toBeNull();
    await expect(findStoredBook("../search")).resolves.toBeNull();
  });
});

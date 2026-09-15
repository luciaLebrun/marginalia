import { eq, inArray } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { getDb, schema } from "@/db";
import { getReads } from "./book-view";
import { createRead, removeRead, updateRead } from "./read";
import type { ReadInput } from "./read-schema";

/**
 * Writing a read, against a real database. What is under test is what the
 * schema decides: rereads are separate rows, and a missing book or reader is
 * refused by the foreign keys rather than by a lookup beforehand.
 */
const url = process.env.DATABASE_URL ?? "";
const hasRealDb = url.length > 0 && !url.includes("placeholder");

const READER = "_it_read_reader";
const OTHER = "_it_read_other";
const BOOK_ID = "_it_read_book";
const BOOK_KEY = "OL990000020W";

const read: ReadInput = {
  bookId: BOOK_ID,
  readAt: "2026-08-14",
  rating: 4.5,
  review: "Better the second time.",
  isReread: true,
};

describe.skipIf(!hasRealDb)("writing a read (integration)", () => {
  beforeAll(async () => {
    const db = getDb();
    await db
      .insert(schema.user)
      .values([
        { id: READER, name: "Read Reader", email: "reader@read.test" },
        { id: OTHER, name: "Other Reader", email: "other@read.test" },
      ])
      .onConflictDoNothing();
    await db
      .insert(schema.book)
      .values({ id: BOOK_ID, olWorkKey: BOOK_KEY, title: "A Read Test", authors: [] })
      .onConflictDoNothing();
  });

  afterEach(async () => {
    await getDb().delete(schema.log).where(inArray(schema.log.userId, [READER, OTHER]));
  });

  afterAll(async () => {
    const db = getDb();
    await db.delete(schema.user).where(inArray(schema.user.id, [READER, OTHER]));
    await db.delete(schema.book).where(eq(schema.book.id, BOOK_ID));
  });

  it("writes every field of the read to the reader's diary", async () => {
    const result = await createRead(READER, read);
    expect(result.ok).toBe(true);

    const [row] = await getDb().select().from(schema.log).where(eq(schema.log.userId, READER));
    expect(row).toMatchObject({
      bookId: BOOK_ID,
      readAt: "2026-08-14",
      rating: "4.5",
      reviewText: "Better the second time.",
      isReread: true,
    });
    if (result.ok) expect(row.id).toBe(result.id);
  });

  it("stores a whole rating with its decimal, and nothing as null", async () => {
    await createRead(READER, { ...read, rating: 4 });
    await createRead(READER, { ...read, readAt: null, rating: null, review: null, isReread: false });

    const reads = await getReads(READER, BOOK_ID);
    expect(reads.map((r) => r.rating)).toEqual([4, null]);
    expect(reads[1]).toMatchObject({ readAt: null, hasReview: false, isReread: false });
  });

  /*
   * A reread is a second entry, never an edit of the first — the rule the
   * whole diary is built on.
   */
  it("keeps a reread as its own line on the slip", async () => {
    await createRead(READER, { ...read, readAt: "2019-05-02", isReread: false });
    await createRead(READER, read);

    const reads = await getReads(READER, BOOK_ID);
    expect(reads).toHaveLength(2);
    expect(reads[0].readAt?.toISOString().slice(0, 10)).toBe("2026-08-14");
  });

  it("refuses a book that is not in the database, and writes nothing", async () => {
    await expect(createRead(READER, { ...read, bookId: "_it_no_such_book" })).resolves.toEqual({
      ok: false,
      reason: "missing",
    });
    expect(await getReads(READER, BOOK_ID)).toHaveLength(0);
  });

  it("refuses a reader who no longer exists", async () => {
    await expect(createRead("_it_no_such_reader", read)).resolves.toEqual({
      ok: false,
      reason: "missing",
    });
  });

  /*
   * MRG-054. A correction and a removal are both scoped by reader and read id
   * in the query, so an id sent from a form reaches nobody else's diary.
   */
  describe("correcting and removing a read", () => {
    const fields = { readAt: read.readAt, rating: read.rating, review: read.review, isReread: read.isReread };

    it("corrects every field of the reader's own read, in place", async () => {
      const created = await createRead(READER, read);
      if (!created.ok) throw new Error("setup failed");

      await expect(
        updateRead(READER, created.id, {
          ...fields,
          readAt: null,
          rating: 3,
          review: null,
          isReread: false,
        }),
      ).resolves.toEqual({ ok: true });

      const reads = await getReads(READER, BOOK_ID);
      expect(reads).toHaveLength(1);
      expect(reads[0]).toMatchObject({
        id: created.id,
        readAt: null,
        rating: 3,
        review: null,
        isReread: false,
      });
    });

    it("refuses to correct or remove another reader's read, and changes nothing", async () => {
      const theirs = await createRead(OTHER, read);
      if (!theirs.ok) throw new Error("setup failed");

      await expect(updateRead(READER, theirs.id, { ...fields, rating: 1 })).resolves.toEqual({
        ok: false,
        reason: "missing",
      });
      await expect(removeRead(READER, theirs.id)).resolves.toEqual({
        ok: false,
        reason: "missing",
      });

      expect(await getReads(OTHER, BOOK_ID)).toMatchObject([{ id: theirs.id, rating: 4.5 }]);
    });

    it("removes the reader's own read for good, leaving the others", async () => {
      const first = await createRead(READER, { ...read, readAt: "2019-05-02" });
      const second = await createRead(READER, read);
      if (!first.ok || !second.ok) throw new Error("setup failed");

      await expect(removeRead(READER, second.id)).resolves.toEqual({ ok: true });
      expect((await getReads(READER, BOOK_ID)).map((r) => r.id)).toEqual([first.id]);

      // Removing the last read takes the book off this reader's slip entirely.
      await removeRead(READER, first.id);
      expect(await getReads(READER, BOOK_ID)).toEqual([]);
    });

    it("says missing for a read that is already gone", async () => {
      const missing = "00000000-0000-4000-8000-000000000000";
      await expect(removeRead(READER, missing)).resolves.toEqual({ ok: false, reason: "missing" });
      await expect(updateRead(READER, missing, fields)).resolves.toEqual({
        ok: false,
        reason: "missing",
      });
    });
  });
});

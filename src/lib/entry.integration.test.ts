import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getDb, schema } from "@/db";
import { RUN, runKey } from "../../tests/run";
import { getEntry } from "./entry";

/**
 * A permalink's read, against a real database. What is under test is the
 * pairing of handle and id: an entry is found only at its own reader's address.
 */
const url = process.env.DATABASE_URL ?? "";
const hasRealDb = url.length > 0 && !url.includes("placeholder");

const KEY = runKey("entry");
const READER = `_it_entry_reader_${RUN}`;
const OTHER = `_it_entry_other_${RUN}`;
const BOOK_ID = `_it_entry_book_${RUN}`;
const BOOK_KEY = `OL99${KEY}0W`;
const HANDLE = `itentryreader${KEY}`;
const OTHER_HANDLE = `itentryother${KEY}`;

const REVIEWED = crypto.randomUUID();
const BARE = crypto.randomUUID();
const OTHERS = crypto.randomUUID();

describe.skipIf(!hasRealDb)("an entry's permalink (integration)", () => {
  beforeAll(async () => {
    const db = getDb();
    await db
      .insert(schema.user)
      .values([
        { id: READER, name: "Entry Reader", email: `reader-${RUN}@entry.test`, username: HANDLE },
        { id: OTHER, name: "Entry Other", email: `other-${RUN}@entry.test`, username: OTHER_HANDLE },
      ])
      .onConflictDoNothing();
    await db
      .insert(schema.book)
      .values({
        id: BOOK_ID,
        sourceKey: BOOK_KEY,
        title: "An Entry Test",
        authors: ["A. Tester"],
        coverId: 240727,
        coverColor: "#2F5D8A",
        firstPublishYear: 1965,
      })
      .onConflictDoNothing();
    await db.insert(schema.log).values([
      {
        id: REVIEWED,
        userId: READER,
        bookId: BOOK_ID,
        readAt: "2026-08-14",
        rating: "4.5",
        reviewText: "  Better the second time.  ",
        isReread: true,
      },
      { id: BARE, userId: READER, bookId: BOOK_ID, readAt: null, reviewText: "   " },
      { id: OTHERS, userId: OTHER, bookId: BOOK_ID, readAt: "2026-09-01", rating: "2.0" },
    ]);
  });

  afterAll(async () => {
    const db = getDb();
    // Logs cascade from their readers and restrict their book.
    await db.delete(schema.user).where(inArray(schema.user.id, [READER, OTHER]));
    await db.delete(schema.book).where(eq(schema.book.id, BOOK_ID));
  });

  it("finds an entry at its reader's handle, with the book and the reader", async () => {
    const entry = await getEntry(HANDLE, REVIEWED);

    expect(entry).toMatchObject({
      id: REVIEWED,
      reader: { id: READER, name: "Entry Reader", username: HANDLE },
      book: {
        id: BOOK_ID,
        sourceKey: BOOK_KEY,
        title: "An Entry Test",
        authors: ["A. Tester"],
        coverId: 240727,
        coverColor: "#2F5D8A",
        firstPublishYear: 1965,
      },
      rating: 4.5,
      isReread: true,
      review: "Better the second time.",
    });
    expect(entry?.readAt?.toISOString().slice(0, 10)).toBe("2026-08-14");
  });

  /*
   * Every entry has a page. One with no date, no rating and no words still
   * resolves; the page says so rather than 404ing.
   */
  it("finds an entry with no words, and says it has no review", async () => {
    await expect(getEntry(HANDLE, BARE)).resolves.toMatchObject({
      id: BARE,
      readAt: null,
      rating: null,
      review: null,
    });
  });

  it("does not find an entry under someone else's handle", async () => {
    await expect(getEntry(HANDLE, OTHERS)).resolves.toBeNull();
    await expect(getEntry(OTHER_HANDLE, REVIEWED)).resolves.toBeNull();
  });

  it("does not find an id that does not exist", async () => {
    await expect(getEntry(HANDLE, crypto.randomUUID())).resolves.toBeNull();
  });
});

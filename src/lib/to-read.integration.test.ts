import { eq, inArray } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { getDb, schema } from "@/db";
import { createRead } from "./read";
import { getToRead, isOnToRead, removeToRead, saveToRead } from "./to-read";

/**
 * The to-read list against a real database (MRG-059): one row per reader and
 * book, private to its reader, and emptied of a book when it is logged.
 */
const url = process.env.DATABASE_URL ?? "";
const hasRealDb = url.length > 0 && !url.includes("placeholder");

/*
 * Scoped to this run. CI runs a workflow per push and per pull request, and
 * both hit the same Neon branch: with fixed ids, one run's cleanup deletes the
 * rows the other is asserting on, and its writes put back rows the other has
 * just removed. The work keys stay OL-shaped because `book.ol_work_key` is
 * unique and the column is read back as one.
 */
const RUN = process.env.GITHUB_RUN_ID ?? `local${process.pid}`;
const KEY = [...RUN].reduce((hash, char) => (hash * 31 + char.codePointAt(0)!) % 900000, 7) + 100000;

const READER = `_it_toread_reader_${RUN}`;
const OTHER = `_it_toread_other_${RUN}`;
const BOOKS = [`_it_toread_book_a_${RUN}`, `_it_toread_book_b_${RUN}`];
const KEYS = [`OL${KEY}0W`, `OL${KEY}1W`];

describe.skipIf(!hasRealDb)("the to-read list (integration)", () => {
  beforeAll(async () => {
    const db = getDb();
    await db
      .insert(schema.user)
      .values([
        { id: READER, name: "To Read", email: `reader-${RUN}@toread.test` },
        { id: OTHER, name: "Other", email: `other-${RUN}@toread.test` },
      ])
      .onConflictDoNothing();
    await db
      .insert(schema.book)
      .values([
        { id: BOOKS[0], olWorkKey: KEYS[0], title: "First Saved", authors: ["A"] },
        { id: BOOKS[1], olWorkKey: KEYS[1], title: "Second Saved", authors: [] },
      ])
      .onConflictDoNothing();
  });

  afterEach(async () => {
    const db = getDb();
    await db.delete(schema.toRead).where(inArray(schema.toRead.userId, [READER, OTHER]));
    await db.delete(schema.log).where(inArray(schema.log.userId, [READER, OTHER]));
  });

  afterAll(async () => {
    const db = getDb();
    await db.delete(schema.user).where(inArray(schema.user.id, [READER, OTHER]));
    await db.delete(schema.book).where(inArray(schema.book.id, BOOKS));
  });

  it("saves a book once, however many times it is saved, newest first", async () => {
    await saveToRead(READER, BOOKS[0]);
    await saveToRead(READER, BOOKS[1]);
    await expect(saveToRead(READER, BOOKS[0])).resolves.toEqual({ ok: true });

    const list = await getToRead(READER);
    expect(list.map((b) => b.bookId)).toEqual([BOOKS[1], BOOKS[0]]);
    expect(list[1]).toMatchObject({ title: "First Saved", authors: ["A"], olWorkKey: KEYS[0] });
  });

  it("is private: one reader's list never shows another's", async () => {
    await saveToRead(OTHER, BOOKS[0]);
    expect(await getToRead(READER)).toEqual([]);
    expect(await isOnToRead(READER, BOOKS[0])).toBe(false);
    expect(await isOnToRead(OTHER, BOOKS[0])).toBe(true);
  });

  it("takes a book off, and taking off one not there changes nothing", async () => {
    await saveToRead(READER, BOOKS[0]);
    await removeToRead(READER, BOOKS[0]);
    await removeToRead(READER, BOOKS[0]);
    expect(await getToRead(READER)).toEqual([]);
  });

  it("empties a book from the list when the reader logs it, and only for them", async () => {
    await saveToRead(READER, BOOKS[0]);
    await saveToRead(OTHER, BOOKS[0]);

    await createRead(READER, {
      bookId: BOOKS[0],
      readAt: "2026-09-15",
      rating: null,
      review: null,
      isReread: false,
    });

    expect(await isOnToRead(READER, BOOKS[0])).toBe(false);
    expect(await isOnToRead(OTHER, BOOKS[0])).toBe(true);
  });

  it("refuses a book that is not in the database", async () => {
    await expect(saveToRead(READER, `_it_no_such_book_${RUN}`)).resolves.toEqual({ ok: false, reason: "missing" });
    const rows = await getDb().select().from(schema.toRead).where(eq(schema.toRead.userId, READER));
    expect(rows).toEqual([]);
  });
});

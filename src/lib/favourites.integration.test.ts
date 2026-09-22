import { inArray } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { getDb, schema } from "@/db";
import {
  addFavourite,
  getFavouriteState,
  getFavourites,
  isFavourite,
  moveFavourite,
  removeFavourite,
} from "./favourites";
import { createRead, removeRead } from "./read";

/**
 * Favourites against a real database (MRG-071). The rules — four at most, read
 * books only, an order the reader sets — are the database's, so they can only
 * be proved against one.
 */
const url = process.env.DATABASE_URL ?? "";
const hasRealDb = url.length > 0 && !url.includes("placeholder");

// Scoped to this run: CI's push and PR workflows share one Neon branch.
const RUN = process.env.GITHUB_RUN_ID ?? `local${process.pid}`;
const KEY = [...RUN].reduce((hash, char) => (hash * 31 + char.codePointAt(0)!) % 900000, 7) + 100000;

const READER = `_it_fav_reader_${RUN}`;
const OTHER = `_it_fav_other_${RUN}`;
const BOOKS = Array.from({ length: 6 }, (_, i) => `_it_fav_book_${i}_${RUN}`);
const KEYS = BOOKS.map((_, i) => `OL${KEY}${i}W`);

async function read(userId: string, bookId: string) {
  const result = await createRead(userId, {
    bookId,
    readAt: "2026-09-22",
    rating: null,
    review: null,
    isReread: false,
  });
  if (!result.ok) throw new Error("fixture read failed");
  return result.id;
}

const order = async (userId = READER) => (await getFavourites(userId)).map((b) => b.bookId);

describe.skipIf(!hasRealDb)("favourites (integration)", () => {
  beforeAll(async () => {
    const db = getDb();
    await db
      .insert(schema.user)
      .values([
        { id: READER, name: "Fav", email: `reader-${RUN}@fav.test` },
        { id: OTHER, name: "Other", email: `other-${RUN}@fav.test` },
      ])
      .onConflictDoNothing();
    await db
      .insert(schema.book)
      .values(BOOKS.map((id, i) => ({ id, sourceKey: KEYS[i], title: `Fav ${i}`, authors: ["A"] })))
      .onConflictDoNothing();
  });

  afterEach(async () => {
    const db = getDb();
    await db.delete(schema.favourite).where(inArray(schema.favourite.userId, [READER, OTHER]));
    await db.delete(schema.log).where(inArray(schema.log.userId, [READER, OTHER]));
  });

  afterAll(async () => {
    const db = getDb();
    await db.delete(schema.user).where(inArray(schema.user.id, [READER, OTHER]));
    await db.delete(schema.book).where(inArray(schema.book.id, BOOKS));
  });

  it("adds read books at the end of the order, and a repeat changes nothing", async () => {
    for (const book of BOOKS.slice(0, 3)) await read(READER, book);
    for (const book of BOOKS.slice(0, 3)) await addFavourite(READER, book);
    await expect(addFavourite(READER, BOOKS[0])).resolves.toEqual({ ok: true });

    expect(await order()).toEqual(BOOKS.slice(0, 3));
  });

  it("refuses a book the reader has not read", async () => {
    await read(OTHER, BOOKS[0]); // Someone else's read does not count.
    await expect(addFavourite(READER, BOOKS[0])).resolves.toEqual({ ok: false, reason: "unread" });
    expect(await isFavourite(READER, BOOKS[0])).toBe(false);
  });

  /* The CHECK is the limit, not the code: a fifth has nowhere to go. */
  it("holds four, and refuses a fifth", async () => {
    for (const book of BOOKS.slice(0, 5)) await read(READER, book);
    for (const book of BOOKS.slice(0, 4)) {
      await expect(addFavourite(READER, book)).resolves.toEqual({ ok: true });
    }
    await expect(addFavourite(READER, BOOKS[4])).resolves.toEqual({ ok: false, reason: "full" });
    expect(await order()).toEqual(BOOKS.slice(0, 4));
  });

  it("never lets concurrent adds past four", async () => {
    for (const book of BOOKS) await read(READER, book);
    await Promise.all(BOOKS.map((book) => addFavourite(READER, book)));

    const favourites = await order();
    expect(favourites.length).toBeLessThanOrEqual(4);
    expect(new Set(favourites).size).toBe(favourites.length);
  });

  /* A drag and drop: the dropped book takes the place, the rest close up. */
  it("moves a favourite to any position, the others closing up behind it", async () => {
    for (const book of BOOKS.slice(0, 4)) await read(READER, book);
    for (const book of BOOKS.slice(0, 4)) await addFavourite(READER, book);

    await expect(moveFavourite(READER, BOOKS[3], 0)).resolves.toBe(true);
    expect(await order()).toEqual([BOOKS[3], BOOKS[0], BOOKS[1], BOOKS[2]]);

    await expect(moveFavourite(READER, BOOKS[3], 2)).resolves.toBe(true);
    expect(await order()).toEqual([BOOKS[0], BOOKS[1], BOOKS[3], BOOKS[2]]);
  });

  it("does nothing on a drop back in place, and clamps a stale target", async () => {
    for (const book of BOOKS.slice(0, 3)) await read(READER, book);
    for (const book of BOOKS.slice(0, 3)) await addFavourite(READER, book);

    await expect(moveFavourite(READER, BOOKS[1], 1)).resolves.toBe(false);
    // Only three held: position 9 means the end, and opens no gap.
    await expect(moveFavourite(READER, BOOKS[0], 9)).resolves.toBe(true);
    expect(await order()).toEqual([BOOKS[1], BOOKS[2], BOOKS[0]]);
    await expect(moveFavourite(READER, BOOKS[0], -3)).resolves.toBe(true);
    expect(await order()).toEqual([BOOKS[0], BOOKS[1], BOOKS[2]]);
  });

  it("closes the gap a removal leaves, so the next one lands at the end", async () => {
    for (const book of BOOKS.slice(0, 4)) await read(READER, book);
    for (const book of BOOKS.slice(0, 3)) await addFavourite(READER, book);

    await removeFavourite(READER, BOOKS[0]);
    await addFavourite(READER, BOOKS[3]);
    expect(await order()).toEqual([BOOKS[1], BOOKS[2], BOOKS[3]]);
    // Compact: moving to the front of three is still a move.
    await expect(moveFavourite(READER, BOOKS[3], 0)).resolves.toBe(true);
    expect(await order()).toEqual([BOOKS[3], BOOKS[1], BOOKS[2]]);
  });

  it("takes a book off favourites with its last read, not before", async () => {
    const first = await read(READER, BOOKS[0]);
    const again = await read(READER, BOOKS[0]);
    await addFavourite(READER, BOOKS[0]);

    await removeRead(READER, again);
    expect(await isFavourite(READER, BOOKS[0])).toBe(true);
    await removeRead(READER, first);
    expect(await isFavourite(READER, BOOKS[0])).toBe(false);
  });

  it("keeps each reader's favourites to that reader", async () => {
    await read(READER, BOOKS[0]);
    await read(OTHER, BOOKS[1]);
    await addFavourite(READER, BOOKS[0]);
    await addFavourite(OTHER, BOOKS[1]);

    expect(await order(READER)).toEqual([BOOKS[0]]);
    expect(await order(OTHER)).toEqual([BOOKS[1]]);
  });

  it("tells a book page where a favourite stands, and whether there is room", async () => {
    for (const book of BOOKS.slice(0, 5)) await read(READER, book);
    await expect(getFavouriteState(READER, BOOKS[0])).resolves.toEqual({
      isFavourite: false,
      full: false,
      position: -1,
      count: 0,
    });

    for (const book of BOOKS.slice(0, 4)) await addFavourite(READER, book);
    await expect(getFavouriteState(READER, BOOKS[2])).resolves.toEqual({
      isFavourite: true,
      full: true,
      position: 2,
      count: 4,
    });
    await expect(getFavouriteState(READER, BOOKS[4])).resolves.toMatchObject({
      isFavourite: false,
      full: true,
    });
  });
});

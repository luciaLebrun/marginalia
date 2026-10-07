import { eq, inArray } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { getDb, schema } from "@/db";
import { RUN, runKey } from "../../tests/run";
import { createRead } from "./read";
import {
  countBookPassages,
  getPassages,
  keepPassage,
  removePassage,
  updatePassage,
} from "./passage";

/**
 * Margins against a real database (MRG-110): private to the reader, tied to a
 * book, newest first, edited and removed only by their owner.
 */
const url = process.env.DATABASE_URL ?? "";
const hasRealDb = url.length > 0 && !url.includes("placeholder");

const KEY = runKey("passage");

const READER = `_it_passage_reader_${RUN}`;
const OTHER = `_it_passage_other_${RUN}`;
const BOOKS = [`_it_passage_book_a_${RUN}`, `_it_passage_book_b_${RUN}`] as const;
const KEYS = [`OL98${KEY}0W`, `OL98${KEY}1W`] as const;

const input = (bookId: string, words: string, page: number | null = null) => ({
  bookId,
  words,
  page,
  note: null,
});

describe.skipIf(!hasRealDb)("passages (integration)", () => {
  beforeAll(async () => {
    const db = getDb();
    await db
      .insert(schema.user)
      .values([
        { id: READER, name: "Passage", email: `reader-${RUN}@passage.test` },
        { id: OTHER, name: "Other", email: `other-${RUN}@passage.test` },
      ])
      .onConflictDoNothing();
    await db
      .insert(schema.book)
      .values([
        { id: BOOKS[0], sourceKey: KEYS[0], title: "First Kept", authors: ["A"] },
        { id: BOOKS[1], sourceKey: KEYS[1], title: "Second Kept", authors: [] },
      ])
      .onConflictDoNothing();
  });

  afterEach(async () => {
    const db = getDb();
    await db.delete(schema.passage).where(inArray(schema.passage.userId, [READER, OTHER]));
    await db.delete(schema.log).where(inArray(schema.log.userId, [READER, OTHER]));
  });

  afterAll(async () => {
    const db = getDb();
    await db.delete(schema.user).where(inArray(schema.user.id, [READER, OTHER]));
    await db.delete(schema.book).where(inArray(schema.book.id, BOOKS));
  });

  it("keeps passages newest first, with the book and whether it is on the shelf", async () => {
    await keepPassage(READER, input(BOOKS[0], "first", 12));
    await keepPassage(READER, { ...input(BOOKS[1], "second"), note: "mine" });
    await createRead(READER, {
      bookId: BOOKS[1],
      readAt: "2026-09-15",
      rating: null,
      review: null,
      isReread: false,
    });

    const list = await getPassages(READER);
    expect(list.map((p) => p.words)).toEqual(["second", "first"]);
    expect(list[0]).toMatchObject({ title: "Second Kept", note: "mine", page: null, onShelf: true });
    expect(list[1]).toMatchObject({ title: "First Kept", page: 12, onShelf: false, sourceKey: KEYS[0] });
  });

  it("is private, and only the owner may edit or remove", async () => {
    const kept = await keepPassage(OTHER, input(BOOKS[0], "theirs"));
    if (!kept.ok) throw new Error("not kept");

    expect(await getPassages(READER)).toEqual([]);
    expect(await updatePassage(READER, kept.id, { words: "mine now", page: null, note: null })).toBe(false);
    expect(await removePassage(READER, kept.id)).toBe(false);
    expect((await getPassages(OTHER))[0]?.words).toBe("theirs");
  });

  it("edits in place and moves updatedAt", async () => {
    const kept = await keepPassage(READER, input(BOOKS[0], "draft"));
    if (!kept.ok) throw new Error("not kept");

    expect(await updatePassage(READER, kept.id, { words: "final", page: 3, note: "n" })).toBe(true);
    const [row] = await getDb().select().from(schema.passage).where(eq(schema.passage.id, kept.id));
    expect(row).toMatchObject({ words: "final", page: 3, note: "n" });
    expect(row?.updatedAt.getTime()).toBeGreaterThanOrEqual(row?.createdAt.getTime() ?? Infinity);
  });

  it("removes, and counts per book", async () => {
    const kept = await keepPassage(READER, input(BOOKS[0], "one"));
    await keepPassage(READER, input(BOOKS[0], "two"));
    await keepPassage(READER, input(BOOKS[1], "elsewhere"));
    await keepPassage(OTHER, input(BOOKS[0], "not mine"));
    expect(await countBookPassages(READER, BOOKS[0])).toBe(2);

    if (!kept.ok) throw new Error("not kept");
    expect(await removePassage(READER, kept.id)).toBe(true);
    expect(await removePassage(READER, kept.id)).toBe(false);
    expect(await countBookPassages(READER, BOOKS[0])).toBe(1);
  });

  it("refuses a book that is not in the database, and a page of zero", async () => {
    await expect(keepPassage(READER, input(`_it_no_such_book_${RUN}`, "x"))).resolves.toEqual({
      ok: false,
      reason: "missing",
    });
    await expect(keepPassage(READER, input(BOOKS[0], "x", 0))).rejects.toThrow();
  });
});

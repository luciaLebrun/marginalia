import { and, desc, eq, exists, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { sqlState } from "./read";
import type { PassageInput } from "./passage-schema";

/**
 * A reader's margins (MRG-110). Private: every function takes the reader from
 * its caller, which takes it from the session, never from a form.
 */

const FOREIGN_KEY_VIOLATION = "23503";

export interface MarginPassage {
  id: string;
  words: string;
  page: number | null;
  note: string | null;
  createdAt: Date;
  bookId: string;
  sourceKey: string;
  title: string;
  authors: string[];
  coverId: number | null;
  coverUrl: string | null;
  coverColor: string | null;
  /** The reader has logged this book — it has earned its colour. */
  onShelf: boolean;
}

/** The reader's passages, newest first. One indexed read, no external calls. */
export function getPassages(userId: string): Promise<MarginPassage[]> {
  const db = getDb();
  return db
    .select({
      id: schema.passage.id,
      words: schema.passage.words,
      page: schema.passage.page,
      note: schema.passage.note,
      createdAt: schema.passage.createdAt,
      bookId: schema.book.id,
      sourceKey: schema.book.sourceKey,
      title: schema.book.title,
      authors: schema.book.authors,
      coverId: schema.book.coverId,
      coverUrl: schema.book.coverUrl,
      coverColor: schema.book.coverColor,
      onShelf: sql<boolean>`${exists(
        db
          .select({ one: schema.log.id })
          .from(schema.log)
          .where(and(eq(schema.log.userId, userId), eq(schema.log.bookId, schema.book.id))),
      )}`,
    })
    .from(schema.passage)
    .innerJoin(schema.book, eq(schema.book.id, schema.passage.bookId))
    .where(eq(schema.passage.userId, userId))
    .orderBy(desc(schema.passage.createdAt));
}

export function countBookPassages(userId: string, bookId: string): Promise<number> {
  return getDb().$count(
    schema.passage,
    and(eq(schema.passage.userId, userId), eq(schema.passage.bookId, bookId)),
  );
}

export type KeepResult = { ok: true; id: string } | { ok: false; reason: "missing" };

/** Keep a passage. Whether the book exists is decided by the foreign key. */
export async function keepPassage(userId: string, input: PassageInput): Promise<KeepResult> {
  const id = crypto.randomUUID();
  try {
    await getDb()
      .insert(schema.passage)
      .values({
        id,
        userId,
        bookId: input.bookId,
        words: input.words,
        page: input.page,
        note: input.note,
      });
    return { ok: true, id };
  } catch (error) {
    if (sqlState(error) === FOREIGN_KEY_VIOLATION) return { ok: false, reason: "missing" };
    throw error;
  }
}

/** Correct one of the reader's own passages. The book is not editable. */
export async function updatePassage(
  userId: string,
  id: string,
  input: Omit<PassageInput, "bookId">,
): Promise<boolean> {
  const rows = await getDb()
    .update(schema.passage)
    .set({ words: input.words, page: input.page, note: input.note, updatedAt: sql`now()` })
    .where(and(eq(schema.passage.id, id), eq(schema.passage.userId, userId)))
    .returning({ id: schema.passage.id });
  return rows.length > 0;
}

export async function removePassage(userId: string, id: string): Promise<boolean> {
  const rows = await getDb()
    .delete(schema.passage)
    .where(and(eq(schema.passage.id, id), eq(schema.passage.userId, userId)))
    .returning({ id: schema.passage.id });
  return rows.length > 0;
}

import { and, desc, eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { sqlState } from "./read";

/**
 * A reader's to-read list (MRG-059). Private: every function takes the reader
 * from its caller, which takes it from the session, never from a form.
 */

const FOREIGN_KEY_VIOLATION = "23503";

export interface ToReadBook {
  bookId: string;
  olWorkKey: string;
  title: string;
  authors: string[];
  coverId: number | null;
  pageCount: number | null;
  savedAt: Date;
}

export type SaveResult = { ok: true } | { ok: false; reason: "missing" };

/**
 * Put a book on the reader's list. Saving a book already there is not an
 * error — the primary key decides, and the list is unchanged.
 */
export async function saveToRead(userId: string, bookId: string): Promise<SaveResult> {
  try {
    await getDb().insert(schema.toRead).values({ userId, bookId }).onConflictDoNothing();
    return { ok: true };
  } catch (error) {
    if (sqlState(error) === FOREIGN_KEY_VIOLATION) return { ok: false, reason: "missing" };
    throw error;
  }
}

/** Take a book off the reader's list. Taking off a book not on it changes nothing. */
export async function removeToRead(userId: string, bookId: string): Promise<void> {
  await getDb()
    .delete(schema.toRead)
    .where(and(eq(schema.toRead.userId, userId), eq(schema.toRead.bookId, bookId)));
}

export async function isOnToRead(userId: string, bookId: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ bookId: schema.toRead.bookId })
    .from(schema.toRead)
    .where(and(eq(schema.toRead.userId, userId), eq(schema.toRead.bookId, bookId)))
    .limit(1);
  return row !== undefined;
}

/** The reader's list, newest saved first. One indexed read, no external calls. */
export async function getToRead(userId: string): Promise<ToReadBook[]> {
  const rows = await getDb()
    .select({
      bookId: schema.book.id,
      olWorkKey: schema.book.olWorkKey,
      title: schema.book.title,
      authors: schema.book.authors,
      coverId: schema.book.coverId,
      pageCount: schema.book.pageCount,
      savedAt: schema.toRead.createdAt,
    })
    .from(schema.toRead)
    .innerJoin(schema.book, eq(schema.book.id, schema.toRead.bookId))
    .where(eq(schema.toRead.userId, userId))
    .orderBy(desc(schema.toRead.createdAt));

  return rows;
}

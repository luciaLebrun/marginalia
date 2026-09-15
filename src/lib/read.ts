import { and, eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import type { ReadInput } from "./read-schema";

/** Postgres foreign_key_violation. */
const FOREIGN_KEY_VIOLATION = "23503";

export type CreateReadResult =
  | { ok: true; id: string }
  | { ok: false; reason: "missing" };

/**
 * Write one read into a reader's diary.
 *
 * Always a new row: a diary entry is not a rating, and a reread is a second
 * entry rather than an edit of the first (`log` is deliberately not unique on
 * reader and book).
 *
 * Whether the book and the reader still exist is decided by the foreign keys,
 * not by a lookup first — a check-then-insert has a gap for the book to vanish
 * into. A violation comes back as "missing" rather than as a 500.
 */
export async function createRead(
  userId: string,
  input: ReadInput,
): Promise<CreateReadResult> {
  const id = crypto.randomUUID();

  try {
    await getDb()
      .insert(schema.log)
      .values({
        id,
        userId,
        bookId: input.bookId,
        readAt: input.readAt,
        // numeric(2,1) is written as a string; one decimal keeps "4" as "4.0".
        rating: input.rating === null ? null : input.rating.toFixed(1),
        reviewText: input.review,
        isReread: input.isReread,
      });
    return { ok: true, id };
  } catch (error) {
    if (sqlState(error) === FOREIGN_KEY_VIOLATION) return { ok: false, reason: "missing" };
    throw error;
  }
}

export type ChangeReadResult = { ok: true } | { ok: false; reason: "missing" };

/**
 * Correct one of a reader's own reads: date, rating, review, reread.
 *
 * The reader and the read id are both in the WHERE, so a read that belongs to
 * someone else is indistinguishable from one that does not exist — the form's
 * id can never reach another reader's diary. The book is not editable: a read
 * logged against the wrong book is removed and logged again.
 */
export async function updateRead(
  userId: string,
  logId: string,
  input: Omit<ReadInput, "bookId">,
): Promise<ChangeReadResult> {
  const rows = await getDb()
    .update(schema.log)
    .set({
      readAt: input.readAt,
      rating: input.rating === null ? null : input.rating.toFixed(1),
      reviewText: input.review,
      isReread: input.isReread,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.log.id, logId), eq(schema.log.userId, userId)))
    .returning({ id: schema.log.id });

  return rows.length > 0 ? { ok: true } : { ok: false, reason: "missing" };
}

/** Remove one of a reader's own reads for good. Scoped exactly as updateRead. */
export async function removeRead(userId: string, logId: string): Promise<ChangeReadResult> {
  const rows = await getDb()
    .delete(schema.log)
    .where(and(eq(schema.log.id, logId), eq(schema.log.userId, userId)))
    .returning({ id: schema.log.id });

  return rows.length > 0 ? { ok: true } : { ok: false, reason: "missing" };
}

/**
 * The SQLSTATE of a database error, wherever Drizzle has wrapped it.
 *
 * Drizzle puts the driver's error on `.cause`, so the code is not on the error
 * it throws; walking the chain keeps working if another layer wraps it again.
 */
function sqlState(error: unknown): string | null {
  let current: unknown = error;

  for (let depth = 0; current && depth < 5; depth++) {
    if (typeof current !== "object") return null;
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string") return code;
    current = (current as { cause?: unknown }).cause;
  }

  return null;
}

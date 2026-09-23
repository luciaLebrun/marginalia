import { and, asc, eq, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { sqlState } from "./read";

/**
 * A reader's favourite books (MRG-071): at most four, only books they have
 * logged, in an order they set. Every function takes the reader from its
 * caller, which takes it from the session, never from a form.
 *
 * The rules live in the database (see `schema.favourite`), and each write here
 * is ONE statement, because the neon-http driver cannot hold a transaction
 * open. Two concurrent writes can therefore lose a race, but never break a
 * rule: the loser gets a constraint error and a "try again".
 */

/** How many favourites a reader may have. The database's CHECK is the real limit. */
export const MAX_FAVOURITES = 4;

const CHECK_VIOLATION = "23514";
const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";

export interface FavouriteBook {
  bookId: string;
  sourceKey: string;
  title: string;
  authors: string[];
  coverId: number | null;
  coverUrl: string | null;
  coverColor: string | null;
}

export type AddResult =
  | { ok: true }
  | { ok: false; reason: "full" | "unread" | "missing" | "conflict" };

/**
 * Make a logged book a favourite, at the end of the reader's order.
 *
 * One INSERT … SELECT does all of it:
 * - **Only a book the reader has logged:** `EXISTS` on `log`. Unread, it
 *   inserts nothing, which is reported as "unread".
 * - **The end of the order:** the lowest free position. Removal keeps the
 *   positions compact, so that is the end; if a removal was ever interrupted
 *   between its two statements, the gap is filled rather than left.
 * - **At most four:** with no free position it asks for 4, and the CHECK
 *   refuses it.
 *
 * A book already a favourite is left where it is: the primary key decides.
 */
export async function addFavourite(userId: string, bookId: string): Promise<AddResult> {
  try {
    const result = await getDb().execute(sql`
      insert into ${schema.favourite} (user_id, book_id, position)
      select ${userId}, ${bookId}, coalesce(
        (select min(slot) from generate_series(0, ${MAX_FAVOURITES - 1}) as slot
         where slot not in (select position from ${schema.favourite} where user_id = ${userId})),
        ${MAX_FAVOURITES}
      )
      where exists (
        select 1 from ${schema.log} where user_id = ${userId} and book_id = ${bookId}
      )
      on conflict (user_id, book_id) do nothing
      returning book_id
    `);

    if (result.rows.length > 0) return { ok: true };
    // Nothing inserted: either it was already a favourite, or it is unread.
    return (await isFavourite(userId, bookId)) ? { ok: true } : { ok: false, reason: "unread" };
  } catch (error) {
    const state = sqlState(error);
    if (state === CHECK_VIOLATION) return { ok: false, reason: "full" };
    if (state === UNIQUE_VIOLATION) return { ok: false, reason: "conflict" };
    if (state === FOREIGN_KEY_VIOLATION) return { ok: false, reason: "missing" };
    throw error;
  }
}

/**
 * Take a book off the reader's favourites, closing the gap it leaves so the
 * rest keep their order and the next one added lands at the end.
 *
 * Two statements, not one, and not atomic: if the second fails, a gap is left,
 * which `addFavourite` fills and `getFavourites` does not care about. Taking
 * off a book that is not a favourite changes nothing.
 */
export async function removeFavourite(userId: string, bookId: string): Promise<void> {
  const [removed] = await getDb()
    .delete(schema.favourite)
    .where(and(eq(schema.favourite.userId, userId), eq(schema.favourite.bookId, bookId)))
    .returning({ position: schema.favourite.position });
  if (!removed) return;

  // One UPDATE, so the deferrable unique constraint is checked once, after
  // every row has shifted.
  await getDb()
    .update(schema.favourite)
    .set({ position: sql`${schema.favourite.position} - 1` })
    .where(
      and(
        eq(schema.favourite.userId, userId),
        sql`${schema.favourite.position} > ${removed.position}`,
      ),
    );
}

/**
 * Move a favourite to position `to` (0-based), the ones between shifting one
 * place to close up behind it — what a drag and drop does to the order.
 *
 * One UPDATE over the reader's favourites, which the deferrable unique
 * constraint checks after every row has moved. `to` is clamped to the last
 * position held, so a stale page cannot open a gap. Returns whether anything
 * moved: a drop back where it started, or a book that is not a favourite,
 * moves nothing.
 */
export async function moveFavourite(userId: string, bookId: string, to: number): Promise<boolean> {
  const result = await getDb().execute(sql`
    with target as (
      select position as from_pos,
             least(greatest(${to}::int, 0),
                   (select count(*) - 1 from ${schema.favourite} where user_id = ${userId}))::int as to_pos
      from ${schema.favourite} where user_id = ${userId} and book_id = ${bookId}
    )
    update ${schema.favourite} f
    set position = case
      when f.book_id = ${bookId} then t.to_pos
      when t.to_pos > t.from_pos then f.position - 1
      else f.position + 1
    end
    from target t
    where f.user_id = ${userId}
      and t.to_pos <> t.from_pos
      and (f.book_id = ${bookId}
           or f.position between least(t.from_pos, t.to_pos) and greatest(t.from_pos, t.to_pos))
    returning f.book_id
  `);
  return result.rows.length > 0;
}

export async function isFavourite(userId: string, bookId: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ bookId: schema.favourite.bookId })
    .from(schema.favourite)
    .where(and(eq(schema.favourite.userId, userId), eq(schema.favourite.bookId, bookId)))
    .limit(1);
  return row !== undefined;
}

/** The reader's favourites in their order. One indexed read, no external calls. */
export async function getFavourites(userId: string): Promise<FavouriteBook[]> {
  return getDb()
    .select({
      bookId: schema.book.id,
      sourceKey: schema.book.sourceKey,
      title: schema.book.title,
      authors: schema.book.authors,
      coverId: schema.book.coverId,
      coverUrl: schema.book.coverUrl,
      coverColor: schema.book.coverColor,
    })
    .from(schema.favourite)
    .innerJoin(schema.book, eq(schema.book.id, schema.favourite.bookId))
    .where(eq(schema.favourite.userId, userId))
    .orderBy(asc(schema.favourite.position));
}

/**
 * What a book page needs: whether this book is a favourite and where it stands
 * among them, and whether there is room for another. One read.
 */
export async function getFavouriteState(
  userId: string,
  bookId: string,
): Promise<{ isFavourite: boolean; full: boolean; position: number; count: number }> {
  const [row] = await getDb()
    .select({
      count: sql<number>`count(*)::int`,
      position: sql<number | null>`max(case when ${schema.favourite.bookId} = ${bookId} then ${schema.favourite.position} end)::int`,
    })
    .from(schema.favourite)
    .where(eq(schema.favourite.userId, userId));
  const count = row?.count ?? 0;
  const position = row?.position ?? null;
  return {
    isFavourite: position !== null,
    full: count >= MAX_FAVOURITES,
    position: position ?? -1,
    count,
  };
}

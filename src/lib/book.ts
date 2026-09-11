import { eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import type { Book, NewBook } from "@/db/schema";
import {
  enrich,
  fetchWork,
  stripWorkPrefix,
  type BookDetail,
} from "@/lib/books";
import { bandColorFromCover } from "@/lib/cover-color";

/**
 * Opening a book: the one place a book enters our database.
 *
 * A book is copied into `book` the first time anyone opens it and read from
 * Postgres forever after (ADR 0004). Only that first open touches Open Library,
 * so a book someone has already opened keeps rendering through an outage.
 *
 * The page renders one of three outcomes, and as with search the distinction
 * that matters is between "not-found" and "unavailable": an outage must never
 * tell a reader that a book they just searched for does not exist.
 */

export type BookOutcome =
  | { kind: "found"; book: Book }
  | { kind: "not-found" }
  | { kind: "unavailable" };

/** Everything a first open reaches outside Postgres, injectable for tests. */
export interface BookSources {
  fetchWork: (olWorkKey: string) => Promise<BookDetail | null>;
  enrich: (detail: BookDetail) => Promise<BookDetail>;
  bandColor: (coverId: number | null | undefined) => Promise<string | null>;
}

const openLibrary: BookSources = {
  fetchWork,
  enrich,
  bandColor: bandColorFromCover,
};

/**
 * A work key as it arrives from a URL segment: untrusted. Accepts the bare
 * form or the `/works/` form, and nothing that is not shaped like a work key.
 *
 * This is a guard, not a nicety — `fetchWork()` interpolates the key into an
 * Open Library path, so without it `/book/..%2Fsearch` would ask Open Library
 * for a different resource entirely.
 */
export function parseWorkKey(raw: string): string | null {
  const key = stripWorkPrefix(raw.trim());
  return /^OL\d+W$/.test(key) ? key : null;
}

/**
 * Pure. The row a fetched book becomes, minus the id and timestamp the insert
 * supplies. Absent fields are written as null rather than left undefined, so a
 * row says "Open Library did not have this" explicitly.
 */
export function toBookRow(
  detail: BookDetail,
  coverColor: string | null,
): Omit<NewBook, "id" | "cachedAt"> {
  return {
    olWorkKey: detail.olWorkKey,
    olEditionKey: detail.olEditionKey ?? null,
    title: detail.title,
    subtitle: detail.subtitle ?? null,
    authors: detail.authors,
    firstPublishYear: detail.firstPublishYear ?? null,
    coverId: detail.coverId ?? null,
    coverColor,
    isbn13: detail.isbn13 ?? null,
    pageCount: detail.pageCount ?? null,
    description: detail.description ?? null,
    source: detail.source,
  };
}

async function findBook(olWorkKey: string): Promise<Book | null> {
  const [row] = await getDb()
    .select()
    .from(schema.book)
    .where(eq(schema.book.olWorkKey, olWorkKey))
    .limit(1);
  return row ?? null;
}

/**
 * Open a book by work key, copying it into `book` if nobody has before.
 *
 * The returned book's `olWorkKey` can differ from the key asked for: Open
 * Library leaves redirect stubs behind merged works, and the row is always
 * stored under the surviving key. Whether to redirect to it is the caller's
 * comparison to make.
 *
 * A stored row is trusted as it stands, even if its key has since become a
 * stub upstream — re-checking would put Open Library back on the render path.
 *
 * No retry, for the reason search has none. Database errors are not caught:
 * they are ours, not Open Library's, and must not read as "unavailable".
 */
export async function openBook(
  raw: string,
  sources: BookSources = openLibrary,
): Promise<BookOutcome> {
  const key = parseWorkKey(raw);
  if (!key) return { kind: "not-found" };

  const stored = await findBook(key);
  if (stored) return { kind: "found", book: stored };

  let detail: BookDetail | null;
  try {
    detail = await sources.fetchWork(key);
  } catch (error) {
    console.error("Open Library work lookup failed", error);
    return { kind: "unavailable" };
  }
  if (!detail) return { kind: "not-found" };

  // A stub can lead to a work someone already opened under its surviving key.
  if (detail.olWorkKey !== key) {
    const resolved = await findBook(detail.olWorkKey);
    if (resolved) return { kind: "found", book: resolved };
  }

  // Both are best-effort and never throw; neither depends on the other.
  const [enriched, coverColor] = await Promise.all([
    sources.enrich(detail),
    sources.bandColor(detail.coverId),
  ]);

  // Two readers opening the same new book race here. The unique index on
  // ol_work_key decides, and the loser reads the winner's row rather than
  // failing — a check-then-insert would let both through.
  const [inserted] = await getDb()
    .insert(schema.book)
    .values({ id: crypto.randomUUID(), ...toBookRow(enriched, coverColor) })
    .onConflictDoNothing({ target: schema.book.olWorkKey })
    .returning();

  const book = inserted ?? (await findBook(detail.olWorkKey));
  if (!book) {
    throw new Error(`book ${detail.olWorkKey} conflicted on insert but cannot be read`);
  }
  return { kind: "found", book };
}

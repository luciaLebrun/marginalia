import { eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import type { Book, NewBook } from "@/db/schema";
import {
  enrich,
  fetchBook,
  fillCategory,
  parseBookKey,
  sampleUrl,
  type BookDetail,
} from "@/lib/books";
import { bandColorFromCover } from "@/lib/cover-color";

/**
 * Opening a book: the one place a book enters our database.
 *
 * A book is copied into `book` the first time anyone opens it and read from
 * Postgres forever after (ADR 0004). Only that first open touches a source, so
 * a book someone has already opened keeps rendering through an outage — and
 * keeps rendering from the source it was opened at, whatever is primary now.
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
  fetchBook: (sourceKey: string) => Promise<BookDetail | null>;
  enrich: (detail: BookDetail) => Promise<BookDetail>;
  bandColor: (detail: BookDetail) => Promise<string | null>;
}

const live: BookSources = {
  fetchBook,
  // Google first for the description and page count, then Open Library for a
  // category Google did not give. Both best-effort, neither throws.
  enrich: (detail) => enrich(detail).then(fillCategory),
  bandColor: (detail) => bandColorFromCover(sampleUrl(detail)),
};

export { parseBookKey } from "@/lib/books";

/**
 * Pure. The row a fetched book becomes, minus the id and timestamp the insert
 * supplies. Absent fields are written as null rather than left undefined, so a
 * row says "the source did not have this" explicitly.
 */
export function toBookRow(
  detail: BookDetail,
  coverColor: string | null,
): Omit<NewBook, "id" | "cachedAt"> {
  return {
    sourceKey: detail.sourceKey,
    olEditionKey: detail.olEditionKey ?? null,
    title: detail.title,
    subtitle: detail.subtitle ?? null,
    authors: detail.authors,
    firstPublishYear: detail.firstPublishYear ?? null,
    coverId: detail.coverId ?? null,
    coverUrl: detail.coverUrl ?? null,
    coverColor,
    isbn13: detail.isbn13 ?? null,
    pageCount: detail.pageCount ?? null,
    description: detail.description ?? null,
    category: detail.category ?? null,
    source: detail.source,
  };
}

async function findBook(sourceKey: string): Promise<Book | null> {
  const [row] = await getDb()
    .select()
    .from(schema.book)
    .where(eq(schema.book.sourceKey, sourceKey))
    .limit(1);
  return row ?? null;
}

/**
 * The stored row for a work key, or null when nobody has opened it yet.
 *
 * Postgres only, never a source — for callers such as page metadata that
 * must not be the thing that triggers a first open.
 */
export async function findStoredBook(raw: string): Promise<Book | null> {
  const key = parseBookKey(raw);
  return key ? findBook(key) : null;
}

/**
 * Open a book by work key, copying it into `book` if nobody has before.
 *
 * The returned book's `sourceKey` can differ from the key asked for: Open
 * Library leaves redirect stubs behind merged works, and the row is always
 * stored under the surviving key. Whether to redirect to it is the caller's
 * comparison to make. Google keys never move like this — a volume is a volume.
 *
 * A stored row is trusted as it stands, even if its key has since become a
 * stub upstream — re-checking would put the source back on the render path.
 *
 * No retry, for the reason search has none. Database errors are not caught:
 * they are ours, not the source's, and must not read as "unavailable".
 */
export async function openBook(
  raw: string,
  sources: BookSources = live,
): Promise<BookOutcome> {
  const key = parseBookKey(raw);
  if (!key) return { kind: "not-found" };

  const stored = await findBook(key);
  if (stored) return { kind: "found", book: stored };

  let detail: BookDetail | null;
  try {
    detail = await sources.fetchBook(key);
  } catch (error) {
    console.error("book lookup failed", error);
    return { kind: "unavailable" };
  }
  if (!detail) return { kind: "not-found" };

  // A stub can lead to a work someone already opened under its surviving key.
  if (detail.sourceKey !== key) {
    const resolved = await findBook(detail.sourceKey);
    if (resolved) return { kind: "found", book: resolved };
  }

  // Both are best-effort and never throw; neither depends on the other.
  const [enriched, coverColor] = await Promise.all([
    sources.enrich(detail),
    sources.bandColor(detail),
  ]);

  // Two readers opening the same new book race here. The unique index on
  // ol_work_key decides, and the loser reads the winner's row rather than
  // failing — a check-then-insert would let both through.
  const [inserted] = await getDb()
    .insert(schema.book)
    .values({ id: crypto.randomUUID(), ...toBookRow(enriched, coverColor) })
    .onConflictDoNothing({ target: schema.book.sourceKey })
    .returning();

  const book = inserted ?? (await findBook(detail.sourceKey));
  if (!book) {
    throw new Error(`book ${detail.sourceKey} conflicted on insert but cannot be read`);
  }
  return { kind: "found", book };
}

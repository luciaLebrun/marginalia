import { and, eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { handlePath } from "./username";

/**
 * One diary entry, as its permalink shows it: the read, the book it is a read
 * of, and whose diary it belongs to.
 *
 * Every entry has one, reviewed or not — a diary entry is not a rating, and a
 * link to an unreviewed read must not break.
 */
export interface LogEntry {
  id: string;
  reader: { id: string; name: string; username: string };
  book: {
    id: string;
    olWorkKey: string;
    title: string;
    authors: string[];
    coverId: number | null;
    coverColor: string | null;
    firstPublishYear: number | null;
  };
  readAt: Date | null;
  rating: number | null;
  isReread: boolean;
  /** Null when the entry has no words — whitespace is not a review. */
  review: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * A log id as it arrives in a URL segment: untrusted. Log ids are
 * `crypto.randomUUID()`, so anything else is refused before it becomes a
 * query — the same guard the book page puts on a work key.
 */
export function parseLogId(segment: string): string | null {
  const id = segment.trim().toLowerCase();
  return UUID.test(id) ? id : null;
}

export interface ReviewParagraph {
  /**
   * Where this paragraph starts in the review. A reader may write the same
   * line twice, and keying by the words themselves would drop one of them —
   * while keying by array index is what React asks us not to do.
   */
  key: string;
  text: string;
}

/**
 * A review as paragraphs, each carrying its own key.
 *
 * These are the reader's own words, so nothing is stripped or rewritten — only
 * blank lines separate paragraphs, and a run of them is one break. Horizontal
 * whitespace only in the pattern, so it cannot backtrack across lines.
 *
 * The keying lives here rather than in the component: counting offsets means
 * carrying a running total, and a component may not reassign one after render.
 */
export function reviewParagraphs(review: string | null): ReviewParagraph[] {
  if (!review) return [];

  const paragraphs: ReviewParagraph[] = [];
  let offset = 0;

  for (const raw of review.replaceAll("\r\n", "\n").split(/\n[ \t]*\n/)) {
    const text = raw.trim();
    if (text) paragraphs.push({ key: `p${offset}`, text });
    offset += raw.length + 2;
  }

  return paragraphs;
}

/**
 * What a shared link says about itself.
 *
 * This is the one surface built to be sent to someone, so the description is
 * the reader's own opening words — cut on a word, marked as cut, never mid-
 * syllable. Without words it states the fact instead.
 */
export function shareDescription(entry: LogEntry): string {
  const review = entry.review?.replaceAll(/[ \t\n]+/g, " ").trim();
  if (!review) return `${entry.reader.name} read ${entry.book.title}.`;
  if (review.length <= 160) return review;

  const cut = review.slice(0, 160);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 100 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** The canonical address of an entry, under its reader's current handle. */
export function entryPath(username: string, logId: string): string {
  return `${handlePath(username)}/log/${logId}`;
}

/**
 * An entry by its reader's handle and its id, or null.
 *
 * Both have to match. An id under someone else's handle is not found rather
 * than redirected: the address says whose diary this is, and a handle that has
 * been renamed takes its old links with it (ADR 0007), exactly as the profile
 * at that address already does.
 *
 * One indexed read, no external calls — a review renders from Postgres alone.
 */
export async function getEntry(username: string, logId: string): Promise<LogEntry | null> {
  const [row] = await getDb()
    .select({
      id: schema.log.id,
      readAt: schema.log.readAt,
      rating: schema.log.rating,
      isReread: schema.log.isReread,
      reviewText: schema.log.reviewText,
      readerId: schema.user.id,
      readerName: schema.user.name,
      readerUsername: schema.user.username,
      bookId: schema.book.id,
      olWorkKey: schema.book.olWorkKey,
      title: schema.book.title,
      authors: schema.book.authors,
      coverId: schema.book.coverId,
      coverColor: schema.book.coverColor,
      firstPublishYear: schema.book.firstPublishYear,
    })
    .from(schema.log)
    .innerJoin(schema.book, eq(schema.log.bookId, schema.book.id))
    .innerJoin(schema.user, eq(schema.log.userId, schema.user.id))
    .where(and(eq(schema.log.id, logId), eq(schema.user.username, username)))
    .limit(1);

  if (!row?.readerUsername) return null;

  return {
    id: row.id,
    reader: { id: row.readerId, name: row.readerName, username: row.readerUsername },
    book: {
      id: row.bookId,
      olWorkKey: row.olWorkKey,
      title: row.title,
      authors: row.authors,
      coverId: row.coverId,
      coverColor: row.coverColor,
      firstPublishYear: row.firstPublishYear,
    },
    readAt: row.readAt === null ? null : new Date(row.readAt),
    // numeric comes back as a string.
    rating: row.rating === null ? null : Number(row.rating),
    isReread: row.isReread,
    review: row.reviewText?.trim() ? row.reviewText.trim() : null,
  };
}

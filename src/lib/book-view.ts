import { and, eq, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";
import type { Book } from "@/db/schema";
import { INK, fallbackBand, readableOn } from "@/lib/color";

/**
 * The book page, as data. One query and a set of pure helpers, so every rule
 * about what the title page and the date slip say is testable without a
 * browser or a database.
 */

/** One of this reader's reads of this book: a line on the date slip. */
export interface Read {
  id: string;
  readAt: Date | null;
  rating: number | null;
  isReread: boolean;
  hasReview: boolean;
}

/**
 * This reader's reads of one book, newest first, undated last.
 *
 * Only their own: the circle stays on profiles, and a book page that listed
 * everyone's reads would be the start of a feed this product does not have.
 */
export async function getReads(userId: string, bookId: string): Promise<Read[]> {
  const rows = await getDb()
    .select({
      id: schema.log.id,
      readAt: schema.log.readAt,
      rating: schema.log.rating,
      isReread: schema.log.isReread,
      reviewText: schema.log.reviewText,
    })
    .from(schema.log)
    .where(and(eq(schema.log.bookId, bookId), eq(schema.log.userId, userId)))
    // Same ordering as the diary, for the same reason: Postgres puts NULLs
    // first on DESC, which would float an undated read above a dated one.
    .orderBy(
      sql`${schema.log.readAt} desc nulls last`,
      sql`${schema.log.createdAt} desc`,
    );

  return rows.map((row) => ({
    id: row.id,
    readAt: row.readAt === null ? null : new Date(row.readAt),
    // numeric comes back as a string.
    rating: row.rating === null ? null : Number(row.rating),
    isReread: row.isReread,
    hasReview: Boolean(row.reviewText?.trim()),
  }));
}

/** What the slip's band says about how often this book has been read. */
export function describeReads(count: number): string {
  if (count === 0) return "Not on your shelf";
  if (count === 1) return "Read once";
  if (count === 2) return "Read twice";
  return `Read ${count} times`;
}

/**
 * The author band's line. Anthologies can list a dozen names, and a band
 * carries one line of tracked caps, so past three it names two and counts.
 */
export function authorLine(authors: readonly string[]): string {
  const names = authors.map((name) => name.trim()).filter(Boolean);

  if (names.length === 0) return "Author unknown";
  if (names.length === 1) return names[0];
  if (names.length <= 3) {
    return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  }
  const others = names.length - 2;
  return `${names.slice(0, 2).join(", ")} and ${others} others`;
}

export interface ImprintRow {
  label: string;
  value: string;
  href?: string;
}

/**
 * The title page's imprint. A value Open Library did not have is omitted
 * rather than printed as a dash: an imprint lists what is known.
 *
 * The source row is always there and links out to the record — a hyperlink,
 * not an API call, and the attribution the data is owed. It is named for a
 * reader ("Open Library"), with the work key kept in the address, not the text.
 */
export function imprintRows(
  book: Pick<Book, "firstPublishYear" | "pageCount" | "olWorkKey">,
): ImprintRow[] {
  const rows: ImprintRow[] = [];
  if (book.firstPublishYear) {
    rows.push({ label: "First published", value: String(book.firstPublishYear) });
  }
  if (book.pageCount) {
    rows.push({ label: "Pages", value: String(book.pageCount) });
  }
  rows.push({
    label: "Source",
    value: "Open Library",
    href: `https://openlibrary.org/works/${book.olWorkKey}`,
  });
  return rows;
}

/**
 * An Open Library description, as paragraphs a reader should see.
 *
 * Descriptions are contributor-edited markdown-ish text, and they often end in
 * editorial furniture under a dashed rule ("----------\nContains: Dune"), with
 * `([source][1])` citations and link reference definitions scattered through.
 * None of that is the book. Horizontal whitespace only in the patterns, so no
 * expression can backtrack across lines.
 */
export function descriptionParagraphs(text: string | null | undefined): string[] {
  if (!text) return [];

  const [body = ""] = text.replaceAll("\r\n", "\n").split(/^[ \t]*-{3,}[ \t]*$/m);

  return body
    .replaceAll(/^[ \t]*\[\d+\]:[ \t]*\S.*$/gm, "")
    .replaceAll(/\([ \t]*\[source\](?:\[\d+\]|\([^)\n]*\))[ \t]*\)/gi, "")
    .replaceAll(/\[([^\]\n]+)\](?:\[\d+\]|\([^)\n]*\))/g, "$1")
    .split(/\n[ \t]*\n/)
    .map((paragraph) => paragraph.replaceAll(/\s+/g, " ").trim())
    .filter(Boolean);
}

/**
 * A slip date. `read_at` is a calendar date stored at UTC midnight, so it is
 * formatted in UTC — in a local zone west of Greenwich it would print as the
 * day before.
 */
const SLIP_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function slipDate(readAt: Date | null): string {
  return readAt ? SLIP_DATE.format(readAt) : "Undated";
}

/**
 * The author band's ground and foreground.
 *
 * Ink until the book is on this reader's shelf, then the book's own colour —
 * the rule search already keeps. Colour is what a book earns by being logged,
 * so it cannot be worn by a book this reader has not read.
 */
export function bookBand(
  book: Pick<Book, "coverColor" | "olWorkKey">,
  onShelf: boolean,
): { background: string; color: string } {
  const background = onShelf ? (book.coverColor ?? fallbackBand(book.olWorkKey)) : INK;
  return { background, color: readableOn(background) };
}

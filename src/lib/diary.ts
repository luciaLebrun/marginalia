import { desc, eq, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";
import type { DiaryEntry } from "@/components/Entry";

/**
 * The diary query. One indexed read, no external calls.
 *
 * This is the invariant the whole architecture exists for: a reader's record
 * renders from Postgres alone, so it keeps working when openlibrary.org is
 * unreachable — which, being Internet Archive infrastructure, it regularly is.
 */
export async function getDiary(userId: string): Promise<DiaryEntry[]> {
  const rows = await getDb()
    .select({
      id: schema.log.id,
      rating: schema.log.rating,
      readAt: schema.log.readAt,
      isReread: schema.log.isReread,
      reviewText: schema.log.reviewText,
      title: schema.book.title,
      authors: schema.book.authors,
      coverId: schema.book.coverId,
      coverColor: schema.book.coverColor,
      olWorkKey: schema.book.olWorkKey,
    })
    .from(schema.log)
    .innerJoin(schema.book, eq(schema.log.bookId, schema.book.id))
    .where(eq(schema.log.userId, userId))
    // Matches log_user_read_at_idx. Undated entries sort last, then by entry
    // order, so the column never jumps around between visits.
    .orderBy(desc(schema.log.readAt), desc(schema.log.createdAt));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    authors: row.authors,
    coverId: row.coverId,
    coverColor: row.coverColor,
    olWorkKey: row.olWorkKey,
    // numeric comes back as a string; the UI wants a number or nothing.
    rating: row.rating === null ? null : Number(row.rating),
    readAt: row.readAt === null ? null : new Date(row.readAt),
    isReread: row.isReread,
    hasReview: Boolean(row.reviewText?.trim()),
  }));
}

/** Books finished, for the masthead count. */
export async function getDiaryCount(userId: string): Promise<number> {
  const [row] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.log)
    .where(eq(schema.log.userId, userId));
  return row?.count ?? 0;
}

/**
 * Group entries under the year they were finished, newest first.
 *
 * Pure, so the grouping rule is testable without a database. Undated entries
 * collect at the end under their own heading rather than being hidden or
 * silently dated today.
 */
export function groupByYear(
  entries: DiaryEntry[],
): { year: string; entries: DiaryEntry[] }[] {
  const groups = new Map<string, DiaryEntry[]>();

  for (const entry of entries) {
    const year = entry.readAt ? String(entry.readAt.getUTCFullYear()) : "Undated";
    const bucket = groups.get(year);
    if (bucket) bucket.push(entry);
    else groups.set(year, [entry]);
  }

  const dated = [...groups.entries()]
    .filter(([year]) => year !== "Undated")
    .sort((a, b) => Number(b[0]) - Number(a[0]));

  const undated = groups.get("Undated");

  return [
    ...dated.map(([year, list]) => ({ year, entries: list })),
    ...(undated ? [{ year: "Undated", entries: undated }] : []),
  ];
}

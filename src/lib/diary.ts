import { eq, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";
import type { DiaryEntry } from "@/components/Entry";

/**
 * The diary query. One indexed read, no external calls.
 *
 * This is the invariant the whole architecture exists for: a reader's record
 * renders from Postgres alone, so it keeps working when openlibrary.org is
 * unreachable — which, being Internet Archive infrastructure, it regularly is.
 */
export async function getDiary(
  userId: string,
  /** Entries logged after this are new to the reader. Null means all are. */
  lastSeenAt: Date | null = null,
): Promise<DiaryEntry[]> {
  const rows = await getDb()
    .select({
      id: schema.log.id,
      rating: schema.log.rating,
      readAt: schema.log.readAt,
      isReread: schema.log.isReread,
      reviewText: schema.log.reviewText,
      createdAt: schema.log.createdAt,
      title: schema.book.title,
      authors: schema.book.authors,
      coverId: schema.book.coverId,
      coverColor: schema.book.coverColor,
      olWorkKey: schema.book.olWorkKey,
    })
    .from(schema.log)
    .innerJoin(schema.book, eq(schema.log.bookId, schema.book.id))
    .where(eq(schema.log.userId, userId))
    // NULLS LAST is explicit because Postgres defaults DESC to NULLS FIRST,
    // which floats undated entries to the top of the shelf. It also matches how
    // log_user_read_at_idx is built (DESC NULLS LAST), so the two agree — though
    // the secondary created_at sort means the planner still sorts regardless.
    .orderBy(
      sql`${schema.log.readAt} desc nulls last`,
      sql`${schema.log.createdAt} desc`,
    );

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
    // A first visit (no lastSeenAt) is not "everything is new" — that would
    // ink in the whole shelf, which is the entrance the craft floor refuses.
    isNew: lastSeenAt !== null && row.createdAt > lastSeenAt,
  }));
}

/**
 * Record that this reader has now seen their diary. Called from a client
 * effect rather than during render: a server component must not mutate while
 * rendering, and React may render it more than once.
 */
export async function markDiarySeen(userId: string): Promise<void> {
  await getDb()
    .update(schema.user)
    .set({ lastSeenAt: new Date() })
    .where(eq(schema.user.id, userId));
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
 * The years this diary spans, e.g. "2025–2026" or "2026".
 *
 * Returns a string always, never null. It holds the right edge of the
 * masthead's name field, and a nullable value there leaves that band a
 * justify-between row with one occupant — which is the void this exists to
 * fill. Two states yield no span of their own and both fall back to the
 * current year, the year the diary is being started in:
 *
 *   - an empty shelf, which is what every new account opens on
 *   - entries that are all undated (such a diary has no year bands either)
 *
 * Derived from the entries rather than read from a column, so unlike a
 * username it cannot be absent for a real reader.
 */
export function readingSpan(entries: DiaryEntry[], now = new Date()): string {
  const years = entries
    .map((e) => e.readAt?.getUTCFullYear())
    .filter((y): y is number => typeof y === "number");

  if (years.length === 0) return String(now.getUTCFullYear());

  const first = Math.min(...years);
  const last = Math.max(...years);
  return first === last ? String(first) : `${first}\u2013${last}`;
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

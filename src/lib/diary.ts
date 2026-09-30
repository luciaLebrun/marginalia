import { eq, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { CATEGORY_PENDING } from "@/db/schema";
import type { DiaryEntry } from "@/components/Entry";
import { slipDate } from "@/lib/slip-date";

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
      coverUrl: schema.book.coverUrl,
      coverColor: schema.book.coverColor,
      sourceKey: schema.book.sourceKey,
      category: schema.book.category,
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
    coverUrl: row.coverUrl,
    coverColor: row.coverColor,
    sourceKey: row.sourceKey,
    // A row the MRG-072 backfill has not reached yet is simply uncategorised.
    category: row.category === CATEGORY_PENDING ? null : row.category,
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
 * A linked cell's accessible name: one sentence rather than the author twice
 * (band, then the jacket's alt text), keeping what the record band shows.
 */
export function entryLabel(entry: DiaryEntry): string {
  return [
    entry.title,
    entry.authors[0] && `by ${entry.authors[0]}`,
    entry.rating === null ? "unrated" : `rated ${entry.rating} out of 5`,
    entry.readAt && `read ${slipDate(entry.readAt)}`,
    entry.isReread && "reread",
  ]
    .filter(Boolean)
    .join(", ");
}

/** The ways a shelf can be grouped (MRG-072), carried in the URL as `?by=`. */
export const SHELF_ORDERS = ["year", "author", "category"] as const;
export type ShelfOrder = (typeof SHELF_ORDERS)[number];

/** A `?by=` value as it arrives: anything unknown is the default, year. */
export function parseShelfOrder(raw: unknown): ShelfOrder {
  return SHELF_ORDERS.find((o) => o === raw) ?? "year";
}

/** Name parts that belong to the surname: "Le Guin" files under L. */
const PARTICLES = new Set(["le", "la", "de", "du", "des", "van", "von", "der", "den", "di", "da", "del", "della"]);
const SUFFIXES = new Set(["jr", "jr.", "sr", "sr.", "ii", "iii", "iv"]);

/**
 * Pure. The key an author sorts under: their surname, with any particle
 * before it, so "Ursula K. Le Guin" is "le guin" and "Frank Herbert" is
 * "herbert". A single-word name sorts as itself.
 *
 * ponytail: a heuristic on one stored string. It misfiles names written
 * surname-first ("Murakami Haruki"); fix at the source if one shows up.
 */
export function surnameKey(name: string): string {
  const parts = name.trim().split(/\s+/);
  while (parts.length > 1 && SUFFIXES.has(parts.at(-1)!.toLowerCase())) parts.pop();
  let start = parts.length - 1;
  while (start > 1 && PARTICLES.has(parts[start - 1].toLowerCase())) start--;
  return parts.slice(start).join(" ").toLowerCase();
}

const byText = (a: string, b: string) =>
  a.localeCompare(b, "en", { sensitivity: "base" });

/** How each order files an entry, orders its groups, and names the leftovers. */
const GROUPINGS: Record<
  ShelfOrder,
  {
    keyOf: (entry: DiaryEntry) => string | null;
    compare: (a: string, b: string) => number;
    rest: string;
  }
> = {
  year: {
    keyOf: (e) => (e.readAt ? String(e.readAt.getUTCFullYear()) : null),
    compare: (a, b) => Number(b) - Number(a),
    rest: "Undated",
  },
  author: {
    // One author per book, the first, so each book appears once.
    keyOf: (e) => e.authors[0]?.trim() || null,
    compare: (a, b) => byText(surnameKey(a), surnameKey(b)) || byText(a, b),
    rest: "Unknown author",
  },
  category: {
    keyOf: (e) => e.category,
    compare: byText,
    rest: "Uncategorised",
  },
};

/**
 * Group entries for the shelf: by the year they were finished (newest first),
 * by author (by surname), or by category (A–Z).
 *
 * Pure, so the grouping rule is testable without a database. Entries keep the
 * diary's order inside a group. The ones with nothing to file them under
 * collect at the end under their own heading rather than being hidden or
 * silently dated today.
 */
export function groupShelf(
  entries: DiaryEntry[],
  by: ShelfOrder = "year",
): { label: string; entries: DiaryEntry[]; rest?: true }[] {
  const { keyOf, compare, rest } = GROUPINGS[by];
  const groups = new Map<string | null, DiaryEntry[]>();

  for (const entry of entries) {
    const key = keyOf(entry);
    const bucket = groups.get(key);
    if (bucket) bucket.push(entry);
    else groups.set(key, [entry]);
  }

  const filed = [...groups.entries()]
    .filter((g): g is [string, DiaryEntry[]] => g[0] !== null)
    .sort((a, b) => compare(a[0], b[0]));
  const unfiled = groups.get(null);

  return [
    ...filed.map(([label, list]) => ({ label, entries: list })),
    ...(unfiled ? [{ label: rest, entries: unfiled, rest: true as const }] : []),
  ];
}

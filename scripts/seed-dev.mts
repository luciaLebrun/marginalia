/**
 * Development seed. Creates one local user and logs real books against them.
 *
 * Every book is fetched live from Open Library, so the titles, authors, covers
 * and derived band colours are all real — only "who read it" is invented, and
 * that never leaves your machine. Nothing here ships, and PRODUCT.md's rule
 * stands: no fictional activity may appear in a design or in production.
 *
 *   pnpm seed:dev          seed
 *   pnpm seed:dev --clear  remove everything this script created
 */
import { eq } from "drizzle-orm";

import { getDb, schema } from "../src/db/index.ts";
import { fetchWork, searchBooks } from "../src/lib/books/openlibrary.ts";
import { bandColorFromCover } from "../src/lib/cover-color.ts";

const USER_ID = "dev-reader";
const EMAIL = "dev@marginalia.local";

/** Real books, spread across years so the year rules have something to rule. */
const SHELF: [query: string, readAt: string, rating: number | null][] = [
  ["Piranesi Susanna Clarke", "2026-08-14", 5],
  ["Dune Frank Herbert", "2026-07-02", 4.5],
  ["The Overstory Richard Powers", "2026-06-21", 4],
  ["Klara and the Sun Ishiguro", "2026-05-09", 3.5],
  ["A Wizard of Earthsea Le Guin", "2026-03-30", 5],
  ["The Left Hand of Darkness Le Guin", "2026-02-11", 4.5],
  ["Station Eleven Mandel", "2025-12-28", 4],
  ["The Remains of the Day Ishiguro", "2025-11-15", 5],
  ["Jonathan Strange and Mr Norrell", "2025-09-03", 4.5],
  ["Never Let Me Go Ishiguro", "2025-06-19", null],
  ["The Dispossessed Le Guin", "2025-04-07", 4],
];

async function retry<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      return await fn();
    } catch {
      if (attempt < 6) await new Promise((r) => setTimeout(r, attempt * 1200));
    }
  }
  console.warn(`  ! gave up on ${label}`);
  return null;
}

const db = getDb();

if (process.argv.includes("--clear")) {
  await db.delete(schema.log).where(eq(schema.log.userId, USER_ID));
  await db.delete(schema.user).where(eq(schema.user.id, USER_ID));
  console.log("cleared dev user and their entries (books left cached)");
  process.exit(0);
}

await db
  .insert(schema.user)
  .values({ id: USER_ID, name: "Lucia", email: EMAIL, username: "lucia" })
  .onConflictDoNothing();

await db.delete(schema.log).where(eq(schema.log.userId, USER_ID));

let logged = 0;
for (const [query, readAt, rating] of SHELF) {
  const results = await retry(query, () => searchBooks(query, 1));
  const summary = results?.[0];
  if (!summary) continue;

  const detail = await retry(summary.olWorkKey, () => fetchWork(summary.olWorkKey));
  const book = detail ?? { ...summary, source: "openlibrary" as const };

  const coverColor = await retry("colour", () => bandColorFromCover(book.coverId));

  const [row] = await db
    .insert(schema.book)
    .values({
      id: crypto.randomUUID(),
      olWorkKey: book.olWorkKey,
      title: book.title,
      subtitle: book.subtitle,
      authors: book.authors,
      firstPublishYear: book.firstPublishYear,
      coverId: book.coverId,
      coverColor,
      isbn13: book.isbn13,
      description: "description" in book ? book.description : undefined,
      source: book.source,
    })
    .onConflictDoUpdate({
      target: schema.book.olWorkKey,
      set: { coverColor, cachedAt: new Date() },
    })
    .returning({ id: schema.book.id });

  await db.insert(schema.log).values({
    id: crypto.randomUUID(),
    userId: USER_ID,
    bookId: row.id,
    rating: rating === null ? null : String(rating),
    readAt,
  });

  logged++;
  console.log(
    `  ${String(logged).padStart(2)}. ${book.title}  ${coverColor ?? "(fallback)"}`,
  );
}

console.log(`\nseeded ${logged}/${SHELF.length} entries for @lucia`);

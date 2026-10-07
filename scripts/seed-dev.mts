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
import { fetchBook, sampleUrl, searchBooks } from "../src/lib/books/index.ts";
import { bandColorFromCover } from "../src/lib/cover-color.ts";
import { generateInviteCode } from "../src/lib/invite-code.ts";
import type { BookSummary } from "../src/lib/books/types.ts";

const USER_ID = "dev-reader";
const EMAIL = "dev@marginalia.local";

/**
 * A second reader who has signed in but claimed nothing yet — the state
 * `/dev/claim` exercises. Kept separate from dev-reader so the two harness
 * routes do not fight over one row: the shelf needs a claimed username for
 * `/@lucia` to resolve, and the claim form needs an unclaimed one.
 */
const NEWCOMER_ID = "dev-newcomer";
const NEWCOMER_EMAIL = "newcomer@marginalia.local";

/** Real books, spread across years so the year rules have something to rule. */
const SHELF: [title: string, author: string, readAt: string, rating: number | null][] = [
  ["Piranesi", "Susanna Clarke", "2026-08-14", 5],
  ["Dune", "Frank Herbert", "2026-07-02", 4.5],
  ["The Overstory", "Richard Powers", "2026-06-21", 4],
  ["Klara and the Sun", "Ishiguro", "2026-05-09", 3.5],
  ["A Wizard of Earthsea", "Le Guin", "2026-03-30", 5],
  ["The Left Hand of Darkness", "Le Guin", "2026-02-11", 4.5],
  ["Station Eleven", "Mandel", "2025-12-28", 4],
  ["The Remains of the Day", "Ishiguro", "2025-11-15", 5],
  ["Jonathan Strange and Mr Norrell", "Susanna Clarke", "2025-09-03", 4.5],
  ["Never Let Me Go", "Ishiguro", "2025-06-19", null],
  ["The Dispossessed", "Le Guin", "2025-04-07", 4],
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
const DAY = 24 * 60 * 60 * 1000;

if (process.argv.includes("--clear")) {
  await db.delete(schema.passage).where(eq(schema.passage.userId, USER_ID));
  await db.delete(schema.log).where(eq(schema.log.userId, USER_ID));
  await db.delete(schema.inviteCode).where(eq(schema.inviteCode.createdBy, USER_ID));
  await db.delete(schema.user).where(eq(schema.user.id, USER_ID));
  await db.delete(schema.user).where(eq(schema.user.id, NEWCOMER_ID));
  console.log("cleared dev users and their entries (books left cached)");
  process.exit(0);
}

await db
  .insert(schema.user)
  .values({ id: USER_ID, name: "Lucia", email: EMAIL, username: "lucia" })
  .onConflictDoNothing();

// Reassert the handle: a claim test or a manual poke may have cleared it, and
// /@lucia has to resolve for the profile route to be exercisable.
await db
  .update(schema.user)
  .set({
    username: "lucia",
    bio: "Mostly science fiction, and whatever the last book made me want to read next.",
  })
  .where(eq(schema.user.id, USER_ID));

await db
  .insert(schema.user)
  .values({ id: NEWCOMER_ID, name: "Newcomer", email: NEWCOMER_EMAIL })
  .onConflictDoNothing();

// Always unclaimed, so /dev/claim always has a form to show.
await db
  .update(schema.user)
  .set({ username: null })
  .where(eq(schema.user.id, NEWCOMER_ID));

await db.delete(schema.passage).where(eq(schema.passage.userId, USER_ID));
await db.delete(schema.favourite).where(eq(schema.favourite.userId, USER_ID));
await db.delete(schema.log).where(eq(schema.log.userId, USER_ID));

let logged = 0;
const loggedBooks: string[] = [];
const bookIds = new Map<string, string>();
for (const [title, author, readAt, rating] of SHELF) {
  const results: BookSummary[] | null = await retry(title, () =>
    searchBooks({ title, author }, 1),
  );
  const summary = results?.[0];
  if (!summary) continue;

  const detail = await retry(summary.sourceKey, () => fetchBook(summary.sourceKey));
  const book = detail ?? { ...summary, source: "openlibrary" as const };

  const coverColor = await retry("colour", () => bandColorFromCover(sampleUrl(book)));

  const [row] = await db
    .insert(schema.book)
    .values({
      id: crypto.randomUUID(),
      sourceKey: book.sourceKey,
      title: book.title,
      subtitle: book.subtitle,
      authors: book.authors,
      firstPublishYear: book.firstPublishYear,
      coverId: book.coverId,
      coverUrl: book.coverUrl,
      coverColor,
      isbn13: book.isbn13,
      description: "description" in book ? book.description : undefined,
      source: book.source,
    })
    .onConflictDoUpdate({
      target: schema.book.sourceKey,
      set: { coverColor, cachedAt: new Date() },
    })
    .returning({ id: schema.book.id });
  if (!row) throw new Error(`upsert of ${book.sourceKey} returned no row`);

  await db.insert(schema.log).values({
    id: crypto.randomUUID(),
    userId: USER_ID,
    bookId: row.id,
    rating: rating === null ? null : String(rating),
    readAt,
  });

  logged++;
  loggedBooks.push(row.id);
  bookIds.set(title, row.id);
  console.log(
    `  ${String(logged).padStart(2)}. ${book.title}  ${coverColor ?? "(fallback)"}`,
  );
}

console.log(`\nseeded ${logged}/${SHELF.length} entries for @lucia`);

// Three favourites (MRG-071), so the band shows its fourth position ruled and
// empty — room for another — and every arrange state has a book to stand on.
const favourites = [...new Set(loggedBooks)].slice(0, 3);
await db
  .insert(schema.favourite)
  .values(favourites.map((bookId, position) => ({ userId: USER_ID, bookId, position })));
console.log(`seeded ${favourites.length} favourites`);

/*
 * Three passages (MRG-110), short real quotations from books logged above, so
 * /margins has a journal to show: one with a note, one without a page.
 */
const PASSAGES: [title: string, words: string, page: number | null, note: string | null][] = [
  ["Dune", "Fear is the mind-killer.", 8, "Said over and over until it stops being a line."],
  [
    "The Remains of the Day",
    "What is the point in worrying oneself too much about what one could or could not have done to control the course one’s life took?",
    244,
    null,
  ],
  ["Piranesi", "The beauty of the House is immeasurable; its kindness infinite.", null, null],
];
const passages = PASSAGES.flatMap(([title, words, page, note], i) => {
  const bookId = bookIds.get(title);
  // Staggered so "newest first" has an order to show.
  return bookId
    ? [{ id: crypto.randomUUID(), userId: USER_ID, bookId, words, page, note, createdAt: new Date(Date.now() - i * DAY) }]
    : [];
});
if (passages.length > 0) await db.insert(schema.passage).values(passages);
console.log(`seeded ${passages.length} passages`);

/*
 * An invite run in all three states, so `/dev/settings` shows what the owner
 * actually sees rather than one row of one kind. The codes come from the real
 * CSPRNG; only "who used one" is local fiction, and it never leaves this
 * machine — the same rule the shelf above follows.
 */
await db.delete(schema.inviteCode).where(eq(schema.inviteCode.createdBy, USER_ID));

await db.insert(schema.inviteCode).values([
  {
    code: generateInviteCode(),
    createdBy: USER_ID,
    expiresAt: new Date(Date.now() + 30 * DAY),
  },
  {
    code: generateInviteCode(),
    createdBy: USER_ID,
    usedBy: NEWCOMER_ID,
    usedAt: new Date(Date.now() - 3 * DAY),
    expiresAt: new Date(Date.now() + 27 * DAY),
  },
  {
    code: generateInviteCode(),
    createdBy: USER_ID,
    expiresAt: new Date(Date.now() - 2 * DAY),
  },
]);

console.log("seeded 3 invite codes: one unused, one used, one expired");

// postgres-js holds its connections open; close them so the script exits.
await db.$client.end();

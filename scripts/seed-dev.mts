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
import { generateInviteCode } from "../src/lib/invite-code.ts";

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


/*
 * An invite run in all three states, so `/dev/settings` shows what the owner
 * actually sees rather than one row of one kind. The codes come from the real
 * CSPRNG; only "who used one" is local fiction, and it never leaves this
 * machine — the same rule the shelf above follows.
 */
await db.delete(schema.inviteCode).where(eq(schema.inviteCode.createdBy, USER_ID));

const DAY = 24 * 60 * 60 * 1000;
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

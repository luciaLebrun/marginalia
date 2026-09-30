/**
 * Fill in `book.category` for rows opened before MRG-072.
 *
 * Migration 0006 marks every such row `CATEGORY_PENDING`. This runs in the
 * Vercel build straight after `db:migrate` (see vercel.json), so each
 * environment backfills its own database, once. A row whose source is down
 * keeps its mark and is retried on the next build; once none are left this
 * costs one query.
 *
 *   pnpm backfill:categories
 */
import { eq } from "drizzle-orm";

import { getDb, schema } from "../src/db/index.ts";
import { CATEGORY_PENDING } from "../src/db/schema.ts";
import { fetchBook, fillCategory } from "../src/lib/books/index.ts";

/** Upstream requests in flight at once. Polite to both sources. */
const CONCURRENCY = 4;

type Row = { id: string; sourceKey: string; title: string; authors: string[] };

/** The category, null when there is none, or undefined when the source is down. */
async function lookUp(row: Row): Promise<string | null | undefined> {
  let detail;
  try {
    detail = await fetchBook(row.sourceKey);
  } catch {
    return undefined;
  }
  // A book gone from its source can still be found by title at Open Library.
  const filled = await fillCategory(
    detail ?? { ...row, source: "openlibrary" },
  );
  return filled.category ?? null;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("backfill-categories: no DATABASE_URL, skipped");
    return;
  }
  const db = getDb();
  const rows = await db
    .select({
      id: schema.book.id,
      sourceKey: schema.book.sourceKey,
      title: schema.book.title,
      authors: schema.book.authors,
    })
    .from(schema.book)
    .where(eq(schema.book.category, CATEGORY_PENDING));

  let filled = 0;
  let missed = 0;
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    await Promise.all(
      rows.slice(i, i + CONCURRENCY).map(async (row) => {
        const category = await lookUp(row);
        if (category === undefined) {
          missed++;
          return;
        }
        await db
          .update(schema.book)
          .set({ category })
          .where(eq(schema.book.id, row.id));
        filled++;
      }),
    );
  }
  console.log(
    `backfill-categories: ${filled} filled, ${missed} left for the next build (source unavailable)`,
  );
}

await main();

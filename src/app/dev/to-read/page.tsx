import { notFound } from "next/navigation";

import search from "../../../../tests/fixtures/openlibrary-search-dune.json";
import freakonomics from "../../../../tests/fixtures/openlibrary-search-freakonomics.json";
import subtitled from "../../../../tests/fixtures/openlibrary-search-subtitled.json";
import { RemovableToRead } from "./RemovableToRead";
import { ToReadView } from "@/components/ToReadView";
import { normalizeSearchResponse } from "@/lib/books/openlibrary";
import type { ToReadBook } from "@/lib/to-read";

/**
 * Development harness for `/to-read`, which is signed-in only. Renders the
 * real view from recorded Open Library fixtures, switched by `?state=`:
 *
 * - `stack` (default) — five books, newest saved first, one without a cover.
 * - `one` — a single book.
 * - `long` — ten books, enough for the filter field.
 * - `eight` — exactly the filter's threshold.
 * - `empty` — nothing waiting.
 *
 * `&stub=1` swaps the refusing action for one that succeeds after a pause and
 * drops the spine, so the pending and focus-after states can be driven.
 *
 * The books are real recorded data. Which ones are saved, and when, is
 * invented, as `/dev/book` invents reads. Page counts other than Dune's (from
 * the recorded Google Books volume) are typical of common editions, set so the
 * stack shows spines of different thickness. It 404s in production and
 * grants nothing: no session, no database.
 */
const summaries = [
  ...normalizeSearchResponse(search),
  ...normalizeSearchResponse(freakonomics),
  ...normalizeSearchResponse(subtitled),
];

const PAGES: Record<string, number> = {
  Dune: 604,
  "Dune Messiah": 256,
  "Children of Dune": 444,
  Freakonomics: 320,
  "Guns, Germs, and Steel": 480,
};

const STACK: ToReadBook[] = summaries
  .filter((summary) => summary.title in PAGES)
  .map((summary, index) => ({
    bookId: `dev-toread-${summary.sourceKey}`,
    sourceKey: summary.sourceKey,
    title: summary.title,
    authors: summary.authors,
    coverId: summary.coverId ?? null,
    coverUrl: summary.coverUrl ?? null,
    pageCount: PAGES[summary.title] ?? null,
    savedAt: new Date(Date.UTC(2026, 8, 14 - index)),
  }))
  .reverse();

export default async function DevToReadPage({ searchParams }: PageProps<"/dev/to-read">) {
  if (process.env.NODE_ENV === "production") notFound();

  const { state, stub } = await searchParams;
  let books = STACK;
  if (state === "empty") books = [];
  else if (state === "long")
    books = [...STACK, ...STACK].map((book, i) => ({ ...book, bookId: `${book.bookId}-${i}` }));
  else if (state === "eight")
    books = [...STACK, ...STACK].slice(0, 8).map((book, i) => ({ ...book, bookId: `${book.bookId}-${i}` }));
  else if (state === "one") books = STACK.slice(0, 1);
  return stub ? <RemovableToRead books={books} /> : <ToReadView books={books} />;
}

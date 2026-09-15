import { notFound } from "next/navigation";

import search from "../../../../tests/fixtures/openlibrary-search-dune.json";
import freakonomics from "../../../../tests/fixtures/openlibrary-search-freakonomics.json";
import subtitled from "../../../../tests/fixtures/openlibrary-search-subtitled.json";
import { ToReadView } from "@/components/ToReadView";
import { normalizeSearchResponse } from "@/lib/books/openlibrary";
import type { ToReadBook } from "@/lib/to-read";

/**
 * Development harness for `/to-read`, which is signed-in only. Renders the
 * real view from recorded Open Library fixtures, switched by `?state=`:
 *
 * - `stack` (default) — five books, newest saved first, one without a cover.
 * - `one` — a single book.
 * - `empty` — nothing waiting.
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

/*
 * The recorded search fixture carries CoverIDs that Open Library serves as
 * other books' jackets for the Dune titles (see /dev/book). Dune takes the
 * CoverID live Open Library returns for its key, as /dev/book does; Dune
 * Messiah is shown coverless rather than wearing a stranger's jacket.
 */
const COVERS: Record<string, number | null> = { Dune: 11481354, "Dune Messiah": null };

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
    bookId: `dev-toread-${summary.olWorkKey}`,
    olWorkKey: summary.olWorkKey,
    title: summary.title,
    authors: summary.authors,
    coverId: summary.title in COVERS ? COVERS[summary.title] : (summary.coverId ?? null),
    pageCount: PAGES[summary.title],
    savedAt: new Date(Date.UTC(2026, 8, 14 - index)),
  }))
  .reverse();

export default async function DevToReadPage({ searchParams }: PageProps<"/dev/to-read">) {
  if (process.env.NODE_ENV === "production") notFound();

  const { state } = await searchParams;
  if (state === "empty") return <ToReadView books={[]} />;
  if (state === "one") return <ToReadView books={STACK.slice(0, 1)} />;
  return <ToReadView books={STACK} />;
}

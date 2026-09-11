import { notFound } from "next/navigation";
import { Suspense } from "react";

import dune from "../../../../tests/fixtures/openlibrary-search-dune.json";
import { SearchField } from "@/components/SearchField";
import { SearchPending, SearchResults } from "@/components/SearchResults";
import { WordmarkBand } from "@/components/WordmarkBand";
import { OpenLibraryError, searchBooks } from "@/lib/books";
import { normalizeSearchResponse } from "@/lib/books/openlibrary";
import { parseQuery, type Search } from "@/lib/search";

/**
 * Development harness for the search surface.
 *
 * `/search` is behind Google OAuth, which cannot be driven headlessly, so this
 * renders the same components with the search function swapped by `?source=`:
 *
 * - `fixture` (default) — the recorded Dune response; what e2e runs against,
 *   so a third-party outage cannot turn a test red.
 * - `live` — real Open Library, for looking at a full page of real covers.
 * - `empty` — no matches.
 * - `down` — Open Library erroring.
 * - `slow` — the fixture after four seconds, to see the pending state.
 *
 * It 404s outside development, and it grants nothing: no session, no database,
 * no mutation.
 */
const SOURCES: Record<string, Search> = {
  fixture: async () => normalizeSearchResponse(dune),
  live: searchBooks,
  empty: async () => [],
  down: async () => {
    throw new OpenLibraryError(503, "dev harness: simulated outage");
  },
  slow: async () => {
    await new Promise((resolve) => setTimeout(resolve, 4000));
    return normalizeSearchResponse(dune);
  },
};

export default async function DevSearchPage({
  searchParams,
}: PageProps<"/dev/search">) {
  if (process.env.NODE_ENV === "production") notFound();

  const params = await searchParams;
  const query = parseQuery(params.q);
  const source =
    typeof params.source === "string" && Object.hasOwn(SOURCES, params.source)
      ? params.source
      : "fixture";

  return (
    <main className="flex-1">
      <WordmarkBand />
      <h1 className="sr-only">Search for a book</h1>
      <SearchField query={query} action="/dev/search" hidden={{ source }} />
      <Suspense key={`${source}:${query}`} fallback={<SearchPending diaryHref="/dev/shelf" />}>
        <SearchResults query={query} search={SOURCES[source]} diaryHref="/dev/shelf" />
      </Suspense>
    </main>
  );
}

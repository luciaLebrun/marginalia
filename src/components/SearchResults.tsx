import Link from "next/link";

import { SearchResult } from "./SearchResult";
import { bandText, runSearch, type Search } from "@/lib/search";

/**
 * Everything under the search field: the record band, then whichever state
 * the search landed in. Rendered inside a Suspense boundary keyed on the query,
 * so the field stays put while Open Library answers.
 */
export async function SearchResults({
  query,
  search,
  diaryHref = "/",
}: Readonly<{
  query: string;
  /** Defaults to Open Library; the dev harness substitutes a fixture. */
  search?: Search;
  diaryHref?: string;
}>) {
  const outcome = await runSearch(query, search);

  return (
    <>
      <RecordBand text={bandText(outcome)} diaryHref={diaryHref} />

      {outcome.kind === "results" && (
        <div className="px-4 py-6 sm:px-6">
          <ol className="shelf-grid">
            {outcome.books.map((book) => (
              <SearchResult key={book.olWorkKey} book={book} />
            ))}
          </ol>
        </div>
      )}

      {outcome.kind === "none" && (
        <p className="max-w-[38rem] px-4 py-6 text-[0.9375rem] leading-relaxed text-ink-soft sm:px-6">
          Nothing on Open Library matches “{outcome.query}”. Check the
          spelling, or try just the author’s surname.
        </p>
      )}

      {/* Not alarm red: nothing was refused, and nothing the reader did is
          wrong. Sunk paper sets it apart from "no matches", which it must never
          be mistaken for. */}
      {outcome.kind === "unavailable" && (
        <div className="border-b border-rule bg-paper-sunk px-4 py-6 sm:px-6">
          <p className="max-w-[38rem] text-[0.9375rem] leading-relaxed text-ink-soft">
            Open Library isn’t answering, so search can’t run right now. Your
            diary is unaffected — try again in a few minutes.
          </p>
        </div>
      )}
    </>
  );
}

/**
 * While Open Library answers: the band says so, and the grid it will fill is
 * drawn as ruled empty positions — a sheet waiting for print, not skeleton
 * cards pretending to be books.
 */
export function SearchPending({ diaryHref = "/" }: Readonly<{ diaryHref?: string }>) {
  return (
    <>
      <RecordBand text="Searching Open Library…" diaryHref={diaryHref} />
      <div className="px-4 py-6 sm:px-6">
        <div aria-hidden="true" className="shelf-grid min-h-[22rem]" />
      </div>
    </>
  );
}

/**
 * The ink record band: the state on the left, the way back to the diary on
 * the right — the same arrangement as the masthead's own record band.
 */
function RecordBand({
  text,
  diaryHref,
}: Readonly<{ text: string; diaryHref: string }>) {
  return (
    <div className="flex items-center justify-between gap-4 bg-ink px-4 py-3 text-paper sm:px-6">
      {/* "First 20 — add the author to narrow it" does not fit beside the
          link at 390, so it wraps as balanced lines with real leading rather
          than orphaning its last word at the band voice's line-height of 1. */}
      <p role="status" className="band-label leading-[1.4]! text-balance">
        {text}
      </p>
      <Link
        href={diaryHref}
        // The global focus ring is ink, which vanishes on this band.
        className="band-label shrink-0 underline decoration-paper/40 underline-offset-4 transition-colors hover:decoration-paper focus-visible:outline-paper"
      >
        Your diary
      </Link>
    </div>
  );
}

import Link from "next/link";

import { SearchResult } from "./SearchResult";
import { ShowMore } from "./ShowMore";
import {
  SEARCH_LIMIT,
  bandText,
  endLine,
  noMatch,
  runSearch,
  type BookQuery,
  type Search,
} from "@/lib/search";

/**
 * Everything under the search fields: the record band, then whichever state
 * the search landed in. Rendered inside a Suspense boundary keyed on the query,
 * so the fields stay put while the sources answer.
 */
export async function SearchResults({
  query,
  shown,
  search,
  diaryHref = "/",
  searchAction = "/search",
  searchParams,
}: Readonly<{
  query: BookQuery;
  /** How many results the URL asks for (MRG-073); the first page by default. */
  shown?: number;
  /** Defaults to both live sources; the dev harness substitutes a fixture. */
  search?: Search;
  diaryHref?: string;
  /** Where a widening search submits; only the dev harness changes it. */
  searchAction?: string;
  /** Parameters a widening search must carry through; the harness's `source`. */
  searchParams?: Record<string, string>;
}>) {
  const outcome = await runSearch(query, search, shown);

  return (
    <>
      <RecordBand text={bandText(outcome)} diaryHref={diaryHref} />

      {outcome.kind === "results" && (
        <div className="px-4 py-6 sm:px-6">
          <ol className="shelf-grid">
            {outcome.books.map((book) => (
              <SearchResult key={book.sourceKey} book={book} />
            ))}
          </ol>
          {/* One element in both states, so the control stays mounted across
              the last step and can hand keyboard focus on. */}
          {(outcome.more || outcome.end) && (
            <div className="mt-6">
              <ShowMore
                href={
                  outcome.more
                    ? `${searchAction}?${new URLSearchParams({
                        ...searchParams,
                        ...(query.title && { title: query.title }),
                        ...(query.author && { author: query.author }),
                        shown: String(outcome.more),
                      })}`
                    : undefined
                }
                count={outcome.books.length}
                step={SEARCH_LIMIT}
                note={outcome.end && endLine(outcome.end, outcome.query)}
              />
            </div>
          )}
        </div>
      )}

      {outcome.kind === "none" && (
        <NoMatch
          query={outcome.query}
          action={searchAction}
          params={searchParams}
        />
      )}

      {/* Not alarm red: nothing was refused, and nothing the reader did is
          wrong. Sunk paper sets it apart from "no matches", which it must never
          be mistaken for. */}
      {outcome.kind === "unavailable" && (
        <div className="border-b border-rule bg-paper-sunk px-4 py-6 sm:px-6">
          <p className="max-w-[38rem] text-[0.9375rem] leading-relaxed text-ink-soft">
            Neither source is answering, so search can’t run right now. Your
            diary is unaffected — try again in a few minutes.
          </p>
        </div>
      )}
    </>
  );
}

/**
 * Nothing matched. The way out is a control where one can exist, not only an
 * instruction: with both lines filled, dropping the title is the one thing
 * that can rescue a scoped search, and asking the reader to clear a field by
 * hand is the most expensive thing this surface can ask at the moment capture
 * is already going badly.
 */
function NoMatch({
  query,
  action,
  params,
}: Readonly<{
  query: BookQuery;
  action: string;
  params?: Record<string, string>;
}>) {
  const { lead, widen } = noMatch(query);
  const href = widen
    ? `${action}?${new URLSearchParams({ ...params, author: widen })}`
    : undefined;

  return (
    <p className="max-w-[38rem] px-4 py-6 text-[0.9375rem] leading-relaxed text-ink-soft sm:px-6">
      {lead}
      {href && (
        <>
          {" "}
          Check the spelling, or{" "}
          <Link href={href} className="underline underline-offset-4 hover:text-ink">
            search “{widen}” alone
          </Link>
          .
        </>
      )}
    </p>
  );
}

/**
 * While a source answers: the band says so, and the grid it will fill is drawn
 * as ruled empty positions — a sheet waiting for print, not skeleton cards
 * pretending to be books.
 *
 * It cannot name the source it is waiting on. Since MRG-067 both sources are
 * asked every time and their results are merged, so the grid it is about to
 * fill will usually hold books from both — naming either one here would be
 * wrong about whatever else lands beside it.
 */
export function SearchPending({ diaryHref = "/" }: Readonly<{ diaryHref?: string }>) {
  return (
    <>
      <RecordBand text="Searching…" diaryHref={diaryHref} />
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
          than orphaning its last word at the band voice's line-height of 1.
          <output> carries the status role natively (Sonar S6819), so the
          count is announced when a search lands. */}
      <output className="band-label leading-[1.4]! text-balance">{text}</output>
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

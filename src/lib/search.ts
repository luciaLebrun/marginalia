import { z } from "zod";

import { PAGE_SIZE, searchBooks, type BookQuery, type BookSummary } from "@/lib/books";

/**
 * Search, as the page needs it. Pure apart from the search function it is
 * handed, which defaults to `src/lib/books` — both sources, merged. Which one
 * answered is that module's business, not this one's: by the time an outcome
 * is built, a book is a book.
 *
 * Since MRG-068 a query is a **title and an author, kept apart**, because both
 * APIs take them apart and rank far better for it. Either alone is a search;
 * neither is the blank query.
 *
 * The page renders one of four outcomes, and the distinction that matters most
 * is between "none" and "unavailable": an outage must never read as "no such
 * book", or a reader goes looking for a typo that is not there.
 */

/** Works shown per search, and the step "show more" adds (MRG-073). */
export const SEARCH_LIMIT = PAGE_SIZE;

/**
 * The most a search will show. Past this the band's advice to add the other
 * line is the better way to the book than a longer grid.
 */
// ponytail: fixed at three pages because each step re-renders the whole grid
// server side; a cursor-based append if a reader ever needs past 60.
export const MAX_SHOWN = 3 * SEARCH_LIMIT;

/** A term longer than this is a pasted paragraph, not a search. */
export const MAX_QUERY_LENGTH = 200;

export type { BookQuery };

/**
 * `searchParams` hands over a string, an array (`?title=a&title=b`), or
 * nothing, and none of it is to be trusted. Anything unusable becomes the
 * blank term rather than an error: the worst a malformed URL deserves is an
 * empty search field.
 */
const termSchema = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    const first = Array.isArray(value) ? value[0] : value;
    return (first ?? "")
      .replaceAll(/\s+/g, " ")
      .trim()
      .slice(0, MAX_QUERY_LENGTH)
      .trim();
  });

/** One field of the query, from one `searchParams` value. */
export function parseTerm(raw: unknown): string {
  const parsed = termSchema.safeParse(raw);
  return parsed.success ? parsed.data : "";
}

/** The whole query, from the page's `searchParams`. */
export function parseQuery(params: {
  title?: unknown;
  author?: unknown;
}): BookQuery {
  return { title: parseTerm(params.title), author: parseTerm(params.author) };
}

/**
 * How many results the URL asks for: `?shown=40`. Only a whole number of
 * pages up to `MAX_SHOWN` counts; anything else is the first page, because a
 * hand-edited URL deserves the ordinary search, not an error.
 */
export function parseShown(raw: unknown): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(value) && value % SEARCH_LIMIT === 0 && value >= SEARCH_LIMIT
    ? Math.min(value, MAX_SHOWN)
    : SEARCH_LIMIT;
}

/** Nothing typed in either field. */
export function isBlank(query: BookQuery): boolean {
  return !query.title && !query.author;
}

export type SearchOutcome =
  | { kind: "blank" }
  | {
      kind: "results";
      query: BookQuery;
      books: BookSummary[];
      limited: boolean;
      /** The `shown` a "show more" asks for next, when a full page allows it. */
      more?: number;
      /**
       * Why "show more" stands unavailable after a step: the cap was reached,
       * or the sources ran out. Absent on a first page, which never draws the
       * control unless there is more to show.
       */
      end?: "cap" | "spent";
    }
  | { kind: "none"; query: BookQuery }
  | { kind: "unavailable"; query: BookQuery };

export type Search = (query: BookQuery, limit: number) => Promise<BookSummary[]>;

/**
 * Run a search and say which state the page is in.
 *
 * No retry: in a request path a retry only spends the reader's time, and these
 * outages last minutes, not milliseconds. Both sources are already asked in
 * parallel a layer down, so a throw reaching here means both are gone — any
 * kind of throw is "unavailable".
 */
export async function runSearch(
  query: BookQuery,
  search: Search = searchBooks,
  shown = SEARCH_LIMIT,
): Promise<SearchOutcome> {
  if (isBlank(query)) return { kind: "blank" };

  let books: BookSummary[];
  try {
    books = await search(query, shown);
  } catch (error) {
    console.error("book search failed at every source", error);
    return { kind: "unavailable", query };
  }

  if (books.length === 0) return { kind: "none", query };
  // A short page means the sources are spent, so only a full one offers more.
  const limited = books.length >= shown;
  return {
    kind: "results",
    query,
    books,
    limited,
    ...(limited && shown < MAX_SHOWN && { more: shown + SEARCH_LIMIT }),
    ...(shown > SEARCH_LIMIT && !(limited && shown < MAX_SHOWN) && {
      end: limited ? "cap" : "spent",
    }),
  };
}

/** What the record band under the fields says, in the band voice. */
export function bandText(outcome: SearchOutcome): string {
  switch (outcome.kind) {
    case "blank":
      return "No search yet";
    case "none":
      return "No matches";
    case "unavailable":
      return "Search unavailable";
    case "results": {
      const count = outcome.books.length;
      if (!outcome.limited) return `${count} ${count === 1 ? "book" : "books"}`;
      // Only the empty line can narrow the search, so only it is offered. With
      // both filled there is nothing left to suggest, and the band says what is
      // true and no more: the merge orders by SOURCE, not by closeness — Google
      // leads the grid because it is steadier under load, not because it ranks
      // better — so "closest first" would be a claim this page cannot make.
      if (!outcome.query.author) return `First ${count} — add the author to narrow it`;
      if (!outcome.query.title) return `First ${count} — add a title to narrow it`;
      return `First ${count} of more`;
    }
  }
}

/**
 * What stands beside "show more" once it cannot show more (MRG-073). A
 * control is never removed, only ruled through, and the word beside it says
 * what it is waiting for — the Printed State and Word Beside the Colour rules.
 *
 * At the cap, the band's own narrowing offer is the way on, so it is repeated
 * where the reader's eye now is. Spent, there is nothing to narrow toward.
 * The line never says "both sources": one may be down and merged as nothing,
 * and which source answered is not the reader's business on this surface.
 */
export function endLine(end: "cap" | "spent", query: BookQuery): string {
  if (end === "spent") return "That is every book the search found.";
  if (!query.author) return "Sixty is the most a search shows — add the author to narrow it.";
  if (!query.title) return "Sixty is the most a search shows — add a title to narrow it.";
  return "Sixty is the most a search shows.";
}

/** Pure. The query back in the reader's own words, for a sentence about it. */
export function queryPhrase({ title, author }: BookQuery): string {
  if (title && author) return `“${title}” by “${author}”`;
  return `“${title || author}”`;
}

/**
 * What the empty result says, split where a link can stand in it.
 *
 * Scoped search is stricter than the free-text box it replaced — a mistyped
 * title now matches nothing rather than drifting to something near it — so the
 * way out is named rather than left to be guessed. It has to be a way out that
 * can *work*: both sources AND the two terms together, so after a title-only
 * miss "add the author" narrows an already-empty search and lands the reader
 * back on this same page. Only widening can rescue an empty scoped result.
 */
export function noMatch(query: BookQuery): {
  lead: string;
  /** Set when dropping the title and keeping this author is a real way out. */
  widen?: string;
} {
  const lead = `Nothing matches ${queryPhrase(query)}.`;
  if (query.title && query.author) return { lead, widen: query.author };

  // One line filled: there is nothing to drop, so the only exits are a
  // correction and a shorter, broader version of what was typed.
  const shorten = query.title ? "try fewer words" : "try the surname alone";
  return { lead: `${lead} Check the spelling, or ${shorten}.` };
}

import { z } from "zod";

import { searchBooks, type BookSummary } from "@/lib/books";

/**
 * Search, as the page needs it. Pure apart from the search function it is
 * handed, which defaults to Open Library through `src/lib/books`.
 *
 * The page renders one of four outcomes, and the distinction that matters most
 * is between "none" and "unavailable": an Open Library outage must never read
 * as "no such book", or a reader goes looking for a typo that is not there.
 */

/** Works shown per search. Enough to find a book by title; more is scrolling. */
export const SEARCH_LIMIT = 20;

/** A query longer than this is a pasted paragraph, not a search. */
export const MAX_QUERY_LENGTH = 200;

/**
 * `searchParams` hands over a string, an array (`?q=a&q=b`), or nothing, and
 * none of it is to be trusted. Anything unusable becomes the blank query rather
 * than an error: the worst a malformed URL deserves is an empty search field.
 */
const querySchema = z
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

export function parseQuery(raw: unknown): string {
  const parsed = querySchema.safeParse(raw);
  return parsed.success ? parsed.data : "";
}

export type SearchOutcome =
  | { kind: "blank" }
  | { kind: "results"; query: string; books: BookSummary[]; limited: boolean }
  | { kind: "none"; query: string }
  | { kind: "unavailable"; query: string };

export type Search = (query: string, limit: number) => Promise<BookSummary[]>;

/**
 * Run a search and say which state the page is in.
 *
 * No retry: in a request path a retry only spends the reader's time, and Open
 * Library's outages last minutes, not milliseconds. A throw of any kind — an
 * `OpenLibraryError` or a transport failure from fetch — is "unavailable".
 */
export async function runSearch(
  query: string,
  search: Search = searchBooks,
): Promise<SearchOutcome> {
  if (!query) return { kind: "blank" };

  let books: BookSummary[];
  try {
    books = await search(query, SEARCH_LIMIT);
  } catch (error) {
    console.error("Open Library search failed", error);
    return { kind: "unavailable", query };
  }

  if (books.length === 0) return { kind: "none", query };
  return {
    kind: "results",
    query,
    books,
    limited: books.length >= SEARCH_LIMIT,
  };
}

/** What the record band under the field says, in the band voice. */
export function bandText(outcome: SearchOutcome): string {
  switch (outcome.kind) {
    case "blank":
      return "A title, an author, or both";
    case "none":
      return "No matches";
    case "unavailable":
      return "Search unavailable";
    case "results": {
      const count = outcome.books.length;
      if (outcome.limited) return `First ${count} — add the author to narrow it`;
      return `${count} ${count === 1 ? "book" : "books"}`;
    }
  }
}

/** Where a result leads. The book page renders from our database (MRG-015). */
export function bookPath(olWorkKey: string): string {
  return `/book/${olWorkKey}`;
}

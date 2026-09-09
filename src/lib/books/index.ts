/**
 * The only sanctioned entry point for book data.
 *
 * Invariant: no React component, route handler or server action may call
 * openlibrary.org or googleapis.com directly. Everything goes through here so
 * the caching, User-Agent, normalization and the CoverID rule stay in one place.
 */
export { coverUrl, type CoverSize } from "./covers.ts";
export { searchBooks, fetchWork, OpenLibraryError } from "./openlibrary.ts";
export { enrich } from "./google-books.ts";
export type { BookSummary, BookDetail } from "./types.ts";

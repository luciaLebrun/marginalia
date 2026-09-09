/**
 * The only sanctioned entry point for book data.
 *
 * Invariant: no React component, route handler or server action may call
 * openlibrary.org or googleapis.com directly. Everything goes through here so
 * the caching, User-Agent, normalization and the CoverID rule stay in one place.
 */
export { coverUrl, type CoverSize } from "./covers";
export { searchBooks, fetchWork } from "./openlibrary";
export { enrich } from "./google-books";
export type { BookSummary, BookDetail } from "./types";

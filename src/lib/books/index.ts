/**
 * The only sanctioned entry point for book data.
 *
 * Invariant: no React component, route handler or server action may call
 * openlibrary.org or googleapis.com directly. Everything goes through here so
 * the caching, User-Agent, normalization and the CoverID rule stay in one place.
 *
 * Two sources since MRG-063, in a fixed order: **Google Books first, Open
 * Library as the fallback.** Google is asked first for latency stability under
 * load, not for relevance — see the measurements in `google-books.ts`. Open
 * Library answers when Google is unconfigured, erroring, or has nothing, and
 * it stays the source of every book opened before the swap.
 */
import {
  GOOGLE_KEY_PREFIX,
  apiKey,
  fetchVolume,
  parseVolumeId,
  searchVolumes,
} from "./google-books.ts";
import { fetchWork, searchWorks, stripWorkPrefix } from "./openlibrary.ts";
import type { BookDetail, BookSummary } from "./types.ts";

export { coverUrl, jacket, sampleUrl, type CoverSize, type Jacket } from "./covers.ts";
export { fetchWork, searchWorks, stripWorkPrefix, OpenLibraryError } from "./openlibrary.ts";
export {
  GOOGLE_KEY_PREFIX,
  GoogleBooksError,
  enrich,
  fetchVolume,
  parseVolumeId,
  searchVolumes,
} from "./google-books.ts";
export type { BookSummary, BookDetail } from "./types.ts";

/**
 * A book key as it arrives from a URL segment: untrusted. Returns the
 * canonical key — "gb:B1hSG45JCX4C" or "OL45804W" — or null.
 *
 * This is a guard, not a nicety: both branches interpolate the key into an
 * upstream path, so without it "/book/..%2Fsearch" would ask for a different
 * resource entirely.
 */
export function parseBookKey(raw: string): string | null {
  const trimmed = raw.trim();

  const volumeId = parseVolumeId(trimmed);
  if (volumeId) return `${GOOGLE_KEY_PREFIX}${volumeId}`;
  if (trimmed.startsWith(GOOGLE_KEY_PREFIX)) return null;

  const work = stripWorkPrefix(trimmed);
  return /^OL\d+W$/.test(work) ? work : null;
}

/**
 * Search, Google first.
 *
 * Open Library runs when Google is unconfigured, throws, or finds nothing.
 *
 * Note what that does NOT cover: Google returning twenty confident results,
 * none of them the book. The fallback fires on *absence*, not on *wrongness*,
 * and nothing here can tell the difference — so a query Google ranks badly
 * never reaches Open Library at all. That is the known cost of the order
 * (MRG-067), not an oversight in this function.
 *
 * A Google failure is swallowed and logged, but an Open Library failure is
 * allowed to throw: by then there is nothing left to fall back to, and
 * `runSearch` needs the throw to say "unavailable" rather than "no matches".
 */
export async function searchBooks(
  query: string,
  limit = 20,
): Promise<BookSummary[]> {
  const q = query.trim();
  if (!q) return [];

  if (apiKey()) {
    try {
      const hits = await searchVolumes(q, limit);
      if (hits.length > 0) return hits;
    } catch (error) {
      console.error("Google Books search failed, falling back to Open Library", error);
    }
  }

  return searchWorks(q, limit);
}

/**
 * Fetch one book by its canonical key, from whichever source owns it.
 *
 * No cross-source fallback here on purpose: a key names one record at one
 * source, and asking the other for it would answer with a different book.
 */
export async function fetchBook(key: string): Promise<BookDetail | null> {
  const volumeId = parseVolumeId(key);
  return volumeId ? fetchVolume(volumeId) : fetchWork(key);
}

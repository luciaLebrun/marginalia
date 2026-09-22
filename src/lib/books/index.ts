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
import type { BookDetail, BookQuery, BookSummary } from "./types.ts";

export { coverUrl, jacket, sampleUrl, type CoverSize, type Jacket } from "./covers.ts";
export { fetchWork, searchWorks, stripWorkPrefix, OpenLibraryError } from "./openlibrary.ts";
export {
  GOOGLE_KEY_PREFIX,
  GoogleBooksError,
  buildSearchQuery,
  enrich,
  fetchVolume,
  parseVolumeId,
  searchVolumes,
} from "./google-books.ts";
export type { BookQuery, BookSummary, BookDetail } from "./types.ts";

/**
 * A URL segment as text.
 *
 * Next hands a **page** its dynamic segment percent-encoded and a **route
 * handler** the same segment decoded. A Google key carries a colon, so
 * `/book/gb:B1hSG45JCX4C` reached the page as `gb%3AB1hSG45JCX4C` and failed
 * the guard below: every Google book opened as "not found", while Open
 * Library's bare keys, which encode to themselves, went through. That is also
 * why it survived a route-handler probe.
 *
 * Decoding before validating is safe here because what follows is an
 * allowlist, not a denylist: `%2F` becomes a slash and is then refused like
 * any other slash. A malformed escape is left as it stands, to be refused the
 * same way, rather than throwing out of a guard.
 */
function decodeSegment(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * A book key as it arrives from a URL segment: untrusted. Returns the
 * canonical key — "gb:B1hSG45JCX4C" or "OL45804W" — or null.
 *
 * This is a guard, not a nicety: both branches interpolate the key into an
 * upstream path, so without it "/book/..%2Fsearch" would ask for a different
 * resource entirely.
 */
export function parseBookKey(raw: string): string | null {
  const trimmed = decodeSegment(raw).trim();

  const volumeId = parseVolumeId(trimmed);
  if (volumeId) return `${GOOGLE_KEY_PREFIX}${volumeId}`;
  if (trimmed.startsWith(GOOGLE_KEY_PREFIX)) return null;

  const work = stripWorkPrefix(trimmed);
  return /^OL\d+W$/.test(work) ? work : null;
}

/**
 * How many of the result slots Google may claim (MRG-067).
 *
 * Without a cap this merge would do nothing: Google reliably returns a full
 * page, so appending Open Library after it would append into no space at all.
 * Reserving slots is the whole mechanism — Google keeps the top of the grid,
 * and Open Library is guaranteed room to put the actual book on the page.
 */
const GOOGLE_SLOTS = 12;

/** The page `GOOGLE_SLOTS` is a share of, and the step "show more" adds. */
export const PAGE_SIZE = 20;

/** Strip case, accents and punctuation, so "Piranèse" and "piranese" meet. */
function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[̀-ͯ]/g, "")
    .replaceAll(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Pure. The identities a book answers to, for de-duplication.
 *
 * ISBN-13 alone is not enough and using it alone was the flaw in the original
 * sketch: Google returns *editions* and Open Library *works*, so the two hand
 * back different ISBNs for the same book and an ISBN match almost never fires.
 * Folded title + first author is what actually catches a duplicate; the ISBN
 * stays as the exact key for the cases where it does line up.
 */
export function identityKeys(book: BookSummary): string[] {
  const keys: string[] = [];
  if (book.isbn13) keys.push(`i:${book.isbn13}`);
  const title = fold(book.title);
  if (title) keys.push(`t:${title}|${fold(book.authors[0] ?? "")}`);
  return keys;
}

/**
 * Pure. Merge two sources' results a page at a time, Google's block first on
 * every page.
 *
 * On each page of `PAGE_SIZE`, Google holds the top, capped at `GOOGLE_SLOTS`;
 * Open Library fills the rest and then, if it has not used its share, Google
 * is allowed back in to finish the page. So a query only one source answers
 * still fills the grid, and a query both answer shows both.
 *
 * Page by page rather than one block, because "show more" (MRG-073) must only
 * ever add rows under the ones the reader was looking at. Merged as one block,
 * a 40-book ask would hand Google 24 slots at the top and reshuffle the first
 * page out from under them.
 */
export function mergeResults(
  google: BookSummary[],
  openLibrary: BookSummary[],
  limit: number,
): BookSummary[] {
  const seen = new Set<string>();
  const out: BookSummary[] = [];

  // Each pass starts from the top of a source again; `seen` skips what an
  // earlier page already took, so no cursor is needed.
  const take = (books: BookSummary[], room: number) => {
    for (const book of books) {
      if (room <= 0) return;
      const keys = identityKeys(book);
      if (keys.some((k) => seen.has(k))) continue;
      for (const k of keys) seen.add(k);
      out.push(book);
      room--;
    }
  };

  for (let end = PAGE_SIZE; out.length < limit; end += PAGE_SIZE) {
    const pageEnd = Math.min(end, limit);
    const before = out.length;
    take(google, Math.min(GOOGLE_SLOTS, pageEnd - out.length));
    take(openLibrary, pageEnd - out.length);
    take(google, pageEnd - out.length); // Google finishes the page if room is left.
    if (out.length === before) break; // Both sources are spent.
  }
  return out;
}

/**
 * Search both sources and merge, Google's hits first (MRG-067), with the
 * title and the author scoped separately at each source (MRG-068).
 *
 * The plain fallback this replaced fired on *absence* and never on
 * *wrongness*, so a query Google ranked badly — `dune herbert` returns no
 * edition of Dune in twenty results — never reached Open Library at all.
 * Asking both every time is the only thing that fixes it, because nothing in
 * this process can tell a confident wrong answer from a right one.
 *
 * The two run in parallel, so the cost is the slower of them rather than the
 * sum. Either source failing leaves the other's results standing; only both
 * failing throws, which is what `runSearch` needs to say "unavailable" rather
 * than "no matches".
 */
export async function searchBooks(
  query: BookQuery,
  limit = 20,
): Promise<BookSummary[]> {
  const scoped: BookQuery = {
    title: query.title.trim(),
    author: query.author.trim(),
  };
  if (!scoped.title && !scoped.author) return [];

  const [google, openLibrary] = await Promise.allSettled([
    apiKey() ? searchVolumes(scoped, limit) : Promise.resolve<BookSummary[]>([]),
    searchWorks(scoped, limit),
  ]);

  if (google.status === "rejected") {
    console.error("Google Books search failed", google.reason);
  }
  if (openLibrary.status === "rejected") {
    console.error("Open Library search failed", openLibrary.reason);
  }
  if (google.status === "rejected" && openLibrary.status === "rejected") {
    throw openLibrary.reason;
  }

  return mergeResults(
    google.status === "fulfilled" ? google.value : [],
    openLibrary.status === "fulfilled" ? openLibrary.value : [],
    limit,
  );
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

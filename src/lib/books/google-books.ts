import type { BookDetail } from "./types";

const ORIGIN = "https://www.googleapis.com/books/v1";
const ONE_WEEK = 60 * 60 * 24 * 7;

/**
 * Pure. Merge a Google Books volume onto a BookDetail, filling only the gaps.
 *
 * Open Library stays authoritative for identity (key, title, authors) — this
 * only supplies the fields Open Library is commonly thin on: description and
 * page count. We never overwrite a value we already have.
 */
export function mergeGoogleVolume(
  detail: BookDetail,
  body: unknown,
): BookDetail {
  const items = (body as { items?: unknown })?.items;
  const volume = Array.isArray(items) ? items[0] : undefined;
  const info = (volume as { volumeInfo?: unknown })?.volumeInfo as
    | { description?: unknown; pageCount?: unknown }
    | undefined;

  if (!info) return detail;

  const description =
    detail.description ??
    (typeof info.description === "string" ? info.description : undefined);
  const pageCount =
    detail.pageCount ??
    (typeof info.pageCount === "number" && info.pageCount > 0
      ? info.pageCount
      : undefined);

  const enriched = description !== detail.description || pageCount !== detail.pageCount;

  return {
    ...detail,
    description,
    pageCount,
    source: enriched ? "openlibrary+google" : detail.source,
  };
}

/**
 * Best-effort enrichment. Google Books is a nice-to-have on a free quota of
 * ~1000 requests/day, so every failure path returns the input unchanged —
 * enrichment must never be able to fail a book page.
 */
export async function enrich(detail: BookDetail): Promise<BookDetail> {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  if (!key) return detail;

  // Only worth a request when we are actually missing something.
  if (detail.description && detail.pageCount) return detail;

  const q = detail.isbn13
    ? `isbn:${detail.isbn13}`
    : `intitle:${detail.title}${detail.authors[0] ? `+inauthor:${detail.authors[0]}` : ""}`;

  try {
    const res = await fetch(
      `${ORIGIN}/volumes?q=${encodeURIComponent(q)}&maxResults=1&key=${key}`,
      { next: { revalidate: ONE_WEEK } },
    );
    if (!res.ok) return detail;
    return mergeGoogleVolume(detail, await res.json());
  } catch {
    return detail;
  }
}

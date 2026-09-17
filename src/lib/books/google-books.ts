import type { BookDetail, BookSummary } from "./types.ts";

const ORIGIN = "https://www.googleapis.com/books/v1";
const ONE_WEEK = 60 * 60 * 24 * 7;
const ONE_DAY = 60 * 60 * 24;

/**
 * Google Books, the primary source (MRG-063).
 *
 * Google is asked first because its relevance on the query a reader actually
 * types — a title, half a title, a title and an author — is markedly better
 * than Open Library's. Open Library is the fallback, and stays the source of
 * every book opened before this change.
 *
 * The cost of the swap, recorded here because it is easy to forget: a Google
 * key identifies an *edition* (a volume), where an Open Library work key
 * identifies a *work*. Two readers can therefore log two volumes of the same
 * book and get two rows. There is no cheap fix — the ISBN-13 we store is the
 * only bridge — and the relevance was judged worth it.
 */

/**
 * Google keys are stored and addressed tagged: "gb:B1hSG45JCX4C". Open Library
 * keys stay bare ("OL45804W"), so every link made before the swap still opens.
 */
export const GOOGLE_KEY_PREFIX = "gb:";

/**
 * A volume id as it arrives from a URL segment: untrusted. Returns the bare id
 * or null for anything that is not one.
 *
 * This is a guard, not a nicety — the id is interpolated into a Google Books
 * path, so without it "gb:../../oauth" would ask Google for another resource.
 * Ids are base64url-ish and have been 12 characters for as long as anyone has
 * looked, but the length is Google's to change, so only the charset is fixed.
 */
export function parseVolumeId(key: string): string | null {
  if (!key.startsWith(GOOGLE_KEY_PREFIX)) return null;
  const id = key.slice(GOOGLE_KEY_PREFIX.length);
  return /^[A-Za-z0-9_-]{6,40}$/.test(id) ? id : null;
}

/** Thrown when Google answers with an error status, so a caller can fall back. */
export class GoogleBooksError extends Error {
  status: number;

  constructor(status: number, url: string) {
    super(`Google Books ${status} for ${redactKey(url)}`);
    this.name = "GoogleBooksError";
    this.status = status;
  }
}

/**
 * Pure. Strip anything that looks like a credential out of a URL before it
 * reaches a log line.
 *
 * The key travels in a header now, so nothing should reach this carrying one —
 * this is the second lock, not the first. An API key is one of the few things
 * that must not be one refactor away from being logged.
 */
export function redactKey(url: string): string {
  return url.replaceAll(/([?&]key=)[^&]*/gi, "$1<redacted>");
}

/**
 * Google is used at all only with a key. Unauthenticated queries are rate
 * limited per IP and Vercel shares egress IPs between every project on it, so
 * keyless in production means everyone's search breaks at once. No key is a
 * supported state: search simply stays on Open Library.
 */
export function apiKey(): string | undefined {
  return process.env.GOOGLE_BOOKS_API_KEY || undefined;
}

/** Only the fields we keep. The default volume payload is ten times this. */
const VOLUME_FIELDS =
  "id,volumeInfo(title,subtitle,authors,publishedDate,industryIdentifiers,pageCount,description,imageLinks)";

interface RawImageLinks {
  extraLarge?: unknown;
  large?: unknown;
  medium?: unknown;
  small?: unknown;
  thumbnail?: unknown;
  smallThumbnail?: unknown;
}

interface RawVolumeInfo {
  title?: unknown;
  subtitle?: unknown;
  authors?: unknown;
  publishedDate?: unknown;
  industryIdentifiers?: unknown;
  pageCount?: unknown;
  description?: unknown;
  imageLinks?: RawImageLinks;
}

/**
 * The width a stored Google jacket is canonicalised to: the shipping asset,
 * the same role Open Library's "-L.jpg" (~500px) plays. The frontispiece well
 * is 384 CSS px, so 768 device px at DSF 2, and 800 covers it without upscale.
 */
export const JACKET_WIDTH = 800;

/**
 * Pure. Rewrite a Google jacket URL to a given pixel width.
 *
 * The content endpoint takes `w` and honours it against the full scan — `w=800`
 * really is 800x1232, `w=1280` really is 1280x1972 — so this is the only lever
 * worth pulling. It is also why `zoom` is deleted rather than tuned: measured
 * against a live volume, zoom=1 and zoom=5 both return 128x192 and zoom=2
 * returns 300x462. `zoom` is a fixed ladder of small renditions, and the
 * highest number is not the largest image.
 *
 * Returns the URL untouched if it is not one of Google's, so a caller cannot
 * accidentally rewrite an Open Library address.
 */
export function withJacketWidth(raw: string, width: number): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }
  if (!/(^|\.)google\.com$/.test(url.hostname)) return raw;

  url.searchParams.delete("zoom");
  url.searchParams.set("w", String(width));
  return url.toString();
}

/**
 * Pure. The jacket URL for a volume, or undefined when Google has no scan.
 *
 * Google hands these out over plain http and with a page-curl graphic burnt
 * into the right edge, neither of which we want: the first is mixed content on
 * an https page, the second is a picture of a book rather than a jacket.
 *
 * Every `imageLinks` entry addresses the same scan and differs only in the
 * rendition asked for, so which key we pick does not matter — the width we ask
 * for does. `smallThumbnail` in particular is 128px wide however "large" its
 * `zoom` number looks. So the URL is taken for its volume id and rewritten to
 * the width we actually want.
 */
export function jacketFromImageLinks(
  links: RawImageLinks | undefined,
): string | undefined {
  const raw =
    links?.extraLarge ??
    links?.large ??
    links?.medium ??
    links?.small ??
    links?.thumbnail ??
    links?.smallThumbnail;
  if (typeof raw !== "string" || !raw) return undefined;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return undefined;
  }
  // Google is the only host we will point an <img> at from this field.
  if (!/(^|\.)google\.com$/.test(url.hostname)) return undefined;

  url.protocol = "https:";
  url.searchParams.delete("edge");
  return withJacketWidth(url.toString(), JACKET_WIDTH);
}

/** Pick the ISBN-13 out of Google's mixed identifier list. */
export function pickIsbn13(identifiers: unknown): string | undefined {
  if (!Array.isArray(identifiers)) return undefined;
  for (const entry of identifiers as { type?: unknown; identifier?: unknown }[]) {
    if (
      entry?.type === "ISBN_13" &&
      typeof entry.identifier === "string" &&
      /^\d{13}$/.test(entry.identifier)
    ) {
      return entry.identifier;
    }
  }
  return undefined;
}

/** `publishedDate` is "1965", "1965-06" or "1965-06-01". We want the year. */
export function publishYear(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const year = Number.parseInt(value.slice(0, 4), 10);
  return Number.isInteger(year) && year > 0 ? year : undefined;
}

/**
 * Pure. One volume as our BookDetail, or null when it is too thin to render.
 *
 * A volume with no id or no title cannot be linked to or listed, so it is
 * dropped rather than half-shown — the same rule the Open Library normalizer
 * keeps.
 */
export function normalizeVolume(item: unknown): BookDetail | null {
  const volume = (item ?? {}) as { id?: unknown; volumeInfo?: RawVolumeInfo };
  const info = volume.volumeInfo;
  if (typeof volume.id !== "string" || !volume.id) return null;
  if (typeof info?.title !== "string" || !info.title) return null;

  const description =
    typeof info.description === "string" ? info.description.trim() : "";

  return {
    sourceKey: `${GOOGLE_KEY_PREFIX}${volume.id}`,
    title: info.title,
    subtitle: typeof info.subtitle === "string" ? info.subtitle : undefined,
    authors: Array.isArray(info.authors)
      ? info.authors.filter((a): a is string => typeof a === "string")
      : [],
    firstPublishYear: publishYear(info.publishedDate),
    coverUrl: jacketFromImageLinks(info.imageLinks),
    isbn13: pickIsbn13(info.industryIdentifiers),
    pageCount:
      typeof info.pageCount === "number" && info.pageCount > 0
        ? info.pageCount
        : undefined,
    description: description || undefined,
    source: "google",
  };
}

/** Pure. A /volumes search body as summaries, dropping what cannot be shown. */
export function normalizeSearchResponse(body: unknown): BookSummary[] {
  const items = (body as { items?: unknown })?.items;
  if (!Array.isArray(items)) return [];

  const out: BookSummary[] = [];
  for (const item of items) {
    const detail = normalizeVolume(item);
    if (detail) out.push(detail);
  }
  return out;
}

/**
 * The key travels in a header, never in the query string.
 *
 * A URL ends up in error messages, in server logs, and in Next's cache key. A
 * `?key=` in one is a credential in all three — `searchBooks()` logs its error
 * on the fallback path, which would have put the key in Vercel's runtime logs
 * on every Google outage. Google accepts `X-Goog-Api-Key` for exactly this.
 */
async function fetchJson(url: string, revalidate: number): Promise<unknown> {
  const key = apiKey();
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(key ? { "X-Goog-Api-Key": key } : {}),
    },
    next: { revalidate },
  });
  if (!res.ok) throw new GoogleBooksError(res.status, url);
  return res.json();
}

/**
 * Search volumes. `printType=books` keeps magazine scans out of a reading
 * diary, and Google's own cap on `maxResults` is 40.
 *
 * **Throws** on any error status so the caller can fall back to Open Library
 * rather than show an outage as "no such book".
 */
export async function searchVolumes(
  query: string,
  limit = 20,
): Promise<BookSummary[]> {
  const q = query.trim();
  if (!q) return [];

  const url =
    `${ORIGIN}/volumes?q=${encodeURIComponent(q)}` +
    `&maxResults=${Math.min(limit, 40)}&printType=books&orderBy=relevance` +
    `&fields=${encodeURIComponent(`items(${VOLUME_FIELDS})`)}`;

  return normalizeSearchResponse(await fetchJson(url, ONE_DAY));
}

/**
 * Fetch one volume by its bare id.
 *
 * Returns null when the volume does not exist (404, and Google answers 503 for
 * some withdrawn ids too, which we cannot tell from an outage — a 404 is the
 * only "gone" we trust). **Throws** otherwise, so the book page can say
 * "unavailable" rather than "not found".
 */
export async function fetchVolume(id: string): Promise<BookDetail | null> {
  const url = `${ORIGIN}/volumes/${id}?fields=${encodeURIComponent(VOLUME_FIELDS)}`;

  let body: unknown;
  try {
    body = await fetchJson(url, ONE_DAY);
  } catch (error) {
    if (error instanceof GoogleBooksError && error.status === 404) return null;
    throw error;
  }
  return normalizeVolume(body);
}

/**
 * Pure. Merge a Google Books volume onto a BookDetail, filling only the gaps.
 *
 * Used the other way round from the rest of this file: when Open Library was
 * the source, it stays authoritative for identity (key, title, authors) and
 * this only supplies the fields it is commonly thin on. We never overwrite a
 * value we already have.
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
 * An ISBN is an exact match, so prefer it. Otherwise fall back to title,
 * narrowed by the first author when we have one.
 */
export function buildQuery(detail: BookDetail): string {
  if (detail.isbn13) return `isbn:${detail.isbn13}`;

  const author = detail.authors[0];
  const byAuthor = author ? `+inauthor:${author}` : "";
  return `intitle:${detail.title}${byAuthor}`;
}

/**
 * Best-effort enrichment of an **Open Library** book. Google Books is a
 * nice-to-have on a free quota of ~1000 requests/day, so every failure path
 * returns the input unchanged — enrichment must never fail a book page.
 */
export async function enrich(detail: BookDetail): Promise<BookDetail> {
  const key = apiKey();
  if (!key) return detail;

  // A book Google already gave us: re-asking Google fills nothing.
  if (detail.source === "google") return detail;

  // Only worth a request when we are actually missing something.
  if (detail.description && detail.pageCount) return detail;

  const q = buildQuery(detail);

  try {
    const res = await fetch(
      `${ORIGIN}/volumes?q=${encodeURIComponent(q)}&maxResults=1`,
      { headers: { "X-Goog-Api-Key": key }, next: { revalidate: ONE_WEEK } },
    );
    if (!res.ok) return detail;
    return mergeGoogleVolume(detail, await res.json());
  } catch {
    return detail;
  }
}

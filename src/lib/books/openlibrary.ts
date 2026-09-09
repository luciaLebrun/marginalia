import type { BookDetail, BookSummary } from "./types";

const ORIGIN = "https://openlibrary.org";

/**
 * Open Library asks API consumers to identify themselves so they can contact
 * you before blocking you. Keep this accurate.
 */
const USER_AGENT =
  "Marginalia/0.1 (reading diary POC; https://github.com/luciaLebrun/marginalia)";

/**
 * The default /search.json response is enormous — dozens of fields per doc.
 * Always send an explicit field list.
 */
const SEARCH_FIELDS = [
  "key",
  "title",
  "subtitle",
  "author_name",
  "first_publish_year",
  "cover_i",
  "edition_count",
  "isbn",
].join(",");

/** Open Library returns keys as "/works/OL45804W"; we store "OL45804W". */
export function stripWorkPrefix(key: string): string {
  return key.replace(/^\/works\//, "");
}

/** Pick the first ISBN-13 from Open Library's mixed ISBN-10/13 array. */
export function pickIsbn13(isbns: unknown): string | undefined {
  if (!Array.isArray(isbns)) return undefined;
  return isbns.find(
    (i): i is string => typeof i === "string" && /^\d{13}$/.test(i),
  );
}

interface RawSearchDoc {
  key?: unknown;
  title?: unknown;
  subtitle?: unknown;
  author_name?: unknown;
  first_publish_year?: unknown;
  cover_i?: unknown;
  edition_count?: unknown;
  isbn?: unknown;
}

/**
 * Pure. Given a raw /search.json body, produce our BookSummary shape.
 * Docs without a usable key or title are dropped rather than half-rendered.
 */
export function normalizeSearchResponse(body: unknown): BookSummary[] {
  const docs = (body as { docs?: unknown })?.docs;
  if (!Array.isArray(docs)) return [];

  const out: BookSummary[] = [];
  for (const raw of docs as RawSearchDoc[]) {
    if (typeof raw?.key !== "string" || typeof raw?.title !== "string") {
      continue;
    }
    out.push({
      olWorkKey: stripWorkPrefix(raw.key),
      title: raw.title,
      subtitle: typeof raw.subtitle === "string" ? raw.subtitle : undefined,
      authors: Array.isArray(raw.author_name)
        ? raw.author_name.filter((a): a is string => typeof a === "string")
        : [],
      firstPublishYear:
        typeof raw.first_publish_year === "number"
          ? raw.first_publish_year
          : undefined,
      coverId: typeof raw.cover_i === "number" ? raw.cover_i : undefined,
      editionCount:
        typeof raw.edition_count === "number" ? raw.edition_count : undefined,
      isbn13: pickIsbn13(raw.isbn),
    });
  }
  return out;
}

/**
 * Open Library descriptions are either a bare string or { type, value }.
 */
export function normalizeDescription(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (
    value &&
    typeof value === "object" &&
    typeof (value as { value?: unknown }).value === "string"
  ) {
    return (value as { value: string }).value.trim() || undefined;
  }
  return undefined;
}

/** Pure. Merge a /works/{key}.json body onto a summary we already have. */
export function normalizeWorkResponse(
  summary: BookSummary,
  body: unknown,
): BookDetail {
  const work = (body ?? {}) as { description?: unknown; covers?: unknown };
  const covers = Array.isArray(work.covers) ? work.covers : [];
  const firstCover = covers.find((c): c is number => typeof c === "number" && c > 0);

  return {
    ...summary,
    coverId: summary.coverId ?? firstCover,
    description: normalizeDescription(work.description),
    source: "openlibrary",
  };
}

async function fetchJson(url: string, revalidate: number): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    // Open Library asks callers to cache. 24h is well inside "be polite" and
    // book metadata does not meaningfully change day to day.
    next: { revalidate },
  });
  if (!res.ok) {
    throw new Error(`Open Library ${res.status} for ${url}`);
  }
  return res.json();
}

const ONE_DAY = 60 * 60 * 24;

/** Search works. Returns [] for a blank query rather than hitting the API. */
export async function searchBooks(
  query: string,
  limit = 20,
): Promise<BookSummary[]> {
  const q = query.trim();
  if (!q) return [];

  const url = `${ORIGIN}/search.json?q=${encodeURIComponent(q)}&limit=${limit}&fields=${SEARCH_FIELDS}`;
  return normalizeSearchResponse(await fetchJson(url, ONE_DAY));
}

/** Fetch one work by its bare key ("OL45804W"). */
export async function fetchWork(olWorkKey: string): Promise<BookDetail | null> {
  const key = stripWorkPrefix(olWorkKey);

  // A work page has no author names or publish year, so we get the summary
  // from search (which does) and the description from the work endpoint.
  const [summaries, work] = await Promise.all([
    searchBooks(`key:/works/${key}`, 1).catch(() => [] as BookSummary[]),
    fetchJson(`${ORIGIN}/works/${key}.json`, ONE_DAY).catch(() => null),
  ]);

  if (!work) return null;

  const title = (work as { title?: unknown }).title;
  const summary: BookSummary = summaries[0] ?? {
    olWorkKey: key,
    title: typeof title === "string" ? title : key,
    authors: [],
  };

  return normalizeWorkResponse(summary, work);
}

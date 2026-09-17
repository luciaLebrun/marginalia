export type CoverSize = "S" | "M" | "L";

const COVERS_ORIGIN = "https://covers.openlibrary.org";

/**
 * Build an Open Library cover URL from a numeric CoverID.
 *
 * Covers addressed by CoverID or OLID are unrestricted. Covers addressed by
 * ISBN / LCCN / OCLC are rate limited to 100 requests per IP per 5 minutes and
 * return 403 past that — which on a cover grid means the page visibly breaks
 * for everyone behind the same egress IP.
 *
 * This function therefore accepts a CoverID and nothing else. There is no
 * ISBN-based variant on purpose: if you find yourself wanting one, persist the
 * `cover_i` from the search response instead.
 *
 * Returns null when there is no cover, so callers must handle the placeholder
 * case explicitly rather than rendering a broken image.
 */
export function coverUrl(
  coverId: number | null | undefined,
  size: CoverSize = "M",
): string | null {
  if (coverId == null || !Number.isInteger(coverId) || coverId <= 0) {
    return null;
  }
  return `${COVERS_ORIGIN}/b/id/${coverId}-${size}.jpg`;
}

/** Everything the jacket helpers need off a book, stored row or search hit. */
export interface Jacket {
  coverId?: number | null;
  coverUrl?: string | null;
}

/**
 * The jacket a book renders, and a srcset when its source offers sizes.
 *
 * Open Library addresses covers by CoverID and serves several widths, so it
 * gets a real srcset. Google hands out one URL per volume and no size ladder,
 * so a Google jacket is a single src — the browser has nothing to choose from.
 *
 * Returns null when there is no cover at all, so callers keep handling the
 * placeholder case explicitly rather than rendering a broken image.
 */
export function jacket(book: Jacket): { src: string; srcSet?: string } | null {
  if (book.coverUrl) return { src: book.coverUrl };

  // "M" is 180px wide. A cell is ~231 CSS px on desktop, which is 462 device
  // px at DSF 2 — every jacket was being upscaled 2.6x and going visibly soft.
  // "L" is the shipping asset; "M" stays in the srcset so small viewports
  // still pay a small bill. Both are CoverID URLs; see ADR 0004.
  const src = coverUrl(book.coverId, "L");
  const small = coverUrl(book.coverId, "M");
  if (!src) return null;
  return { src, srcSet: small ? `${small} 180w, ${src} 500w` : undefined };
}

/**
 * The smallest jacket we can get, which is what the band colour is sampled
 * from — a 180px scan decodes in a fraction of the time a 500px one does and
 * gives the same dominant hue.
 */
export function sampleUrl(book: Jacket): string | null {
  return book.coverUrl ?? coverUrl(book.coverId, "M");
}

import { JACKET_WIDTH, withJacketWidth } from "./google-books.ts";

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
 * Widths a Google jacket is offered at.
 *
 * 800 is the shipping asset: the frontispiece well is 384 CSS px, so 768
 * device px at DSF 2. 512 covers a shelf cell on the same display (~231 CSS
 * px, 462 device px). 256 is there for a 1x phone, where a cell is ~187 CSS
 * px — the same job Open Library's "-M.jpg" does in its own srcset.
 */
const GOOGLE_WIDTHS = [256, 512, 800];

/**
 * The jacket a book renders, and the srcset its source can offer.
 *
 * Both sources serve a size ladder, reached differently: Open Library by
 * CoverID and a size letter, Google by a `w` on the same URL. Neither is
 * allowed to ship one fixed rendition — a 256px scan upscaled into the 768
 * device px frontispiece is exactly the softness the "-L.jpg" step was added
 * to fix on a *smaller* element.
 *
 * Returns null when there is no cover at all, so callers keep handling the
 * placeholder case explicitly rather than rendering a broken image.
 */
export function jacket(book: Jacket): { src: string; srcSet: string } | null {
  if (book.coverUrl) {
    const url = book.coverUrl;
    return {
      src: withJacketWidth(url, JACKET_WIDTH),
      srcSet: GOOGLE_WIDTHS.map((w) => `${withJacketWidth(url, w)} ${w}w`).join(", "),
    };
  }

  // "M" is 180px wide. A cell is ~231 CSS px on desktop, which is 462 device
  // px at DSF 2 — every jacket was being upscaled 2.6x and going visibly soft.
  // "L" is the shipping asset; "M" stays in the srcset so small viewports
  // still pay a small bill. Both are CoverID URLs; see ADR 0004.
  const src = coverUrl(book.coverId, "L");
  const small = coverUrl(book.coverId, "M");
  if (!src || !small) return null;
  return { src, srcSet: `${small} 180w, ${src} 500w` };
}

/**
 * The smallest jacket we can get, which is what the band colour is sampled
 * from — a small scan decodes in a fraction of the time a shipping-size one
 * does and gives the same dominant hue.
 */
export function sampleUrl(book: Jacket): string | null {
  if (book.coverUrl) return withJacketWidth(book.coverUrl, GOOGLE_WIDTHS[0]);
  return coverUrl(book.coverId, "M");
}

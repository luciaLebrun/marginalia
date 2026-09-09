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

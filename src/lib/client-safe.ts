/**
 * Values a client component needs from modules it must not import.
 *
 * `read-schema`, `account` and `search` build Zod schemas at module scope, and
 * `account` reaches the database module — importing one constant from them
 * ships all of it to the browser (Zod alone is ~80 KB gzipped). So the few
 * values the forms and the stack share live here, with no imports at all.
 * `client-imports.test.ts` keeps it that way.
 */

/** Room for a considered paragraph or three; not a place to paste a book. */
export const REVIEW_MAX = 5000;

/** Long enough for a real name, short enough to set at display scale in the masthead. */
export const NAME_MAX = 60;

/**
 * A few lines under a handle on the public diary — about three on a laptop and
 * five on a phone at the limit. Not a place to write an essay.
 */
export const BIO_MAX = 240;

/** Where a book leads. The book page renders from our database (MRG-015). */
export function bookPath(olWorkKey: string): string {
  return `/book/${olWorkKey}`;
}

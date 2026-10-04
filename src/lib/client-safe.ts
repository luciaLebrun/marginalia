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
export function bookPath(sourceKey: string): string {
  return `/book/${sourceKey}`;
}

/**
 * What a book's year means, which depends on where its record came from.
 *
 * Open Library dates the *work*: its Dune is 1965. Google dates the *volume*,
 * and a volume is an edition — its Dune is the 2005 fortieth-anniversary
 * printing. The same number under the same label would assert a different
 * fact, so the label moves rather than the number.
 */
export function publishedLabel(sourceKey: string): string {
  return sourceKey.startsWith("gb:") ? "Published" : "First published";
}

/** Strip case, accents and punctuation, so "Piranèse" and "piranese" meet. */
export function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[̀-ͯ]/g, "")
    .replaceAll(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Whether a book answers to what the reader typed into the to-read filter:
 * every word of it found, folded, in the title or an author. A blank filter
 * matches everything.
 */
export function matchesFilter(
  book: Readonly<{ title: string; authors: readonly string[] }>,
  filter: string,
): boolean {
  const words = fold(filter).split(" ").filter(Boolean);
  const haystack = fold(`${book.title} ${book.authors.join(" ")}`);
  return words.every((word) => haystack.includes(word));
}

/** The to-read filter earns its place from this many books waiting. */
export const TO_READ_FILTER_MIN = 8;

/** Judged on the whole list, never the filtered one; never hidden while it holds text. */
export function showsFilter(total: number, filter: string): boolean {
  return total >= TO_READ_FILTER_MIN || filter !== "";
}

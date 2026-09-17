import { and, eq, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";
import type { Book } from "@/db/schema";
import { INK, bandColor, readableOn } from "@/lib/color";
import { publishedLabel } from "@/lib/client-safe";

/**
 * The book page, as data. One query and a set of pure helpers, so every rule
 * about what the title page and the date slip say is testable without a
 * browser or a database.
 */

/** One of this reader's reads of this book: a line on the date slip. */
export interface Read {
  id: string;
  readAt: Date | null;
  rating: number | null;
  isReread: boolean;
  hasReview: boolean;
  /** The review as written, so the edit sheet opens holding it. */
  review: string | null;
}

/**
 * This reader's reads of one book, newest first, undated last.
 *
 * Only their own: the circle stays on profiles, and a book page that listed
 * everyone's reads would be the start of a feed this product does not have.
 */
export async function getReads(userId: string, bookId: string): Promise<Read[]> {
  const rows = await getDb()
    .select({
      id: schema.log.id,
      readAt: schema.log.readAt,
      rating: schema.log.rating,
      isReread: schema.log.isReread,
      reviewText: schema.log.reviewText,
    })
    .from(schema.log)
    .where(and(eq(schema.log.bookId, bookId), eq(schema.log.userId, userId)))
    // Same ordering as the diary, for the same reason: Postgres puts NULLs
    // first on DESC, which would float an undated read above a dated one.
    .orderBy(
      sql`${schema.log.readAt} desc nulls last`,
      sql`${schema.log.createdAt} desc`,
    );

  return rows.map((row) => ({
    id: row.id,
    readAt: row.readAt === null ? null : new Date(row.readAt),
    // numeric comes back as a string.
    rating: row.rating === null ? null : Number(row.rating),
    isReread: row.isReread,
    hasReview: Boolean(row.reviewText?.trim()),
    review: row.reviewText,
  }));
}

/** What the slip's band says about how often this book has been read. */
export function describeReads(count: number): string {
  if (count === 0) return "Not on your shelf";
  if (count === 1) return "Read once";
  if (count === 2) return "Read twice";
  return `Read ${count} times`;
}

/**
 * The author band's line. Anthologies can list a dozen names, and a band
 * carries one line of tracked caps, so past three it names two and counts.
 */
export function authorLine(authors: readonly string[]): string {
  const names = authors.map((name) => name.trim()).filter(Boolean);

  if (names.length === 0) return "Author unknown";
  if (names.length === 1) return names[0];
  if (names.length <= 3) {
    return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  }
  const others = names.length - 2;
  return `${names.slice(0, 2).join(", ")} and ${others} others`;
}

export interface ImprintRow {
  label: string;
  value: string;
  href?: string;
}

/**
 * Pure. Where a book's record lives, named for a reader.
 *
 * The tag on the key decides, not what is primary today: a book opened when
 * Open Library was the only source is still an Open Library record, and
 * sending a reader to Google for it would show them a different book.
 */
export function sourceRecord(sourceKey: string): { name: string; href: string } {
  if (sourceKey.startsWith("gb:")) {
    return {
      name: "Google Books",
      href: `https://books.google.com/books?id=${sourceKey.slice(3)}`,
    };
  }
  return {
    name: "Open Library",
    href: `https://openlibrary.org/works/${sourceKey}`,
  };
}

/**
 * The title page's imprint. A value the source did not have is omitted rather
 * than printed as a dash: an imprint lists what is known.
 *
 * The source row is always there and links out to the record — a hyperlink,
 * not an API call, and the attribution the data is owed. It is named for a
 * reader ("Google Books"), with the key kept in the address, not the text.
 */
export function imprintRows(
  book: Pick<Book, "firstPublishYear" | "pageCount" | "sourceKey">,
): ImprintRow[] {
  const rows: ImprintRow[] = [];
  if (book.firstPublishYear) {
    rows.push({
      label: publishedLabel(book.sourceKey),
      value: String(book.firstPublishYear),
    });
  }
  if (book.pageCount) {
    rows.push({ label: "Pages", value: String(book.pageCount) });
  }
  const source = sourceRecord(book.sourceKey);
  rows.push({ label: "Source", value: source.name, href: source.href });
  return rows;
}

/**
 * The named entities a publisher's blurb carries: the five structural ones and
 * the typography a marketing department reaches for.
 *
 * ponytail: the named *accents* are not here — `&eacute;` and its hundred
 * siblings pass through literally. Numeric references cover the same
 * characters and are what Google actually emits, so this table earns its keep
 * without becoming a copy of the HTML spec. If a French catalogue turns out to
 * send named accents, reach for a real entity table rather than growing this.
 */
const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "\u2014",
  ndash: "\u2013",
  hellip: "\u2026",
  lsquo: "\u2018",
  rsquo: "\u2019",
  ldquo: "\u201C",
  rdquo: "\u201D",
};

/** A code point from a numeric reference, or null when it names no character. */
function fromCodePoint(value: number): string | null {
  if (!Number.isInteger(value) || value < 1 || value > 0x10ffff) return null;
  // A lone surrogate is a valid argument and an invalid character: it would
  // reach the DOM as broken UTF-16.
  if (value >= 0xd800 && value <= 0xdfff) return null;
  return String.fromCodePoint(value);
}

/**
 * Entity references, decoded.
 *
 * Runs on every description, not only the ones carrying tags: a Google blurb
 * with no markup in it still writes `&#39;` for an apostrophe, and gating this
 * behind a `<` printed the reference verbatim — the same defect as printing a
 * `<b>`, one character narrower.
 */
function decodeEntities(text: string): string {
  if (!text.includes("&")) return text;

  return text
    .replaceAll(
      /&#(\d{1,7});/g,
      (whole, digits: string) => fromCodePoint(Number(digits)) ?? whole,
    )
    .replaceAll(
      /&#x([\da-f]{1,6});/gi,
      (whole, hex: string) => fromCodePoint(Number.parseInt(hex, 16)) ?? whole,
    )
    .replaceAll(
      /&([a-z]+);/gi,
      (whole, name: string) => ENTITIES[name.toLowerCase()] ?? whole,
    );
}

/**
 * Google serves a description as HTML where Open Library serves markdown, so
 * a book opened at Google printed its own `<b>` and `<br>` on the page.
 *
 * `<br>` is the only structure in them, and only a doubled one survives: two
 * open a paragraph, and a single one folds to a space further down the
 * pipeline, exactly as a markdown line break does. Every other tag is emphasis
 * this page does not set.
 *
 * Linear on hostile input, like everything else here — and the excluded `<` is
 * what makes it so, not the excluded `>`. `<[^>]*>` is linear only when it
 * matches: on `"<".repeat(50_000)` every `<` starts an attempt that runs to the
 * end of the string looking for a `>` and then backtracks over all of it, which
 * is quadratic (Sonar S8786). A tag cannot contain a `<`, so barring it too
 * makes each failure immediate, and stops a malformed tag swallowing the text
 * after it as a bonus.
 */
function stripTags(text: string): string {
  if (!text.includes("<")) return text;

  return text
    .replaceAll(/<[ \t]*br[^<>]*>/gi, "\n")
    .replaceAll(/<[ \t]*\/[ \t]*(?:p|div|li|h[1-6])[^<>]*>/gi, "\n\n")
    .replaceAll(/<[^<>]*>/g, "");
}

/**
 * Prose, as opposed to jacket copy: two lowercase letters closing a sentence.
 *
 * Marketing lines do not end in full stops — "Winner of the 2021 Women's Prize
 * for Fiction", "'Dazzling' Guardian" — and a blurb is sentences. The two
 * lowercase letters are what keep an initial or an abbreviation ("J.R.R.
 * Tolkien") from reading as the end of one.
 */
const PROSE = /[a-z]{2}[.!?]["')\]]?(\s|$)/;

/**
 * Both sources bury the book under editorial furniture, divided off by a
 * typographic rule, and each draws the rule its own way:
 *
 * - **Open Library**, dashes: the description, then "----------\nContains:
 *   Dune" and its like underneath. What is above the rule is the book.
 * - **Google**, underscores: publisher copy, fenced into stretches — a prize
 *   banner, the blurb, a page of press quotes — in no fixed order. So the
 *   first stretch that reads as prose is the book.
 *
 * Position and length were both tried and both cut the book off a real
 * description. "Above the rule" prints the banner; "below" prints the praise
 * when it follows the blurb instead of leading it; "the longest" prints the
 * quotes on a quiet book whose blurb is one line. Length cannot even separate
 * the two recorded cases — Piranesi's banner is 231 characters and a real
 * short blurb is 60. What actually distinguishes them is that one is written
 * in sentences and the other is not.
 *
 * ponytail: a blurb that is a single unpunctuated fragment reads as jacket
 * copy and falls through to the first stretch, which is the old behaviour and
 * never worse than it. A description with no rule at all is one stretch and
 * passes through whole.
 */
function withoutFurniture(text: string): string {
  const [aboveTheRule = ""] = text.split(/^[ \t]*-{3,}[ \t]*$/m);

  const fenced = aboveTheRule.split(/^[ \t]*_{3,}[ \t]*$/m);
  return fenced.find((stretch) => PROSE.test(stretch)) ?? fenced[0] ?? "";
}

/**
 * A description, as paragraphs a reader should see.
 *
 * Open Library's are contributor-edited markdown-ish text, with `([source][1])`
 * citations and link reference definitions scattered through. Google's are
 * publisher marketing copy in HTML. Neither arrives as paragraphs; both carry
 * furniture that is not the book. The text is untrusted from either, so no
 * pattern may backtrack super-linearly: whitespace runs are horizontal only,
 * and a bracketed run stops at the next bracket of either kind. `[^\]]+` would
 * also match `[`, letting a line of unmatched brackets rescan from every one of
 * them — quadratic (Sonar S8786).
 */
export function descriptionParagraphs(text: string | null | undefined): string[] {
  if (!text) return [];

  const body = decodeEntities(withoutFurniture(stripTags(text.replaceAll("\r\n", "\n"))));

  return body
    .replaceAll(/^[ \t]*\[\d+\]:[ \t]*\S.*$/gm, "")
    .replaceAll(/\([ \t]*\[source\](?:\[\d+\]|\([^()\n]*\))[ \t]*\)/gi, "")
    .replaceAll(/\[([^[\]\n]+)\](?:\[\d+\]|\([^()\n]*\))/g, "$1")
    .split(/\n[ \t]*\n/)
    .map((paragraph) => paragraph.replaceAll(/\s+/g, " ").trim())
    .filter(Boolean);
}

/**
 * The subtitle a reader should see, or null.
 *
 * Open Library's `subtitle` is a subtitle. Google's is whatever the publisher
 * filed there, which for a prize-winner is "WINNER OF THE WOMEN'S PRIZE 2021"
 * — a jacket banner, set under the title in the voice of a subtitle.
 *
 * Shouting is the test, and only a script that *has* a case distinction can
 * shout. A rule that merely looked for a lowercase letter deleted "1984" and
 * every subtitle in Japanese, Arabic or Hebrew along with the banners, so a
 * string with no cased character in it is left alone, and one that is cased
 * and wholly uppercase is the banner.
 *
 * ponytail: this drops a subtitle a publisher set in caps as house style —
 * `SPQR`, `\u03A4\u039F \u039D\u0397\u03A3\u0399` — which is the price of catching the
 * banner, and the loss is a line rather than a falsehood. A banner in title
 * case ("A New York Times Bestseller") still reads as a subtitle. Catching that needs a list of marketing phrases, which
 * is a classifier to maintain; it prints something true about the book
 * meanwhile, where the shouted banner printed a lie about what it is.
 */
export function displaySubtitle(subtitle: string | null | undefined): string | null {
  const text = subtitle?.trim();
  if (!text) return null;

  const cased = text.toLowerCase() !== text.toUpperCase();
  return cased && text === text.toUpperCase() ? null : text;
}

export { slipDate } from "./slip-date";

/**
 * The author band's ground and foreground.
 *
 * Ink until the book is on this reader's shelf, then the book's own colour —
 * the rule search already keeps. Colour is what a book earns by being logged,
 * so it cannot be worn by a book this reader has not read.
 */
export function bookBand(
  book: Pick<Book, "coverColor" | "sourceKey">,
  onShelf: boolean,
): { background: string; color: string } {
  const background = onShelf ? bandColor(book.coverColor, book.sourceKey) : INK;
  return { background, color: readableOn(background) };
}

import { notFound } from "next/navigation";

import google from "../../../../tests/fixtures/google-books-dune.json";
import search from "../../../../tests/fixtures/openlibrary-search-dune.json";
import freakonomics from "../../../../tests/fixtures/openlibrary-search-freakonomics.json";
import subtitled from "../../../../tests/fixtures/openlibrary-search-subtitled.json";
import work from "../../../../tests/fixtures/openlibrary-work-dune.json";
import {
  BookNotFound,
  BookOpening,
  BookUnavailable,
} from "@/components/BookStates";
import { BookTitlePage } from "@/components/BookTitlePage";
import { WordmarkBand } from "@/components/WordmarkBand";
import type { Book } from "@/db/schema";
import { toBookRow } from "@/lib/book";
import type { Read } from "@/lib/book-view";
import { mergeGoogleVolume } from "@/lib/books/google-books";
import { normalizeSearchResponse, normalizeWorkResponse } from "@/lib/books/openlibrary";

/**
 * Development harness for the book page.
 *
 * `/book/[key]` is behind Google OAuth and opens books through the database,
 * so this renders the same components from recorded fixtures, switched by
 * `?state=`:
 *
 * - `new` (default) — Dune, not on the shelf: ink band, an empty slip.
 * - `shelf` — Dune read twice: its jacket colour on the band, a reread.
 * - `fallback` — the same, with no extracted colour: the stable fallback band,
 *   which for this key is the wordmark's own orange.
 * - `undated` — one read with no date and no rating.
 * - `nocover` — a real coverless result: the type-only jacket.
 * - `subtitle` — a real book whose record carries a subtitle.
 * - `authors` — a real book with three names, to wrap the author band.
 * - `opening` · `down` · `missing` — the three other states.
 *
 * Every book here is real recorded data. The reads are invented, the way
 * `pnpm seed:dev` invents who read what, and like it they never leave a
 * development server: this 404s in production. No session, no database.
 */
const summaries = normalizeSearchResponse(search);

function stored(
  detail: Parameters<typeof toBookRow>[0],
  id: string,
  coverColor: string | null = null,
): Book {
  return { ...toBookRow(detail, coverColor), id, cachedAt: new Date(0) } as Book;
}

/*
 * The recorded search doc is the redirect stub OL893415W, and its CoverID
 * 240727 is served by Open Library as another book's jacket. A stored row
 * carries the surviving key, so this one does too, with the CoverID live Open
 * Library returns for that key (checked 2026-09-11).
 *
 * The band colour is what `bandColorFromCover()` extracts from that cover,
 * run once against the live image on the same day — the value a logged copy
 * would carry. The page shows it only once the book is on the shelf.
 */
const DUNE = stored(
  {
    ...mergeGoogleVolume(normalizeWorkResponse(summaries[0], work), google),
    olWorkKey: "OL893414W",
    coverId: 11481354,
  },
  "dev-dune",
  "#70631F",
);

const DUNE_WITHOUT_COLOUR: Book = { ...DUNE, coverColor: null };

const coverless = summaries.find((summary) => summary.coverId === undefined);
const COVERLESS = coverless
  ? stored({ ...coverless, source: "openlibrary" }, "dev-coverless")
  : DUNE;

const SUBTITLED = stored(
  { ...normalizeSearchResponse(subtitled)[0], source: "openlibrary" },
  "dev-subtitled",
);

const MANY_AUTHORS = stored(
  { ...normalizeSearchResponse(freakonomics)[0], source: "openlibrary" },
  "dev-authors",
);

const SHELF_READS: Read[] = [
  { id: "dev-read-2", readAt: new Date("2026-08-14"), rating: 4.5, isReread: true, hasReview: true },
  { id: "dev-read-1", readAt: new Date("2019-05-02"), rating: 4, isReread: false, hasReview: false },
];

const UNDATED_READS: Read[] = [
  { id: "dev-read-u", readAt: null, rating: null, isReread: false, hasReview: false },
];

const DIARY = "/dev/shelf";

export default async function DevBookPage({ searchParams }: PageProps<"/dev/book">) {
  if (process.env.NODE_ENV === "production") notFound();

  const { state } = await searchParams;

  return (
    <main className="flex-1">
      <WordmarkBand />
      <State state={typeof state === "string" ? state : "new"} />
    </main>
  );
}

function State({ state }: Readonly<{ state: string }>) {
  switch (state) {
    case "opening":
      return <BookOpening diaryHref={DIARY} />;
    case "down":
      return <BookUnavailable diaryHref={DIARY} />;
    case "missing":
      return <BookNotFound diaryHref={DIARY} />;
    case "nocover":
      return <BookTitlePage book={COVERLESS} reads={[]} diaryHref={DIARY} />;
    case "subtitle":
      return <BookTitlePage book={SUBTITLED} reads={[]} diaryHref={DIARY} />;
    case "authors":
      return <BookTitlePage book={MANY_AUTHORS} reads={[]} diaryHref={DIARY} />;
    case "shelf":
      return <BookTitlePage book={DUNE} reads={SHELF_READS} diaryHref={DIARY} />;
    case "fallback":
      return <BookTitlePage book={DUNE_WITHOUT_COLOUR} reads={SHELF_READS} diaryHref={DIARY} />;
    case "undated":
      return <BookTitlePage book={DUNE} reads={UNDATED_READS} diaryHref={DIARY} />;
    default:
      return <BookTitlePage book={DUNE} reads={[]} diaryHref={DIARY} />;
  }
}

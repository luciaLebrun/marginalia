import { notFound } from "next/navigation";

import google from "../../../../tests/fixtures/google-books-dune.json";
import googlePiranesi from "../../../../tests/fixtures/google-books-volume-piranesi.json";
import googleVolume from "../../../../tests/fixtures/google-books-volume-dune.json";
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
import { mergeGoogleVolume, normalizeVolume } from "@/lib/books/google-books";
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
 * - `google` — the same book as Google Books now returns it: a Google jacket
 *   (one src, no srcset, its own proportions) and a Google source row.
 * - `banner` — the Google record at its most publisher-written: a prize
 *   banner filed as the subtitle, and a blurb walled between two rules of
 *   press quotes. The page must print the book and none of the shouting.
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
    sourceKey: "OL893414W",
    coverId: 11481354,
  },
  "dev-dune",
  "#70631F",
);

const DUNE_WITHOUT_COLOUR: Book = { ...DUNE, coverColor: null };

/*
 * The same book as a *click* really fetches it (MRG-063): the volume endpoint,
 * not the search one. The distinction is the whole reason the Google page's
 * defects went unseen here — a search hit carries a short plain-text snippet,
 * while the volume carries what Google actually stores, which is publisher
 * marketing copy in HTML, and a `publishedDate` of the 2005 printing rather
 * than 1965. This state is the one that proves both are handled.
 *
 * A Google volume also addresses its cover by URL and offers no size ladder,
 * and its record row links to Google Books rather than Open Library. The
 * colour is what `bandColorFromCover()` really extracts from that jacket, run
 * against the live image (2026-09-17) — the yellow DUNE panel on the 40th
 * Anniversary scan, where Open Library's copy gives olive. It earns its place
 * twice over: a different scan of the same book legitimately gives a different
 * band, and this is the only state in which the band is light enough that
 * `readableOn()` sets the author in ink rather than paper (10.88:1, against
 * 5.32:1 for the Open Library band).
 */
const DUNE_GOOGLE = stored(
  normalizeVolume(googleVolume)!,
  "dev-dune-google",
  "#DEC65E",
);

/*
 * Google's marketing copy at full strength, recorded from the volume endpoint.
 * Its `subtitle` is "WINNER OF THE WOMEN'S PRIZE 2021" — a jacket banner, not
 * a subtitle — and its description walls four real paragraphs between two
 * underscore rules of press quotes. Not on the shelf, so the band is ink and
 * no colour has to be invented for it.
 */
const BANNERED = stored(normalizeVolume(googlePiranesi)!, "dev-bannered");

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

/*
 * Real-shaped ids: a slip line addresses its read's permalink, so a harness id
 * that is not a UUID would build a link the real route refuses.
 */
const SHELF_READS: Read[] = [
  {
    id: "2f9c1d4a-7b3e-4c8d-9a1f-5e6d7c8b9a01",
    readAt: new Date("2026-08-14"),
    rating: 4.5,
    isReread: true,
    hasReview: true,
    review: "Better the second time.",
  },
  {
    id: "2f9c1d4a-7b3e-4c8d-9a1f-5e6d7c8b9a02",
    readAt: new Date("2019-05-02"),
    rating: 4,
    isReread: false,
    hasReview: false,
    review: null,
  },
];

const UNDATED_READS: Read[] = [
  {
    id: "2f9c1d4a-7b3e-4c8d-9a1f-5e6d7c8b9a03",
    readAt: null,
    rating: null,
    isReread: false,
    hasReview: false,
    review: null,
  },
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
    case "google":
      return <BookTitlePage book={DUNE_GOOGLE} reads={SHELF_READS} username="lucia" diaryHref={DIARY} />;
    case "banner":
      return <BookTitlePage book={BANNERED} reads={[]} username="lucia" diaryHref={DIARY} />;
    case "nocover":
      return <BookTitlePage book={COVERLESS} reads={[]} username="lucia" diaryHref={DIARY} />;
    case "subtitle":
      return <BookTitlePage book={SUBTITLED} reads={[]} username="lucia" diaryHref={DIARY} />;
    case "authors":
      return <BookTitlePage book={MANY_AUTHORS} reads={[]} username="lucia" diaryHref={DIARY} />;
    case "saved":
      return <BookTitlePage book={DUNE} reads={[]} onToRead username="lucia" diaryHref={DIARY} />;
    case "shelf":
      return <BookTitlePage book={DUNE} reads={SHELF_READS} username="lucia" diaryHref={DIARY} />;
    case "fallback":
      return <BookTitlePage book={DUNE_WITHOUT_COLOUR} reads={SHELF_READS} username="lucia" diaryHref={DIARY} />;
    case "undated":
      return <BookTitlePage book={DUNE} reads={UNDATED_READS} username="lucia" diaryHref={DIARY} />;
    default:
      return <BookTitlePage book={DUNE} reads={[]} username="lucia" diaryHref={DIARY} />;
  }
}

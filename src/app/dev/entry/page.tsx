import { notFound } from "next/navigation";

import google from "../../../../tests/fixtures/google-books-dune.json";
import search from "../../../../tests/fixtures/openlibrary-search-dune.json";
import work from "../../../../tests/fixtures/openlibrary-work-dune.json";
import { ReviewPostcard } from "@/components/ReviewPostcard";
import { WordmarkBand } from "@/components/WordmarkBand";
import { REVIEW_MAX } from "@/lib/read-schema";
import type { LogEntry } from "@/lib/entry";
import { mergeGoogleVolume } from "@/lib/books/google-books";
import { normalizeSearchResponse, normalizeWorkResponse } from "@/lib/books/openlibrary";

/**
 * Development harness for a review permalink.
 *
 * The real route is public, so `/dev/entry/latest` redirects to a real seeded
 * entry and e2e exercises the route itself. This page is for the states that
 * seeded data does not happen to hold, switched by `?state=`:
 *
 * - `reviewed` (default) — a read with words, a rating and a reread mark
 * - `bare` — no review, no rating, no date
 * - `nocover` — a real coverless book: the type-only jacket
 * - `long` — a review at the account sheet's limit, to prove the card grows
 *
 * `?signedin=1` renders the title as a link, as it is for a signed-in reader.
 *
 * The book is real recorded data; the reader is the seeded local reader and
 * the words are invented, the way `pnpm seed:dev` invents who read what. Like
 * it, they never leave a development server: this 404s in production.
 */
const summaries = normalizeSearchResponse(search);

const DUNE = {
  ...mergeGoogleVolume(normalizeWorkResponse(summaries[0], work), google),
  sourceKey: "OL893414W",
  coverId: 11481354,
};

const coverless = summaries.find((summary) => summary.coverId === undefined);

const READER = { id: "dev-reader", name: "Lucia", username: "lucia" };

const WRITTEN = [
  "Stranger the second time. The ecology reads as the plot now, and Paul as the warning rather than the hero — I had remembered it the other way round.",
  "What I had forgotten is how much of it is weather: heat, water, the cost of both. The politics only work because the desert does.",
].join("\n\n");

function entry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: "8c6f2f2e-6f1a-4a2f-9a1e-2b7c5d4e3f10",
    reader: READER,
    book: {
      id: "dev-dune",
      sourceKey: DUNE.sourceKey,
      title: DUNE.title,
      authors: DUNE.authors,
      coverId: DUNE.coverId ?? null,
      coverUrl: null,
      coverColor: "#70631F",
      firstPublishYear: DUNE.firstPublishYear ?? null,
    },
    readAt: new Date("2026-08-14"),
    rating: 4.5,
    isReread: true,
    review: WRITTEN,
    ...overrides,
  };
}

export default async function DevEntryPage({ searchParams }: PageProps<"/dev/entry">) {
  if (process.env.NODE_ENV === "production") notFound();

  const params = await searchParams;
  const state = typeof params.state === "string" ? params.state : "reviewed";

  let shown = entry();
  if (state === "bare") {
    shown = entry({ readAt: null, rating: null, isReread: false, review: null });
  }
  if (state === "long") {
    shown = entry({
      review: `${WRITTEN}\n\n`.repeat(Math.ceil(REVIEW_MAX / WRITTEN.length)).slice(0, REVIEW_MAX),
    });
  }
  if (state === "nocover" && coverless) {
    shown = entry({
      book: {
        id: "dev-coverless",
        sourceKey: coverless.sourceKey,
        title: coverless.title,
        authors: coverless.authors,
        coverId: null,
        coverUrl: null,
        coverColor: null,
        firstPublishYear: coverless.firstPublishYear ?? null,
      },
    });
  }

  return (
    <main className="flex-1">
      <WordmarkBand />
      <ReviewPostcard entry={shown} signedIn={params.signedin === "1"} />
    </main>
  );
}

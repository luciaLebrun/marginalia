import Link from "next/link";

/**
 * The book page's states other than an opened book. Each is its own component
 * so the dev harness can render them without throwing, and so `not-found.tsx`
 * and the harness say the same thing.
 */

/** The ink band these states open with: what happened, and the way back. */
export function StateBand({
  children,
  diaryHref = "/",
}: Readonly<{ children: React.ReactNode; diaryHref?: string }>) {
  return (
    // The 2px ink top rule draws nothing on an ink ground. It is there to give
    // this band the author band's exact height, so the page does not shift by
    // a pixel when "Opening this book…" is replaced by the book.
    <div className="flex items-center justify-between gap-4 border-t-2 border-ink bg-ink px-4 py-3 text-paper sm:px-6">
      {children}
      <Link
        href={diaryHref}
        // The global focus ring is ink, which vanishes on this band.
        className="band-label shrink-0 underline decoration-paper/40 underline-offset-4 transition-colors hover:decoration-paper focus-visible:outline-paper"
      >
        Your diary
      </Link>
    </div>
  );
}

/**
 * While the book opens. Not "from Open Library": a book already stored opens
 * from Postgres and never reaches it, and this shows for both. The frame it
 * will fill is drawn as ruled empty positions, not as skeleton shapes
 * pretending to be a book.
 */
export function BookOpening({ diaryHref }: Readonly<{ diaryHref?: string }>) {
  return (
    <div>
      <StateBand diaryHref={diaryHref}>
        <output className="band-label leading-[1.4]!">Opening this book…</output>
      </StateBand>
      <div
        aria-hidden="true"
        className="grid gap-6 px-4 pt-6 pb-10 sm:grid-cols-[min(24rem,33%)_minmax(0,1fr)] sm:gap-10 sm:px-6 sm:pt-8"
      >
        <div className="mx-auto w-3/5 max-w-[24rem] sm:mx-0 sm:w-full">
          <div className="aspect-[2/3] border border-rule bg-paper-sunk" />
        </div>
        <div className="flex flex-col">
          <div className="h-[2.25rem] max-w-[34rem] border-b-2 border-rule sm:h-[3.5rem]" />
          <div className="mt-6 max-w-[34rem] border-t border-rule">
            {["published", "pages", "source"].map((row) => (
              <div key={row} className="h-10 border-b border-rule" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Open Library is down and this book has never been opened here. Soft ink on
 * sunk paper, never alarm — nothing was refused — and never "not found", which
 * would send a reader hunting for a typo that is not there.
 */
export function BookUnavailable({ diaryHref }: Readonly<{ diaryHref?: string }>) {
  return (
    <div>
      <StateBand diaryHref={diaryHref}>
        <h1 className="band-label leading-[1.4]!">Book unavailable</h1>
      </StateBand>
      <div className="border-b border-rule bg-paper-sunk px-4 py-6 sm:px-6">
        <p className="max-w-[38rem] text-[0.9375rem] leading-relaxed text-ink-soft">
          Open Library isn’t answering, and this book hasn’t been opened here
          before, so there is nothing to show yet. Your diary is unaffected — try
          again in a few minutes.
        </p>
      </div>
    </div>
  );
}

/** No such work. The likeliest cause is an old link to a merged record. */
export function BookNotFound({ diaryHref }: Readonly<{ diaryHref?: string }>) {
  return (
    <div>
      <StateBand diaryHref={diaryHref}>
        <h1 className="band-label leading-[1.4]!">Book not found</h1>
      </StateBand>
      <div className="px-4 py-6 sm:px-6">
        <p className="max-w-[38rem] text-[0.9375rem] leading-relaxed text-ink-soft">
          Open Library has no book at this address. If you followed an old link,
          the record may have been merged into another — search for the book by
          its title.
        </p>
        <Link
          href="/search"
          className="band-label mt-5 inline-block border border-ink bg-paper px-3 py-2.5 transition-colors hover:bg-band-fiction focus-visible:bg-band-fiction"
        >
          Search for a book
        </Link>
      </div>
    </div>
  );
}

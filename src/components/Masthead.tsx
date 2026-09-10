import Link from "next/link";

import { WordmarkBand } from "./WordmarkBand";

/**
 * The masthead is a tri-band at page scale — colour, field, record — so the
 * page's largest element is built from the same frame as every cell below it.
 *
 * The three bands are differentiated by ground (colour, paper, ink) rather
 * than by size. Two thin ruled paper strips in a row would read as one device
 * repeated, and the year band immediately below is already a ruled strip.
 */
export function Masthead({
  name,
  span,
  count,
}: Readonly<{
  name: string | null;
  /**
   * The years this diary covers. Non-nullable on purpose: this holds the name
   * field's right edge, and a null here leaves the band a justify-between row
   * with one occupant.
   */
  span: string;
  count: number;
}>) {
  const noun = count === 1 ? "book" : "books";
  const tally = count === 0 ? "Nothing logged yet" : `${count} ${noun} logged`;

  return (
    <header>
      <WordmarkBand />

      {/* The name field. The reading span holds its right edge so the band is
          not a single word floating in a thousand pixels of paper.

          Deliberately not the handle: username is nullable and unclaimed until
          MRG-012, so it would render nothing for every real reader — and it
          would advertise /@[username], a route that does not exist yet. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-[2.25rem] leading-[0.95] font-semibold tracking-[-0.02em] sm:text-[3.5rem]">
          {name ?? "Your reading"}
        </h1>
        <p className="text-[1rem] font-medium text-ink-soft tabular-nums sm:text-[1.375rem]">
          {span}
        </p>
      </div>

      {/* The record band carries the tally and the only way into the account
          sheet. A separate nav bar would be a fourth band this page does not
          have, and this one is already the page's ruled foot. */}
      <div className="flex items-center justify-between gap-4 bg-ink px-4 py-3 text-paper sm:px-6">
        <p className="band-label">{tally}</p>
        <Link
          href="/settings"
          className="band-label underline decoration-paper/40 underline-offset-4 transition-colors hover:decoration-paper"
        >
          Your account
        </Link>
      </div>
    </header>
  );
}

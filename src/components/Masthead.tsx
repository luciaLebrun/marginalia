import Link from "next/link";

import { WordmarkBand } from "./WordmarkBand";
import { ACCOUNT_LINK, type MastheadLink } from "@/lib/masthead-link";

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
  handle = null,
  bio = null,
  link = ACCOUNT_LINK,
}: Readonly<{
  name: string | null;
  /**
   * The years this diary covers. Non-nullable on purpose: this holds the name
   * field's right edge, and a null here leaves the band a justify-between row
   * with one occupant.
   */
  span: string;
  count: number;
  /**
   * Set on a profile, where a visitor needs to know whose diary this is. The
   * reader's own diary leaves it out: it is their page, and they know.
   */
  handle?: string | null;
  /** The bio the account sheet says appears "a few lines under your handle". */
  bio?: string | null;
  /**
   * The record band's way onward. Defaults to the account; a profile passes
   * whatever suits who is looking, and null for a visitor with nowhere to go.
   */
  link?: MastheadLink | null;
}>) {
  const noun = count === 1 ? "book" : "books";
  const tally = count === 0 ? "Nothing logged yet" : `${count} ${noun} logged`;

  return (
    <header>
      <WordmarkBand />

      {/* The name field. The reading span holds its right edge so the band is
          not a single word floating in a thousand pixels of paper.

          The name and the span keep a row of their own, so the span stays on
          the name's baseline at every width. On a profile the handle and the
          bio follow under that row — inside it, a phone would wrap the span
          below the bio, where it reads as a stray line. */}
      <div className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h1 className="min-w-0 text-[2.25rem] leading-[0.95] font-semibold tracking-[-0.02em] break-words sm:text-[3.5rem]">
            {name ?? "Your reading"}
          </h1>
          <p className="text-[1rem] font-medium text-ink-soft tabular-nums sm:text-[1.375rem]">
            {span}
          </p>
        </div>
        {handle && (
          <p className="band-label mt-3 break-all text-ink-soft">@{handle}</p>
        )}
        {bio && (
          <p className="mt-3 max-w-[38rem] text-[0.9375rem] leading-relaxed text-pretty text-ink-soft">
            {bio}
          </p>
        )}
      </div>

      {/* The record band carries the tally and, where there is one, the next
          step. A separate nav bar would be a fourth band this page does not
          have, and this one is already the page's ruled foot. */}
      <div className="flex items-center justify-between gap-4 bg-ink px-4 py-3 text-paper sm:px-6">
        <p className="band-label">{tally}</p>
        {link && (
          <Link
            href={link.href}
            // The global focus ring is ink, which vanishes on this band.
            className="band-label underline decoration-paper/40 underline-offset-4 transition-colors hover:decoration-paper focus-visible:outline-paper"
          >
            {link.label}
          </Link>
        )}
      </div>
    </header>
  );
}

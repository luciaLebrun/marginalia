import Link from "next/link";

import { CATEGORY_BANDS, readableOn } from "@/lib/color";

/**
 * The primary action, shaped as an entry.
 *
 * It sits in the grid's first position rather than in a toolbar, so an empty
 * shelf reads as one card that is entirely this action — not as a blank page
 * with a button stranded above it.
 */
const BAND = CATEGORY_BANDS[0];

export function LogCell({ emphatic }: Readonly<{ emphatic?: boolean }>) {
  // Hovering inverted this to paper on orange, 3.32:1 — the primary action's
  // own hover state failed AA. Same helper the entry bands use.
  const tone = readableOn(BAND);

  return (
    <Link
      href="/search"
      className="group flex flex-col border border-ink bg-paper transition-colors hover:bg-[var(--log-band)] focus-visible:bg-[var(--log-band)]"
      style={
        { "--log-band": BAND, "--log-tone": tone } as React.CSSProperties
      }
    >
      <div className="band-label bg-ink px-2.5 py-2 text-paper">Add</div>

      {/* The jacket ratio is kept even when empty: a slot waiting for its
          first spine, not an empty box. */}
      <div className="flex aspect-[2/3] items-center justify-center px-3">
        <svg
          width={emphatic ? "44" : "34"}
          height={emphatic ? "44" : "34"}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
          className="text-ink transition-colors group-hover:text-[var(--log-tone)] group-focus-visible:text-[var(--log-tone)]"
        >
          <path d="M12 5v14M5 12h14" strokeLinecap="square" />
        </svg>
      </div>

      <div className="flex flex-1 flex-col gap-1 border-t border-ink px-2.5 py-2">
        <span
          className={`leading-tight font-semibold transition-colors group-hover:text-[var(--log-tone)] group-focus-visible:text-[var(--log-tone)] ${emphatic ? "text-[1.25rem] tracking-[-0.01em]" : "text-[0.8125rem]"}`}
        >
          Log a book
        </span>
        {emphatic && (
          <span className="text-[0.875rem] leading-relaxed text-ink-soft transition-colors group-hover:text-[var(--log-tone)] group-focus-visible:text-[var(--log-tone)]">
            Nothing logged yet. When you finish a book, search for it here and
            set the date you finished — a rating and a few words are optional.
          </span>
        )}
      </div>
    </Link>
  );
}

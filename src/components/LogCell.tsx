import Link from "next/link";

/**
 * The primary action, shaped as an entry.
 *
 * It sits in the grid's first position rather than in a toolbar, so an empty
 * shelf reads as one card that is entirely this action — not as a blank page
 * with a button stranded above it.
 */
export function LogCell({ emphatic }: Readonly<{ emphatic?: boolean }>) {
  return (
    <Link
      href="/search"
      className="group flex flex-col border border-ink bg-paper transition-colors hover:bg-band-fiction focus-visible:bg-band-fiction"
    >
      <div className="band-label bg-ink px-2.5 py-2 text-paper transition-colors group-hover:bg-ink group-focus-visible:bg-ink">
        Add
      </div>

      <div className="flex aspect-[2/3] items-center justify-center px-3">
        <svg
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
          className="text-ink transition-colors group-hover:text-paper group-focus-visible:text-paper"
        >
          <path d="M12 5v14M5 12h14" strokeLinecap="square" />
        </svg>
      </div>

      <div className="flex flex-1 flex-col gap-1 border-t border-ink px-2.5 py-2 transition-colors group-hover:border-paper group-focus-visible:border-paper">
        <span className="text-[0.8125rem] leading-tight font-semibold transition-colors group-hover:text-paper group-focus-visible:text-paper">
          Log a book
        </span>
        {emphatic && (
          <span className="text-[0.6875rem] leading-snug text-ink-soft transition-colors group-hover:text-paper group-focus-visible:text-paper">
            Search by title or author, then set a date and a rating.
          </span>
        )}
      </div>
    </Link>
  );
}

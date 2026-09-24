/**
 * A full-width ruled band, not a hairline. Chronology is the structure this
 * shelf is ordered by, so it is drawn at a scale that carries across a
 * viewport rather than set in the page's smallest type.
 */
export function YearRule({
  year,
  count,
  rest = false,
}: Readonly<{
  /** The group's name: a year, or an author or category (MRG-072). */
  year: string;
  count: number;
  /** The group with nothing to file it under — "Undated" and its kin. */
  rest?: boolean;
}>) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-y border-ink bg-paper-sunk px-3 py-2">
      {/* An author or a category can run long; it wraps balanced rather than
          pushing the count off the band. */}
      <h2
        className={`min-w-0 text-[1.75rem] leading-none font-semibold tracking-[-0.02em] text-balance sm:text-[2.25rem] ${rest ? "text-ink-soft" : ""}`}
      >
        {year}
      </h2>
      <span className="band-label shrink-0 text-ink-soft">
        {count} {count === 1 ? "book" : "books"}
      </span>
    </div>
  );
}

/**
 * A full-width ruled band, not a hairline. Chronology is the structure this
 * shelf is ordered by, so it is drawn at a scale that carries across a
 * viewport rather than set in the page's smallest type.
 */
export function YearRule({
  year,
  count,
}: Readonly<{ year: string; count: number }>) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-y border-ink bg-paper-sunk px-3 py-2">
      <h2 className="text-[1.75rem] leading-none font-semibold tracking-[-0.02em] sm:text-[2.25rem]">
        {year}
      </h2>
      <span className="band-label text-ink-soft">
        {count} {count === 1 ? "book" : "books"}
      </span>
    </div>
  );
}

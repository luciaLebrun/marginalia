/** A full-width ruled band. The chronology is the structure, so it is drawn. */
export function YearRule({ year, count }: { year: string; count: number }) {
  return (
    <div className="col-span-full flex items-baseline gap-3 border-b border-ink pb-1.5">
      <h2 className="text-[1.125rem] leading-none font-semibold tracking-tight">
        {year}
      </h2>
      <span className="band-label text-ink-soft">
        {count} {count === 1 ? "book" : "books"}
      </span>
    </div>
  );
}

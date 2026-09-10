/**
 * The tri-band masthead: the same three-part frame the entries use, at page
 * scale, so the shelf below reads as part of one printed object.
 */
export function Masthead({
  name,
  count,
}: Readonly<{
  name: string | null;
  count: number;
}>) {
  const tally =
    count === 0
      ? "No books logged yet"
      : `${count} ${count === 1 ? "book" : "books"} logged`;

  return (
    <header className="border-b border-ink">
      <div className="bg-band-fiction px-4 py-3 sm:px-6">
        <p className="band-label text-paper">Marginalia</p>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 py-4 sm:px-6">
        <h1 className="text-[1.75rem] leading-none font-semibold tracking-tight sm:text-[2.25rem]">
          {name ?? "Your reading"}
        </h1>
        <p className="text-[0.8125rem] font-medium text-ink-soft">{tally}</p>
      </div>
    </header>
  );
}

import { coverUrl } from "@/lib/books";

/**
 * A book jacket in the pale centre band.
 *
 * A plain lazy <img>, not next/image: Open Library asks that public pages point
 * src at their CDN, and it keeps us off Vercel Hobby's transformation quota for
 * images we do not own.
 *
 * Open Library cover ratios are inconsistent, so the frame is fixed and the
 * jacket sits inside it at its own proportions — letterboxed on paper rather
 * than cropped, because a cropped jacket loses its typography.
 */
export function Cover({
  coverId,
  title,
  authors,
}: {
  coverId: number | null;
  title: string;
  authors: string[];
}) {
  const src = coverUrl(coverId, "M");

  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-paper-sunk px-3 py-4">
        {/* Plenty of books have no cover. That is a real state, not an error,
            so it gets a real setting rather than a broken-image icon. */}
        <span className="text-center text-[0.8125rem] leading-snug font-medium text-ink-soft">
          {title}
          {authors[0] && (
            <span className="mt-1 block font-normal">{authors[0]}</span>
          )}
        </span>
      </div>
    );
  }

  return (
    // Deliberate, see ADR 0004: Open Library asks that public pages point src
    // at their CDN, and routing covers through next/image would burn Vercel
    // Hobby's transformation quota on images we neither own nor host.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={authors.length ? `${title} by ${authors[0]}` : title}
      loading="lazy"
      decoding="async"
      className="h-full w-full object-contain"
    />
  );
}

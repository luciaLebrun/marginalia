import { jacket } from "@/lib/books";

/**
 * A book jacket in the pale centre band.
 *
 * A plain lazy <img>, not next/image: Open Library asks that public pages point
 * src at their CDN, and it keeps us off Vercel Hobby's transformation quota for
 * images we do not own. Google Books jackets are pointed at for the same
 * reason.
 *
 * Cover ratios are inconsistent at both sources, so the frame is fixed and the
 * jacket sits inside it at its own proportions — letterboxed on paper rather
 * than cropped, because a cropped jacket loses its typography.
 */

/** The shelf grid's four column steps. A cover set outside the grid passes its own. */
const GRID_SIZES =
  "(min-width: 80rem) 16vw, (min-width: 64rem) 24vw, (min-width: 40rem) 32vw, 48vw";

export function Cover({
  coverId,
  coverUrl,
  title,
  authors,
  sizes = GRID_SIZES,
  scale = "cell",
}: Readonly<{
  coverId: number | null;
  /** A Google Books jacket URL. Set instead of coverId, never as well. */
  coverUrl?: string | null;
  title: string;
  authors: string[];
  sizes?: string;
  /** "page" sets a coverless jacket at frontispiece size, for the book page. */
  scale?: "cell" | "page";
}>) {
  const art = jacket({ coverId, coverUrl });

  if (!art) {
    if (scale === "page") return <PageJacket title={title} authors={authors} />;

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
      src={art.src}
      srcSet={art.srcSet}
      sizes={sizes}
      alt={authors.length ? `${title} by ${authors[0]}` : title}
      // A page-scale jacket is the page's lead image and sits above the fold,
      // so it is the LCP: fetch it at once. Grid covers wait for the scroll.
      loading={scale === "page" ? "eager" : "lazy"}
      fetchPriority={scale === "page" ? "high" : "auto"}
      decoding="async"
      className="h-full w-full object-contain"
    />
  );
}

/**
 * A coverless book at frontispiece size: a type-only jacket, set the way a
 * paperback with no illustration was — the title large at the head, the
 * author in the band voice at the foot. The shelf cell's small centred label
 * blown up to 384px reads as an empty placeholder; this reads as a jacket.
 *
 * Hidden from assistive tech: the page's own heading already says the title,
 * and a screen reader should not hear it twice.
 */
function PageJacket({ title, authors }: Readonly<{ title: string; authors: string[] }>) {
  return (
    <div
      aria-hidden="true"
      className="flex h-full w-full flex-col justify-between gap-4 bg-paper-sunk px-5 py-6 lg:px-7 lg:py-8"
    >
      {/* The headline step, holding 1.75rem until the frontispiece column is
          wide enough for 2.25rem not to break a word. */}
      <span className="text-[1.75rem] leading-none font-semibold tracking-[-0.02em] text-balance break-words lg:text-[2.25rem]">
        {title}
      </span>
      {authors[0] && (
        <span className="band-label leading-[1.4]! text-balance text-ink-soft">
          {authors[0]}
        </span>
      )}
    </div>
  );
}

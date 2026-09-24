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
type Scale = "cell" | "band" | "page";

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
  /**
   * The coverless jacket's size: "page" at frontispiece size, for the book
   * page; "band" a step up from a cell on a laptop, for the favourites band.
   */
  scale?: Scale;
}>) {
  const art = jacket({ coverId, coverUrl });

  // Plenty of books have no cover. That is a real state, not an error, so it
  // gets a real setting rather than a broken-image icon.
  if (!art) return <TypeJacket title={title} authors={authors} scale={scale} />;

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
 * A coverless book as a type-only jacket, set the way a paperback with no
 * illustration was — the title large at the head, the author in the band voice
 * at the foot. One answer at both scales: a small centred caption in a grid
 * well read as a failed image load beside a full-bleed jacket, and blown up to
 * 384px it read as an empty placeholder. This reads as a jacket.
 *
 * Hidden from assistive tech: wherever a Cover sits, a heading or a record
 * band beside it already says the title, and a screen reader should not hear
 * it twice.
 */
function TypeJacket({
  title,
  authors,
  scale,
}: Readonly<{ title: string; authors: string[]; scale: Scale }>) {
  const page = scale === "page";

  return (
    <div
      aria-hidden="true"
      className={`flex h-full w-full flex-col justify-between bg-paper-sunk ${
        page ? "gap-4 px-5 py-6 lg:px-7 lg:py-8" : "gap-3 px-3 py-4"
      }`}
    >
      {/* The headline step at the head of a frontispiece, holding 1.75rem
          until its column is wide enough for 2.25rem not to break a word. A
          cell takes the field step, the size a spine sets its title at, and
          hyphenates only a long word too wide for it — though browsers never
          hyphenate a capitalised word, so a title-case one still breaks
          bare. The favourites band, four
          across on a laptop, steps up to the headline, as its record band
          steps up from the shelf's. */}
      <span
        className={`font-semibold text-balance break-words ${
          page
            ? "text-[1.75rem] leading-none tracking-[-0.02em] lg:text-[2.25rem]"
            : `line-clamp-5 text-[1.375rem] leading-snug tracking-[-0.01em] hyphens-auto [hyphenate-limit-chars:12_5_5] ${
                scale === "band" ? "lg:text-[1.75rem] lg:leading-none lg:tracking-[-0.02em]" : ""
              }`
        }`}
      >
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

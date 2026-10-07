import Link from "next/link";

import { BandInk } from "./BandInk";
import { Cover } from "./Cover";
import { Jacket } from "./Place";
import { Rating } from "./Rating";
import { bandColor, readableOn } from "@/lib/color";
import { entryLabel } from "@/lib/diary";
import { bookPath } from "@/lib/client-safe";
import { cellDate } from "@/lib/slip-date";

export interface DiaryEntry {
  id: string;
  title: string;
  authors: string[];
  coverId: number | null;
  coverUrl: string | null;
  coverColor: string | null;
  sourceKey: string;
  /** Shelf category, e.g. "Science Fiction"; null when there is none. */
  category: string | null;
  rating: number | null;
  readAt: Date | null;
  isReread: boolean;
  hasReview: boolean;
  /** Logged since this reader last opened their diary. */
  isNew: boolean;
}

const FRAME = "flex flex-1 flex-col border border-rule bg-paper max-sm:border-0 max-sm:bg-transparent";

/**
 * One tri-band entry: colour band, jacket, record.
 *
 * The three bands are the whole system. A shelf of four and a shelf of four
 * hundred are the same designed object because this frame never varies.
 *
 * Linked, the whole cell opens its book page and draws its state as the
 * search result does, per the Printed State Rule: the border and the record
 * band's hairline go to ink, nothing fills. Unlinked — a signed-out visitor,
 * for whom the book page does not exist — it is inert.
 */
export function Entry({
  entry,
  linked = false,
  morph = false,
}: Readonly<{
  entry: DiaryEntry;
  linked?: boolean;
  /** This cell's jacket travels to the book page (one per book on a page). */
  morph?: boolean;
}>) {
  const band = bandColor(entry.coverColor, entry.sourceKey);
  const tone = readableOn(band);

  const cell = (
    <>
      {/* Band one: the book's own colour, flooded, carrying its author. */}
      <div className="max-sm:hidden">
      <BandInk isNew={entry.isNew} background={band} color={tone}>
        <span className="band-label truncate">
          {entry.authors[0] ?? "Unknown"}
        </span>
        {entry.isReread && (
          <span className="band-label shrink-0 opacity-80">Reread</span>
        )}
      </BandInk>
      </div>

      {/* Band two: the jacket, on paper. On a phone it floats on the night
          and glows in its own colour instead. */}
      <Jacket sourceKey={linked && morph ? entry.sourceKey : null}>
        <div className="m-jacket aspect-[2/3] overflow-hidden bg-paper-sunk">
          <Cover
            coverId={entry.coverId}
            coverUrl={entry.coverUrl}
            title={entry.title}
            authors={entry.authors}
          />
        </div>
      </Jacket>

      {/* Band three: the record. */}
      <div className="flex flex-1 flex-col gap-1.5 border-t border-rule px-2.5 py-2 transition-colors group-hover:border-ink group-focus-visible:border-ink max-sm:gap-1 max-sm:border-0 max-sm:px-0.5 max-sm:pt-3">
        <h3 className="text-[0.8125rem] leading-tight font-semibold text-balance max-sm:text-[0.9375rem] max-sm:tracking-[-0.01em]">
          {entry.title}
        </h3>
        <p className="m-only truncate text-[0.75rem] text-ink-soft">
          {entry.isReread ? "Reread · " : ""}
          {entry.authors[0] ?? "Unknown"}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          {entry.rating !== null ? (
            <Rating value={entry.rating} tone="currentColor" />
          ) : (
            <span className="text-[0.6875rem] text-ink-soft">Unrated</span>
          )}
          <time
            className="text-[0.6875rem] font-medium text-ink-soft"
            dateTime={entry.readAt?.toISOString().slice(0, 10)}
          >
            {cellDate(entry.readAt)}
          </time>
        </div>
      </div>
    </>
  );

  return (
    <article
      className="reveal flex flex-col"
      style={{ "--flood": band } as React.CSSProperties}
    >
      {linked ? (
        <Link
          href={bookPath(entry.sourceKey)}
          aria-label={entryLabel(entry)}
          // A shelf can hold hundreds of cells; prefetching every book page in
          // view would spend the free tier on pages nobody opened.
          prefetch={false}
          transitionTypes={["sheet-up"]}
          className={`press group ${FRAME} transition-colors hover:border-ink focus-visible:border-ink`}
        >
          {cell}
        </Link>
      ) : (
        <div className={FRAME}>{cell}</div>
      )}
    </article>
  );
}

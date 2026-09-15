import Link from "next/link";

import { BandInk } from "./BandInk";
import { Cover } from "./Cover";
import { Rating } from "./Rating";
import { bandColor, readableOn } from "@/lib/color";
import { entryLabel } from "@/lib/diary";
import { bookPath } from "@/lib/search";
import { cellDate } from "@/lib/slip-date";

export interface DiaryEntry {
  id: string;
  title: string;
  authors: string[];
  coverId: number | null;
  coverColor: string | null;
  olWorkKey: string;
  rating: number | null;
  readAt: Date | null;
  isReread: boolean;
  hasReview: boolean;
  /** Logged since this reader last opened their diary. */
  isNew: boolean;
}

const FRAME = "flex flex-1 flex-col border border-rule bg-paper";

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
}: Readonly<{ entry: DiaryEntry; linked?: boolean }>) {
  const band = bandColor(entry.coverColor, entry.olWorkKey);
  const tone = readableOn(band);

  const cell = (
    <>
      {/* Band one: the book's own colour, flooded, carrying its author. */}
      <BandInk isNew={entry.isNew} background={band} color={tone}>
        <span className="band-label truncate">
          {entry.authors[0] ?? "Unknown"}
        </span>
        {entry.isReread && (
          <span className="band-label shrink-0 opacity-80">Reread</span>
        )}
      </BandInk>

      {/* Band two: the jacket, on paper. */}
      <div className="aspect-[2/3] overflow-hidden bg-paper-sunk">
        <Cover
          coverId={entry.coverId}
          title={entry.title}
          authors={entry.authors}
        />
      </div>

      {/* Band three: the record. */}
      <div className="flex flex-1 flex-col gap-1.5 border-t border-rule px-2.5 py-2 transition-colors group-hover:border-ink group-focus-visible:border-ink">
        <h3 className="text-[0.8125rem] leading-tight font-semibold text-balance">
          {entry.title}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          {entry.rating !== null ? (
            <Rating value={entry.rating} tone="#16130f" />
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
    <article className="flex flex-col">
      {linked ? (
        <Link
          href={bookPath(entry.olWorkKey)}
          aria-label={entryLabel(entry)}
          // A shelf can hold hundreds of cells; prefetching every book page in
          // view would spend the free tier on pages nobody opened.
          prefetch={false}
          className={`group ${FRAME} transition-colors hover:border-ink focus-visible:border-ink`}
        >
          {cell}
        </Link>
      ) : (
        <div className={FRAME}>{cell}</div>
      )}
    </article>
  );
}

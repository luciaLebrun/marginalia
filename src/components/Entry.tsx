import { Cover } from "./Cover";
import { Rating } from "./Rating";
import { fallbackBand, readableOn } from "@/lib/color";

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
}

const MONTH = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
});

/**
 * One tri-band entry: colour band, jacket, record.
 *
 * The three bands are the whole system. A shelf of four and a shelf of four
 * hundred are the same designed object because this frame never varies.
 */
export function Entry({
  entry,
  index,
}: Readonly<{ entry: DiaryEntry; index: number }>) {
  const band = entry.coverColor ?? fallbackBand(entry.olWorkKey);
  const tone = readableOn(band);

  return (
    <article className="group flex flex-col border border-rule bg-paper">
      {/* Band one: the book's own colour, flooded, carrying its author. */}
      <div
        className="band-ink flex items-center justify-between gap-2 px-2.5 py-2"
        style={{
          background: band,
          color: tone,
          animationDelay: `${Math.min(index, 11) * 40}ms`,
        }}
      >
        <span className="band-label truncate">
          {entry.authors[0] ?? "Unknown"}
        </span>
        {entry.isReread && (
          <span className="band-label shrink-0 opacity-80">Reread</span>
        )}
      </div>

      {/* Band two: the jacket, on paper. */}
      <div className="aspect-[2/3] overflow-hidden bg-paper-sunk">
        <Cover
          coverId={entry.coverId}
          title={entry.title}
          authors={entry.authors}
        />
      </div>

      {/* Band three: the record. */}
      <div className="flex flex-1 flex-col gap-1.5 border-t border-rule px-2.5 py-2">
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
            {entry.readAt ? MONTH.format(entry.readAt) : "—"}
          </time>
        </div>
      </div>
    </article>
  );
}

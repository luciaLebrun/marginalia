import Link from "next/link";

import { LogSheet } from "./LogSheet";
import { Rating } from "./Rating";
import { describeReads, slipDate, type Read } from "@/lib/book-view";
import { INK } from "@/lib/color";
import { entryPath } from "@/lib/entry";

/**
 * The date slip: this reader's reads of the book, one ruled line each, closed
 * by the blank line the next read goes on.
 *
 * It says "your reads" and never "due": the object is borrowed from a library
 * book, the meaning is not. A read date is a value, so it is set at the field
 * step over the band voice, as every value in this world is.
 *
 * Each line is the way to that read's own page; the blank line is the log
 * sheet's summary, and a saved read comes back as a new line at the top.
 */
export function DateSlip({
  reads,
  bookId,
  username,
}: Readonly<{
  reads: Read[];
  bookId: string;
  /** Whose slip this is, so a line can address its own entry. */
  username: string;
}>) {
  return (
    <section aria-labelledby="date-slip-heading" className="mt-8 max-w-[34rem]">
      <div>
        <div className="flex items-baseline justify-between gap-4 bg-ink px-3 py-2.5 text-paper">
          <h2 id="date-slip-heading" className="band-label">
            Your reads
          </h2>
          <p className="band-label">{describeReads(reads.length)}</p>
        </div>

        {reads.length > 0 && (
          <ol>
            {reads.map((read) => (
              <SlipLine key={read.id} read={read} username={username} />
            ))}
          </ol>
        )}

        <LogSheet bookId={bookId} hasReads={reads.length > 0} />
      </div>
    </section>
  );
}

function SlipLine({ read, username }: Readonly<{ read: Read; username: string }>) {
  const date = slipDate(read.readAt);
  const valueClass = "text-[1.375rem] leading-snug font-semibold tracking-[-0.01em]";

  // Built from parts rather than nested templates: the line says the same
  // things a sighted reader sees on it, in the same order.
  const spoken = [
    date,
    read.rating === null ? "unrated" : `${read.rating} out of 5`,
    read.isReread ? "reread" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <li className="border-b border-rule">
      {/* The whole line is the link: hover and focus draw it in solid ink, as
          a search result does, and nothing fills. */}
      <Link
        href={entryPath(username, read.id)}
        aria-label={spoken}
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b-2 border-transparent px-3 py-3 transition-colors hover:border-ink focus-visible:border-ink"
      >
        {read.readAt ? (
          <time className={valueClass} dateTime={read.readAt.toISOString().slice(0, 10)}>
            {date}
          </time>
        ) : (
          // "Undated" is not a date, so it is not a <time>.
          <span className={`${valueClass} text-ink-soft`}>{date}</span>
        )}

        <span className="flex items-center gap-3">
          {read.isReread && <span className="band-label text-ink-soft">Reread</span>}
          {read.rating === null ? (
            <span className="text-[0.6875rem] font-medium text-ink-soft">Unrated</span>
          ) : (
            <Rating value={read.rating} tone={INK} />
          )}
        </span>
      </Link>
    </li>
  );
}

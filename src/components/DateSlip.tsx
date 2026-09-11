import { Rating } from "./Rating";
import { describeReads, slipDate, type Read } from "@/lib/book-view";
import { INK } from "@/lib/color";

/**
 * The date slip: this reader's reads of the book, one ruled line each, closed
 * by the blank line the next read goes on.
 *
 * It says "your reads" and never "due": the object is borrowed from a library
 * book, the meaning is not. A read date is a value, so it is set at the field
 * step over the band voice, as every value in this world is.
 */
export function DateSlip({ reads }: Readonly<{ reads: Read[] }>) {
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
              <SlipLine key={read.id} read={read} />
            ))}
          </ol>
        )}

        {/* The next line. Drawn and inert until the log sheet exists to deploy
            from it (MRG-016), so it is hidden from assistive tech rather than
            announced as a control that does nothing. */}
        <div aria-hidden="true" className="h-[3.25rem] border-b-2 border-rule" />
      </div>
    </section>
  );
}

function SlipLine({ read }: Readonly<{ read: Read }>) {
  const date = slipDate(read.readAt);
  const valueClass = "text-[1.375rem] leading-snug font-semibold tracking-[-0.01em]";

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-rule px-3 py-3">
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
    </li>
  );
}

import { LogSheet } from "./LogSheet";
import { SlipLines } from "./SlipLines";
import { describeReads, slipDate, type Read } from "@/lib/book-view";
import { entryPath } from "@/lib/entry";

/**
 * The date slip: this reader's reads of the book, one ruled line each, closed
 * by the blank line the next read goes on.
 *
 * It says "your reads" and never "due": the object is borrowed from a library
 * book, the meaning is not. A read date is a value, so it is set at the field
 * step over the band voice, as every value in this world is.
 *
 * Each line is the way to that read's own page, with its Edit at the end
 * (MRG-054); the blank line is the log sheet's summary, and a saved read comes
 * back as a new line at the top.
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
  // Worked out here, on the server: the lines are a client component, and the
  // helpers that address an entry live beside the database.
  const lines = reads.map((read) => ({
    ...read,
    href: entryPath(username, read.id),
    date: slipDate(read.readAt),
  }));

  return (
    <section aria-labelledby="date-slip-heading" className="mt-8 max-w-[34rem]">
      <div>
        <div className="flex items-baseline justify-between gap-4 bg-ink px-3 py-2.5 text-paper">
          {/* Focusable by script only: where focus returns after a removal. */}
          <h2 id="date-slip-heading" tabIndex={-1} className="band-label focus-visible:outline-paper">
            Your reads
          </h2>
          <p className="band-label">{describeReads(reads.length)}</p>
        </div>

        <SlipLines reads={lines} bookId={bookId} />

        <LogSheet bookId={bookId} hasReads={reads.length > 0} />
      </div>
    </section>
  );
}

import Link from "next/link";

import { Cover } from "./Cover";
import { Rating } from "./Rating";
import { authorLine, bookBand } from "@/lib/book-view";
import { PAPER } from "@/lib/color";
import { reviewParagraphs, type LogEntry } from "@/lib/entry";
import { bookPath } from "@/lib/client-safe";
import { slipDate } from "@/lib/slip-date";
import { handlePath } from "@/lib/username";

/**
 * One diary entry as a card from its reader, built out of the world's three
 * bands: the book's earned colour above, the stamp and the message in the
 * field, and the record band below carrying the handle and the way onward.
 *
 * The bands are what make it a card. Two columns alone left the paper between
 * them reading as a hole rather than as the card's own field.
 *
 * The colour is earned: this book is on the reader's shelf, or there would be
 * no entry to read.
 *
 * The stamp block leads — first at 390, the left column at 1440 — so the order
 * a pointer reads and the order the keyboard moves through are the same one.
 *
 * Renders from a stored entry alone: no network on this path.
 */
export function ReviewPostcard({
  entry,
  signedIn,
}: Readonly<{
  entry: LogEntry;
  /** The book page and the diary are signed-in only; a visitor is offered neither. */
  signedIn: boolean;
}>) {
  const { book, reader } = entry;
  const paragraphs = reviewParagraphs(entry.review);
  const band = bookBand(book, true);

  return (
    <article>
      {/* Band one: the book's own colour, carrying who wrote it. */}
      <div
        className="flex items-center justify-between gap-4 border-t-2 border-ink px-4 py-3 sm:px-6"
        style={{ background: band.background, color: band.color }}
      >
        <p className="band-label leading-[1.4]! text-balance">
          {authorLine(book.authors)}
        </p>
      </div>

      <div className="grid gap-8 px-4 py-6 sm:grid-cols-[min(20rem,32%)_minmax(0,34rem)] sm:gap-10 sm:px-6 sm:py-8">
        {/* The stamp block. */}
        <div>
          <div className="mx-auto w-3/5 max-w-[20rem] sm:mx-0 sm:w-full">
            <div className="aspect-[2/3] overflow-hidden border border-rule bg-paper-sunk">
              <Cover
                coverId={book.coverId}
                title={book.title}
                authors={book.authors}
                sizes="(min-width: 40rem) min(20rem, 32vw), 60vw"
                scale="page"
              />
            </div>
          </div>

          {/* The address. The author is on the band above, not repeated here. */}
          <h1 className="mt-4 text-[1.75rem] leading-none font-semibold tracking-[-0.02em] text-balance break-words">
            {signedIn ? (
              <Link
                href={bookPath(book.olWorkKey)}
                className="underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink"
              >
                {book.title}
              </Link>
            ) : (
              book.title
            )}
          </h1>
          {book.firstPublishYear && (
            <p className="mt-3 text-[0.6875rem] font-medium text-ink-soft">
              First published {book.firstPublishYear}
            </p>
          )}

          {/* The postmark: when it was read, and what it was worth. */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-ink px-3 py-2.5 text-paper">
            <span className="band-label">{slipDate(entry.readAt)}</span>
            <span className="flex items-center gap-3">
              {entry.isReread && <span className="band-label opacity-80">Reread</span>}
              {entry.rating === null ? (
                <span className="band-label opacity-80">Unrated</span>
              ) : (
                <Rating value={entry.rating} tone={PAPER} />
              )}
            </span>
          </div>
        </div>

        {/* The message, on the world's value measure so a line lands inside the
            65–75 characters prose wants. */}
        <div className="flex min-w-0 flex-col">
          {paragraphs.length > 0 ? (
            <div className="flex flex-col gap-4 text-[0.9375rem] leading-relaxed whitespace-pre-line">
              {paragraphs.map((paragraph) => (
                <p key={paragraph.key}>{paragraph.text}</p>
              ))}
            </div>
          ) : (
            // Every entry has a page, so an entry without words says so rather
            // than leaving the card blank.
            <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
              No review — {reader.name} logged this read without writing about it.
            </p>
          )}

          {/* The signature: who wrote it, and when they read it. */}
          <div className="mt-8 border-t border-rule pt-4">
            <Link
              href={handlePath(reader.username)}
              className="text-[1.375rem] leading-snug font-semibold tracking-[-0.01em] underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink"
            >
              {reader.name}
            </Link>
            <p className="band-label mt-2 text-ink-soft">@{reader.username}</p>
            {/* The condition is the absent date itself, not what the slip
                happens to call it — rewording the slip must not silently
                rewrite the signature. */}
            <p className="mt-2 text-[0.6875rem] font-medium text-ink-soft">
              Read {entry.readAt === null ? "at some point" : slipDate(entry.readAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Band three: the record. Whose diary this is, and the way back into
          your own — a page with no way onward is a dead end. */}
      <div className="flex items-center justify-between gap-4 bg-ink px-4 py-3 text-paper sm:px-6">
        <p className="band-label">@{reader.username}</p>
        {signedIn && (
          <Link
            href="/"
            // The global focus ring is ink, which vanishes on this band.
            className="band-label underline decoration-paper/40 underline-offset-4 transition-colors hover:decoration-paper focus-visible:outline-paper"
          >
            Your diary
          </Link>
        )}
      </div>
    </article>
  );
}

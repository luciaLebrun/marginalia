import Link from "next/link";

import { Cover } from "./Cover";
import { DateSlip } from "./DateSlip";
import type { Book } from "@/db/schema";
import {
  authorLine,
  bookBand,
  descriptionParagraphs,
  imprintRows,
  type Read,
} from "@/lib/book-view";

/**
 * A book, opened: its title page, and the slip of this reader's reads.
 *
 * The tri-band frame at page scale. Band one carries the author and wears the
 * book's colour only once the book is on this reader's shelf. The field is the
 * jacket as frontispiece facing the title page. The record is the date slip,
 * set on the title page itself, straight under the imprint.
 *
 * Renders from a stored row and nothing else — no network on this path.
 */
export function BookTitlePage({
  book,
  reads,
  diaryHref = "/",
}: Readonly<{
  book: Book;
  reads: Read[];
  /** The dev harness points this at its own shelf. */
  diaryHref?: string;
}>) {
  const band = bookBand(book, reads.length > 0);
  const paragraphs = descriptionParagraphs(book.description);

  return (
    <article>
      <AuthorBand text={authorLine(book.authors)} band={band} diaryHref={diaryHref} />

      {/* The jacket's column is sized to the jacket, so the title page faces
          it across one gap rather than across the dead half of a third. */}
      <div className="grid gap-6 px-4 pt-6 pb-10 sm:grid-cols-[min(24rem,33%)_minmax(0,1fr)] sm:gap-10 sm:px-6 sm:pt-8">
        <div className="mx-auto w-3/5 max-w-[24rem] sm:mx-0 sm:w-full">
          <div className="aspect-[2/3] overflow-hidden border border-rule bg-paper-sunk">
            <Cover
              coverId={book.coverId}
              title={book.title}
              authors={book.authors}
              sizes="(min-width: 40rem) min(24rem, 33vw), 60vw"
              scale="page"
            />
          </div>
        </div>

        {/* Every block in this column hangs on one 34rem edge, the title
            included, so the title page reads as a single set measure — a long
            title wraps rather than running past the imprint. */}
        <div className="flex min-w-0 flex-col">
          <h1 className="max-w-[34rem] text-[2.25rem] leading-[0.95] font-semibold tracking-[-0.02em] text-balance break-words sm:text-[3.5rem]">
            {book.title}
          </h1>

          {book.subtitle && (
            // The field step at 500 in soft ink, as the masthead's reading
            // span is: supporting the title, never competing with it.
            <p className="mt-3 max-w-[34rem] text-[1.375rem] leading-snug font-medium tracking-[-0.01em] text-balance text-ink-soft">
              {book.subtitle}
            </p>
          )}

          <dl className="mt-6 max-w-[34rem] border-t border-rule">
            {imprintRows(book).map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5"
              >
                <dt className="band-label text-ink-soft">{row.label}</dt>
                <dd className="text-[0.9375rem] font-medium">
                  {row.href ? (
                    <a
                      href={row.href}
                      className="underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink"
                    >
                      {row.value}
                    </a>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            ))}
          </dl>

          {/* Before the description, not after it: the reads and the line the
              next one goes on are the task, and a long blurb must not push
              them out of the first viewport on either device. */}
          <DateSlip reads={reads} bookId={book.id} />

          {paragraphs.length > 0 && (
            <div className="mt-8 flex max-w-[34rem] flex-col gap-3 text-[0.9375rem] leading-relaxed text-ink-soft">
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Band one. Its ground is ink or the book's colour, so its foreground and its
 * focus ring both come from the contrast helper: the global ring is ink, which
 * vanishes on ink, and a fixed paper ring would vanish on a pale jacket.
 */
function AuthorBand({
  text,
  band,
  diaryHref,
}: Readonly<{
  text: string;
  band: { background: string; color: string };
  diaryHref: string;
}>) {
  return (
    <div
      // A 2px ink rule — the world's ruled-line weight — between this band and
      // the wordmark's. A fallback band can be the very same orange, and over a
      // hairline the two read as one block rather than as two bands.
      className="flex items-center justify-between gap-4 border-t-2 border-ink px-4 py-3 sm:px-6"
      style={
        {
          background: band.background,
          color: band.color,
          "--band-tone": band.color,
        } as React.CSSProperties
      }
    >
      {/* A two-author line wraps at 390, so it takes real leading and balanced
          lines rather than the band voice's line-height of 1. */}
      <p className="band-label leading-[1.4]! text-balance">{text}</p>
      <Link
        href={diaryHref}
        className="band-label shrink-0 underline underline-offset-4 transition-colors [text-decoration-color:color-mix(in_srgb,var(--band-tone)_40%,transparent)] hover:[text-decoration-color:var(--band-tone)] focus-visible:[outline-color:var(--band-tone)]"
      >
        Your diary
      </Link>
    </div>
  );
}

import Link from "next/link";
import { Fragment } from "react";

import { Cover } from "./Cover";
import { DateSlip } from "./DateSlip";
import { FavouriteToggle } from "./FavouriteToggle";
import type { FavouriteState, ToReadState } from "@/app/actions";
import { ToReadToggle } from "./ToReadToggle";
import type { Book } from "@/db/schema";
import {
  authorLine,
  bookBand,
  descriptionParagraphs,
  displaySubtitle,
  imprintRows,
  sourceRecord,
  type OwnCopy,
  type Read,
} from "@/lib/book-view";
import { bookPath } from "@/lib/client-safe";
import { authorSearchHref } from "@/lib/search";

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
  onToRead = false,
  favourite = { isFavourite: false, full: false, position: -1, count: 0 },
  ownCopy = null,
  username,
  diaryHref = "/",
  searchHref,
  searchAction = "/search",
  toReadAction,
  favouriteAction,
  favouriteMoveAction,
}: Readonly<{
  book: Book;
  reads: Read[];
  /** Whether this book is on the reader's to-read list. */
  onToRead?: boolean;
  /** Whether this book is one of the reader's favourites, and whether four already are. */
  favourite?: { isFavourite: boolean; full: boolean; position: number; count: number };
  /** Another row of this same book the reader already has (MRG-107). */
  ownCopy?: OwnCopy | null;
  /** The reader's handle, so each read on the slip can address its own page. */
  username: string;
  /** The dev harness points this at its own shelf. */
  diaryHref?: string;
  /** The search this book was opened from, when it was (MRG-086). */
  searchHref?: string;
  /** Where an author's name searches; the dev harness points it at its own. */
  searchAction?: string;
  /** The dev harness's session-free stand-ins for the to-read action… */
  toReadAction?: (previous: ToReadState, form: FormData) => Promise<ToReadState>;
  /** …the favourite action… */
  favouriteAction?: (previous: FavouriteState, form: FormData) => Promise<FavouriteState>;
  /** …and for moving a favourite earlier or later. */
  favouriteMoveAction?: (form: FormData) => Promise<void>;
}>) {
  const band = bookBand(book, reads.length > 0);
  const paragraphs = descriptionParagraphs(book.description);
  const subtitle = displaySubtitle(book.subtitle);

  return (
    <article>
      <AuthorBand
        authors={book.authors}
        band={band}
        diaryHref={diaryHref}
        searchAction={searchAction}
        searchHref={searchHref}
      />

      {/* The jacket's column is sized to the jacket, so the title page faces
          it across one gap rather than across the dead half of a third. */}
      <div className="grid gap-6 px-4 pt-6 pb-10 sm:grid-cols-[min(24rem,33%)_minmax(0,1fr)] sm:gap-10 sm:px-6 sm:pt-8">
        <div className="mx-auto w-3/5 max-w-[24rem] sm:mx-0 sm:w-full">
          <div className="aspect-[2/3] overflow-hidden border border-rule bg-paper-sunk">
            <Cover
              coverId={book.coverId}
                coverUrl={book.coverUrl}
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

          {subtitle && (
            // The field step at 500 in soft ink, as the masthead's reading
            // span is: supporting the title, never competing with it.
            <p className="mt-3 max-w-[34rem] text-[1.375rem] leading-snug font-medium tracking-[-0.01em] text-balance text-ink-soft">
              {subtitle}
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

          {ownCopy && <OwnCopyNotice copy={ownCopy} />}

          {/* Before the description, not after it: the reads and the line the
              next one goes on are the task, and a long blurb must not push
              them out of the first viewport on either device. */}
          {/* Keyed on the read count, so a logged read — which takes the book
              off the list — re-renders the control fresh. Not on the stored
              state: the control's own press changes that, and remounting it
              then would drop keyboard focus to the page (MRG-074). */}
          <ToReadToggle key={`to-read-${reads.length}`} bookId={book.id} saved={onToRead} action={toReadAction} />

          <DateSlip reads={reads} bookId={book.id} username={username} />

          {/* Only a read book may be a favourite, so the control arrives with
              the first read on the slip. Keyed on the read count, as Want to
              Read is, so removing a read re-renders it fresh. */}
          {reads.length > 0 && (
            <FavouriteToggle
              key={`favourite-${reads.length}`}
              bookId={book.id}
              favourite={favourite.isFavourite}
              full={favourite.full}
              position={favourite.position}
              count={favourite.count}
              moveAction={favouriteMoveAction}
              diaryHref={diaryHref}
              action={favouriteAction}
            />
          )}

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
  authors,
  band,
  diaryHref,
  searchHref,
  searchAction,
}: Readonly<{
  authors: readonly string[];
  band: { background: string; color: string };
  diaryHref: string;
  searchHref?: string;
  searchAction: string;
}>) {
  const names = authors.map((name) => name.trim()).filter(Boolean);
  // authorLine's wording, with each named author a link (MRG-090): the author
  // line of the split search, so the scoped search stays strict.
  const link = (name: string) => (
    <Link
      href={authorSearchHref(name, searchAction)}
      className="inline-block leading-none underline underline-offset-4 transition-colors [text-decoration-color:color-mix(in_srgb,var(--band-tone)_40%,transparent)] hover:[text-decoration-color:var(--band-tone)] focus-visible:[outline-color:var(--band-tone)]"
    >
      {name}
    </Link>
  );
  const shown = names.length > 3 ? names.slice(0, 2) : names;
  const text = authorLine(authors);
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
          lines rather than the band voice's line-height of 1. 1.75, not 1.4,
          and leading-none on each link: the 2px ring sits 2px out, so on a
          wrapped second line it must clear the first line's underline. */}
      <p className="band-label leading-[1.75]! text-balance">
        {names.length === 0 ? (
          text
        ) : (
          <>
            {shown.map((name, i) => (
              // A name can repeat in the data, so it carries its occurrence.
              <Fragment key={`${name}#${shown.slice(0, i).filter((n) => n === name).length}`}>
                {i > 0 && (i === shown.length - 1 && names.length <= 3 ? " and " : ", ")}
                {link(name)}
              </Fragment>
            ))}
            {names.length > 3 && ` and ${names.length - 2} others`}
          </>
        )}
      </p>
      <nav aria-label="Ways back" className="flex shrink-0 flex-row gap-4">
        {searchHref && (
          <Link href={searchHref} className="band-label shrink-0 underline underline-offset-4 transition-colors [text-decoration-color:color-mix(in_srgb,var(--band-tone)_40%,transparent)] hover:[text-decoration-color:var(--band-tone)] focus-visible:[outline-color:var(--band-tone)]">
            Your search
          </Link>
        )}
        <Link href={diaryHref} className="band-label shrink-0 underline underline-offset-4 transition-colors [text-decoration-color:color-mix(in_srgb,var(--band-tone)_40%,transparent)] hover:[text-decoration-color:var(--band-tone)] focus-visible:[outline-color:var(--band-tone)]">
          Your diary
        </Link>
      </nav>
    </div>
  );
}

/**
 * The same book already on this reader's shelf under another row (MRG-107).
 * A soft-ink sentence on the title page's measure, as the favourites line is:
 * it warns and never refuses, so no band and no alarm. Logging stays open.
 */
function OwnCopyNotice({ copy }: Readonly<{ copy: OwnCopy }>) {
  const source = sourceRecord(copy.sourceKey).name;
  return (
    <p className="mt-4 max-w-[34rem] text-[0.8125rem] leading-snug text-ink-soft">
      {copy.kind === "read"
        ? `You’ve already logged this book from ${source}.`
        : `This book is already on your to-read list, from ${source}.`}{" "}
      <Link
        href={bookPath(copy.sourceKey)}
        className="underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink"
      >
        Open your {source} copy
      </Link>
      .
    </p>
  );
}

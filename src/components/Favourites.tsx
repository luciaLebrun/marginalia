import Link from "next/link";

import { ArrangeFavourites } from "./ArrangeFavourites";
import { Cover } from "./Cover";
import { bandColor, readableOn } from "@/lib/color";
import { bookPath } from "@/lib/client-safe";
import type { FavouriteBook } from "@/lib/favourites";

const MAX = 4;

/**
 * A reader's favourites (MRG-071): up to four books they have read, in the
 * order they set, between the masthead and the shelf.
 *
 * The same tri-band cell as the shelf at a larger scale — four across where the
 * shelf runs six — so the band reads as a statement drawn from the shelf, not
 * a second list. Every favourite is a logged book, so every band wears its
 * earned colour. The grid always holds four positions, and an empty one is a
 * hairline frame, so room for another shows the way a partial shelf row does.
 *
 * Arranging is the owner's, on their own diary only — drag and drop, or Alt
 * and an arrow key (ArrangeFavourites); the public profile shows the order and
 * nothing to change it with.
 */
export function Favourites({
  books,
  arrange = false,
  linkBooks = true,
  hint = false,
  moveAction,
}: Readonly<{
  books: FavouriteBook[];
  /** The owner on their own diary: arranged by drag and drop, or Alt + arrows. */
  arrange?: boolean;
  /** False for a signed-out visitor: the book page is signed-in only. */
  linkBooks?: boolean;
  /** With no favourites yet, say how to add one (the owner, once they have read something). */
  hint?: boolean;
  /** The diary harness's session-free stand-in for the move action. */
  moveAction?: (form: FormData) => Promise<void>;
}>) {
  if (books.length === 0 && !hint) return null;

  return (
    <section aria-labelledby="favourites" className="flex flex-col gap-3 px-4 pt-6 pb-4 sm:px-6">
      <div className="flex items-baseline justify-between gap-4 border-y border-ink bg-paper-sunk px-3 py-2">
        <h2
          id="favourites"
          className="text-[1.75rem] leading-none font-semibold tracking-[-0.02em] sm:text-[2.25rem]"
        >
          Favourites
        </h2>
        <span className="band-label text-ink-soft">
          {arrange ? `${books.length} of ${MAX}` : publicCount(books.length)}
        </span>
      </div>

      {books.length === 0 && (
        <p className="max-w-[38rem] text-[0.9375rem] leading-relaxed text-ink-soft">
          Up to four books you’ve read, in the order you choose. Open one from your shelf and
          add it from its page.
        </p>
      )}

      {books.length > 0 && arrange && (
        <ArrangeFavourites
          max={MAX}
          action={moveAction}
          items={books.map((book) => ({
            bookId: book.bookId,
            title: book.title,
            cell: (
              <FavouriteCell book={book} linked={linkBooks} describedBy="favourites-arrange-hint" />
            ),
          }))}
        />
      )}

      {books.length > 0 && !arrange && (
        <ol className="favourites-grid">
          {books.map((book) => (
            <li key={book.bookId} className="flex flex-col">
              <FavouriteCell book={book} linked={linkBooks} />
            </li>
          ))}
          {/* Room for another, drawn the way a partial shelf row is: an empty
              position in a hairline frame, never a blank. */}
          {Array.from({ length: MAX - books.length }, (_, i) => (
            <li key={`empty-${i}`} aria-hidden="true" className="flex flex-col">
              <div className="flex-1 border border-rule" />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

const FRAME = "flex flex-1 flex-col border border-rule bg-paper";

/** A shelf cell at favourite scale: colour, jacket, and the title as its record. */
function FavouriteCell({
  book,
  linked,
  describedBy,
}: Readonly<{ book: FavouriteBook; linked: boolean; describedBy?: string }>) {
  const band = bandColor(book.coverColor, book.sourceKey);
  const author = book.authors[0] ?? "Unknown";

  const cell = (
    <>
      <div className="flex px-2.5 py-2" style={{ background: band, color: readableOn(band) }}>
        <span className="band-label truncate">{author}</span>
      </div>
      <div className="aspect-[2/3] overflow-hidden bg-paper-sunk">
        <Cover coverId={book.coverId} coverUrl={book.coverUrl} title={book.title} authors={book.authors} />
      </div>
      <div className="flex-1 border-t border-rule px-2.5 py-2 transition-colors group-hover:border-ink group-focus-visible:border-ink">
        <h3 className="text-[0.9375rem] leading-tight font-semibold text-balance">{book.title}</h3>
      </div>
    </>
  );

  return linked ? (
    <Link
      href={bookPath(book.sourceKey)}
      aria-label={`${book.title}, ${author}`}
      aria-describedby={describedBy}
      prefetch={false}
      className={`group ${FRAME} transition-colors hover:border-ink focus-visible:border-ink`}
    >
      {cell}
    </Link>
  ) : (
    <div className={FRAME}>{cell}</div>
  );
}

function publicCount(count: number): string {
  return `${count} ${count === 1 ? "book" : "books"}`;
}

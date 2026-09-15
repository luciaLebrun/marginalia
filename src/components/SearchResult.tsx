import Link from "next/link";

import { Cover } from "./Cover";
import type { BookSummary } from "@/lib/books";
import { bookPath } from "@/lib/search";

/**
 * One search result: the entry's tri-band frame with the colour withheld.
 *
 * On the shelf, the top band floods with a colour taken from the book's own
 * jacket, and that colour means "a book you read". A result is not on anyone's
 * shelf yet, so its band is ink. It also means a book never changes colour at
 * the moment it is logged — the jacket colour is only extracted on upsert, so a
 * result showing its hash fallback would jump to another colour on the shelf.
 *
 * Hover and focus draw state as a printed mark, per DESIGN.md's Printed State
 * Rule: the hairlines go to solid ink, and nothing is filled — sunk paper
 * means "awaiting the next keystroke" in this world, not "pointed at".
 */
export function SearchResult({ book }: Readonly<{ book: BookSummary }>) {
  const author = book.authors[0];
  const year = book.firstPublishYear;

  // The cell reads as band, jacket and record; a screen reader gets one
  // sentence instead of the author twice (band, then the jacket's alt text).
  const label = [
    book.title,
    author && `by ${author}`,
    year && `first published ${year}`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    // Stretched to the row, so the year pins to one baseline across a row
    // where one title runs to two lines.
    <li className="self-stretch">
      <Link
        href={bookPath(book.olWorkKey)}
        aria-label={label}
        // Opening a book copies it into our database (MRG-014). Prefetching
        // would do that for every result in view, not the one the reader chose.
        prefetch={false}
        className="group flex h-full flex-col border border-rule bg-paper transition-colors hover:border-ink focus-visible:border-ink"
      >
        {/* Band one: ink, not colour — this book is not on the shelf yet. */}
        <div className="flex bg-ink px-2.5 py-2 text-paper">
          <span className="band-label truncate">
            {author ?? "Author unknown"}
          </span>
        </div>

        {/* Band two: the jacket, or its typographic stand-in. */}
        <div className="aspect-[2/3] overflow-hidden bg-paper-sunk">
          <Cover
            coverId={book.coverId ?? null}
            title={book.title}
            authors={book.authors}
          />
        </div>

        {/* Band three: the record — what is known before anyone has read it. */}
        <div className="flex flex-1 flex-col gap-1.5 border-t border-rule px-2.5 py-2 transition-colors group-hover:border-ink group-focus-visible:border-ink">
          <h2 className="text-[0.8125rem] leading-tight font-semibold text-balance">
            {book.title}
          </h2>
          <p className="mt-auto pt-1 text-[0.6875rem] font-medium text-ink-soft">
            {year ?? "—"}
          </p>
        </div>
      </Link>
    </li>
  );
}

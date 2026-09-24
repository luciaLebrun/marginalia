import { Entry, type DiaryEntry } from "./Entry";
import { LogCell } from "./LogCell";
import { YearRule } from "./YearRule";
import Link from "next/link";

import { groupShelf, type ShelfOrder } from "@/lib/diary";

/**
 * The shelf.
 *
 * Hairlines come from each cell's own border; the container carries ruled
 * column lines so the unfilled positions in a partial row read as a printed
 * signature rather than as a hole. Two columns at 360, six at 1440, whole-cell
 * repack, chronology running down. See .shelf-grid in globals.css.
 */
export function Shelf({
  entries,
  by = "year",
  path,
  canLog = true,
  linkBooks = true,
  readerName,
}: Readonly<{
  entries: DiaryEntry[];
  /** How the shelf is grouped (MRG-072), from the page's `?by=`. */
  by?: ShelfOrder;
  /** This page's path, which the order links point back at. */
  path: string;
  /** False on someone else's profile: the action is not yours to take. */
  canLog?: boolean;
  /** False for a signed-out visitor: the book page is signed-in only. */
  linkBooks?: boolean;
  /** Whose shelf this is, for the empty state on a public profile. */
  readerName?: string;
}>) {
  if (entries.length === 0) {
    return canLog ? <EmptyShelf /> : <EmptyProfile name={readerName} />;
  }

  const groups = groupShelf(entries, by);

  return (
    <div className="flex flex-col gap-6 px-4 py-6 sm:px-6">
      <ShelfOrderLine by={by} path={path} />
      <div className="flex flex-col gap-10">
        {groups.map((group, groupIndex) => (
          <section key={`${group.rest ? "rest" : "group"}:${group.label}`} className="flex flex-col gap-3">
            <YearRule
              year={group.label}
              count={group.entries.length}
              rest={group.rest}
            />
            <div className="shelf-grid">
              {/* Capture belongs to the chronology. Author and Category are
                  for looking back, so they show books alone. */}
              {groupIndex === 0 && canLog && by === "year" && <LogCell />}
              {group.entries.map((entry) => (
                <Entry key={entry.id} entry={entry} linked={linkBooks} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

const ORDER_LABELS: Record<ShelfOrder, string> = {
  year: "Year",
  author: "Author",
  category: "Category",
};

/**
 * "Shelved by Year · Author · Category" (MRG-072): three Text Buttons on the
 * page margin. Plain links carrying `?by=`, so the order works without script
 * and a sorted shelf can be shared; `scroll={false}` keeps the reader where
 * they were. The current order's underline is 2px ink, so a hovered one (1px ink) never reads as current.
 */
function ShelfOrderLine({ by, path }: Readonly<{ by: ShelfOrder; path: string }>) {
  return (
    <nav aria-label="Shelf order" className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
      <span className="band-label text-ink-soft">Shelved by</span>
      {(Object.keys(ORDER_LABELS) as ShelfOrder[]).map((order) => (
        <Link
          key={order}
          href={order === "year" ? path : `${path}?by=${order}`}
          scroll={false}
          prefetch={false}
          aria-current={order === by ? "true" : undefined}
          className="band-label underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink aria-[current]:decoration-ink aria-[current]:decoration-2"
        >
          {ORDER_LABELS[order]}
        </Link>
      ))}
    </nav>
  );
}

/**
 * The empty shelf is one full-width tri-band cell that IS the action.
 *
 * PRODUCT.md records that the database is empty, so this is the state a real
 * reader meets on day one — it is the surface, not an edge case. The contract
 * refuses "a blank page with a button", so the guidance lives inside the
 * cell's own record band rather than as a paragraph stranded above it.
 */
/**
 * Someone else's empty shelf. It states the fact and offers nothing — the
 * action here belongs to its owner, not to the visitor.
 */
function EmptyProfile({ name }: Readonly<{ name?: string }>) {
  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="border-y border-ink bg-paper-sunk px-3 py-4">
        <p className="band-label text-ink-soft">
          {name ? `${name} has not logged a book yet` : "Nothing logged yet"}
        </p>
      </div>
    </div>
  );
}

function EmptyShelf() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="shelf-grid max-w-[24rem] !grid-cols-1">
        <LogCell emphatic />
      </div>
    </div>
  );
}

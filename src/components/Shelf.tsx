import { Entry, type DiaryEntry } from "./Entry";
import { LogCell } from "./LogCell";
import { YearRule } from "./YearRule";
import { groupByYear } from "@/lib/diary";

/**
 * The shelf.
 *
 * Hairlines come from each cell's own border; the container carries ruled
 * column lines so the unfilled positions in a partial row read as a printed
 * signature rather than as a hole. Two columns at 360, six at 1440, whole-cell
 * repack, chronology running down. See .shelf-grid in globals.css.
 */
export function Shelf({ entries }: Readonly<{ entries: DiaryEntry[] }>) {
  if (entries.length === 0) return <EmptyShelf />;

  const groups = groupByYear(entries);

  return (
    <div className="flex flex-col gap-10 px-4 py-6 sm:px-6">
      {groups.map((group, groupIndex) => (
        <section key={group.year} className="flex flex-col gap-3">
          <YearRule year={group.year} count={group.entries.length} />
          <div className="shelf-grid">
            {groupIndex === 0 && <LogCell />}
            {group.entries.map((entry) => (
              <Entry key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      ))}
    </div>
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
function EmptyShelf() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="shelf-grid max-w-[24rem] !grid-cols-1">
        <LogCell emphatic />
      </div>
    </div>
  );
}

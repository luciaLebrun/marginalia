import { Entry, type DiaryEntry } from "./Entry";
import { LogCell } from "./LogCell";
import { YearRule } from "./YearRule";
import { groupByYear } from "@/lib/diary";

/**
 * The grid. Two columns at 360px, six at 1440px, whole-cell repack.
 *
 * The empty shelf is not a special screen — it is this same grid holding one
 * cell, which happens to be the action. That is why the "log a book" cell lives
 * in the grid rather than in a toolbar.
 */
const GRID =
  "grid grid-cols-2 gap-px bg-rule sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6";

export function Shelf({ entries }: { entries: DiaryEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="px-4 py-6 sm:px-6">
        <div className="max-w-[34rem]">
          <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
            Nothing logged yet. When you finish a book, add it here with the
            date you finished and, if you want, a rating and a few words.
          </p>
        </div>
        <div className="mt-5 grid max-w-[16rem] grid-cols-1">
          <LogCell emphatic />
        </div>
      </div>
    );
  }

  const groups = groupByYear(entries);
  let rendered = 0;

  return (
    <div className="flex flex-col gap-8 px-4 py-6 sm:px-6">
      {groups.map((group, groupIndex) => (
        <section key={group.year} className="flex flex-col gap-3">
          <YearRule year={group.year} count={group.entries.length} />
          <div className={GRID}>
            {groupIndex === 0 && <LogCell />}
            {group.entries.map((entry) => (
              <Entry key={entry.id} entry={entry} index={rendered++} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

import { notFound } from "next/navigation";

import { getDevReader, NoDevReader } from "@/app/dev/dev-reader";
import { BottomBar } from "@/components/BottomBar";
import { Favourites } from "@/components/Favourites";
import { NowReading } from "@/components/NowReading";
import { MarkSeen } from "@/components/MarkSeen";
import { Masthead } from "@/components/Masthead";
import { Shelf } from "@/components/Shelf";
import { getDiary, getDiaryCount, parseShelfOrder, readingSpan } from "@/lib/diary";
import { getFavourites } from "@/lib/favourites";
import { moveDevFavouriteAction } from "./actions";

/**
 * Development harness for the diary surface.
 *
 * The real page at `/` is behind Google OAuth, which cannot be driven
 * headlessly, so this renders the same components against the seeded dev user
 * (`pnpm seed:dev`). It exists so UI work can be inspected at real breakpoints
 * with real cover art.
 *
 * It 404s outside development. It reads one hard-coded local user and has no
 * session; `?favourites=none|four` overrides the favourites it draws, and
 * `?coverless=1` strips the jacket from the first book on the shelf and in the
 * band, since the seed holds no coverless book — both render only. Its one
 * mutation is arranging that user's favourites, through an action that
 * refuses in production (./actions.ts).
 */
export default async function DevShelfPage({ searchParams }: PageProps<"/dev/shelf">) {
  if (process.env.NODE_ENV === "production") notFound();

  const user = await getDevReader();
  if (!user) return <NoDevReader />;

  const [diary, count, stored] = await Promise.all([
    getDiary(user.id, true),
    getDiaryCount(user.id),
    getFavourites(user.id),
  ]);

  // `?favourites=none` draws the owner's hint; `?favourites=four` a full band
  // from the first four books on the shelf. Both are render-only: they write
  // nothing, and arranging them moves nothing.
  const { favourites: override, by, coverless } = await searchParams;
  const bare = <T,>(books: T[]) =>
    coverless === "1"
      ? books.map((book, i) => (i ? book : { ...book, coverId: null, coverUrl: null }))
      : books;
  const entries = bare(diary);
  let favourites = stored;
  if (override === "none") favourites = [];
  if (override === "four") {
    const seen = new Set<string>();
    favourites = entries
      .filter((entry) => !seen.has(entry.sourceKey) && seen.add(entry.sourceKey))
      .slice(0, 4)
      .map((entry) => ({ ...entry, bookId: entry.sourceKey }));
  }

  return (
    <>
    <main className="flex-1">
      <NowReading name={user.name} count={count} span={readingSpan(entries)} latest={entries[0] ?? null} />
      <div className="m-hidden">
        <Masthead name={user.name} span={readingSpan(entries)} count={count} />
      </div>
      <Favourites
        books={bare(favourites)}
        arrange
        hint={count > 0}
        moveAction={moveDevFavouriteAction}
      />
      <Shelf entries={entries} by={parseShelfOrder(by)} path="/dev/shelf" heroKey={entries[0]?.sourceKey} />
      <MarkSeen userId={user.id} />
    </main>
    <BottomBar />
    </>
  );
}

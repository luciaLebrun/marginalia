import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { BottomBar } from "@/components/BottomBar";
import { Favourites } from "@/components/Favourites";
import { MarkSeen } from "@/components/MarkSeen";
import { Masthead } from "@/components/Masthead";
import { NowReading } from "@/components/NowReading";
import { Place } from "@/components/Place";
import { Shelf } from "@/components/Shelf";
import { SignInDoor } from "@/components/SignInDoor";
import { WordmarkBand } from "@/components/WordmarkBand";
import { getAuth } from "@/lib/auth";
import { getDiary, getDiaryCount, parseShelfOrder, readingSpan } from "@/lib/diary";
import { getFavourites } from "@/lib/favourites";

export default async function DiaryPage({ searchParams }: PageProps<"/">) {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session) return <SignedOut />;

  // A reader without a handle has no address for their diary, so claiming one
  // comes before anything else they can do here.
  if (!session.user.username) redirect("/claim");

  const [entries, count, favourites] = await Promise.all([
    getDiary(session.user.id, true),
    getDiaryCount(session.user.id),
    getFavourites(session.user.id),
  ]);

  const span = readingSpan(entries);
  const latest = entries[0] ?? null;

  return (
    <>
    <Place>
    <main className="flex-1">
      <NowReading name={session.user.name} count={count} span={span} latest={latest} />
      <div className="m-hidden">
        <Masthead name={session.user.name} span={span} count={count} />
      </div>
      {/* The hint waits for a first read: before that there is nothing that
          could be a favourite, and the empty shelf's one action is to log. */}
      <Favourites books={favourites} arrange hint={count > 0} />
      <Shelf
        entries={entries}
        by={parseShelfOrder((await searchParams).by)}
        path="/"
        heroKey={latest?.sourceKey}
      />
      <MarkSeen userId={session.user.id} />
    </main>
    </Place>
    <BottomBar />
    </>
  );
}

/**
 * The door, for anyone without a session. The tri-band cell is the whole
 * surface: there is nothing to browse here until you are through it.
 */
function SignedOut() {
  return (
    <main className="flex flex-1 flex-col">
      <WordmarkBand />
      {/* The door is the only thing on this page, so it sits in the middle of
          what is left rather than in the corner of it. */}
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
        <SignInDoor />
      </div>
    </main>
  );
}

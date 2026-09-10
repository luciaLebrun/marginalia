import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { MarkSeen } from "@/components/MarkSeen";
import { Masthead } from "@/components/Masthead";
import { Shelf } from "@/components/Shelf";
import { SignInDoor } from "@/components/SignInDoor";
import { WordmarkBand } from "@/components/WordmarkBand";
import { getAuth } from "@/lib/auth";
import { getDiary, getDiaryCount, readingSpan } from "@/lib/diary";

export default async function DiaryPage() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session) return <SignedOut />;

  // A reader without a handle has no address for their diary, so claiming one
  // comes before anything else they can do here.
  if (!session.user.username) redirect("/claim");

  const [entries, count] = await Promise.all([
    getDiary(session.user.id, session.user.lastSeenAt ?? null),
    getDiaryCount(session.user.id),
  ]);

  return (
    <main className="flex-1">
      <Masthead
        name={session.user.name}
        span={readingSpan(entries)}
        count={count}
      />
      <Shelf entries={entries} />
      <MarkSeen userId={session.user.id} />
    </main>
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

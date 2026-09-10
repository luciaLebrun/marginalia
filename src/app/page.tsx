import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { MarkSeen } from "@/components/MarkSeen";
import { Masthead } from "@/components/Masthead";
import { Shelf } from "@/components/Shelf";
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
 * Placeholder until the sign-in surface is built (MRG-033). Deliberately plain
 * — inventing a landing page here would set a second visual world before the
 * one this build establishes has shipped.
 */
function SignedOut() {
  return (
    <main className="flex flex-1 items-center px-4 py-16 sm:px-6">
      <div className="max-w-[38rem]">
        <p className="band-label mb-4 inline-block bg-band-fiction px-2.5 py-2 text-paper">
          Marginalia
        </p>
        <h1 className="text-[2rem] leading-[1.05] font-semibold tracking-tight text-balance sm:text-[2.75rem]">
          A reading diary.
        </h1>
        <p className="mt-4 max-w-[34rem] text-[0.9375rem] leading-relaxed text-ink-soft">
          Log a book you have finished, rate it, write about it. Marginalia is
          invite-only; sign-in is not built yet.
        </p>
      </div>
    </main>
  );
}

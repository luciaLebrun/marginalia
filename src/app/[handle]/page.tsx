import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { Masthead } from "@/components/Masthead";
import { Shelf } from "@/components/Shelf";
import { getAuth } from "@/lib/auth";
import { getDiary, getDiaryCount, readingSpan } from "@/lib/diary";
import { profileMastheadLink } from "@/lib/masthead-link";
import { findByUsername } from "@/lib/profile";
import { parseHandle } from "@/lib/username";

/**
 * A reader's public diary at `/@name`.
 *
 * This is the last dynamic segment at the root, so it also catches every path
 * that is not a real route. `parseHandle` requires a leading `@` and a valid
 * username, and everything else 404s — which is what keeps `/nonsense` from
 * rendering as an empty profile.
 *
 * The page is the same for everyone. The session is read for one thing only:
 * which way onward the masthead's record band offers.
 */
export default async function ProfilePage({
  params,
}: PageProps<"/[handle]">) {
  const { handle } = await params;

  const username = parseHandle(handle);
  if (!username) notFound();

  const profile = await findByUsername(username);
  if (!profile) notFound();

  const [entries, count, session] = await Promise.all([
    // No lastSeenAt: nothing on someone else's diary is "new to you", so the
    // ink-in never fires here.
    getDiary(profile.id, null),
    getDiaryCount(profile.id),
    getAuth().api.getSession({ headers: await headers() }),
  ]);

  return (
    <main className="flex-1">
      <Masthead
        name={profile.name}
        span={readingSpan(entries)}
        count={count}
        handle={profile.username}
        bio={profile.bio}
        link={profileMastheadLink(session?.user.id ?? null, profile.id)}
      />
      <Shelf entries={entries} canLog={false} readerName={profile.name} />
    </main>
  );
}

export async function generateMetadata({ params }: PageProps<"/[handle]">) {
  const { handle } = await params;
  const username = parseHandle(handle);
  const profile = username ? await findByUsername(username) : null;

  if (!profile) return { title: "Not found — Marginalia" };
  return {
    title: `${profile.name} — Marginalia`,
    description: `Books ${profile.name} has read.`,
  };
}

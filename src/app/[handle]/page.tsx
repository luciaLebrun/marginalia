import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { Favourites } from "@/components/Favourites";
import { Masthead } from "@/components/Masthead";
import { Shelf } from "@/components/Shelf";
import { getAuth } from "@/lib/auth";
import { getDiary, getDiaryCount, readingSpan } from "@/lib/diary";
import { getFavourites } from "@/lib/favourites";
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
 * The page is the same for everyone. The session is read for two things only:
 * which way onward the masthead's record band offers, and whether the cells
 * link to book pages a visitor could not open.
 */
export default async function ProfilePage({
  params,
}: PageProps<"/[handle]">) {
  const { handle } = await params;

  const username = parseHandle(handle);
  if (!username) notFound();

  const profile = await findByUsername(username);
  if (!profile) notFound();

  const [entries, count, favourites, session] = await Promise.all([
    // No lastSeenAt: nothing on someone else's diary is "new to you", so the
    // ink-in never fires here.
    getDiary(profile.id, null),
    getDiaryCount(profile.id),
    getFavourites(profile.id),
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
      {/* Shown as the owner arranged it, with nothing to change it by: the
          controls live on their own diary. None, and the band is not drawn. */}
      <Favourites books={favourites} linkBooks={session !== null} />
      <Shelf
        entries={entries}
        canLog={false}
        linkBooks={session !== null}
        readerName={profile.name}
      />
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

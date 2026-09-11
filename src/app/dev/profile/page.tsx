import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { Masthead } from "@/components/Masthead";
import { Shelf } from "@/components/Shelf";
import { getDb, schema } from "@/db";
import { BIO_MAX } from "@/lib/account";
import { getDiary, getDiaryCount, readingSpan } from "@/lib/diary";
import { profileMastheadLink } from "@/lib/masthead-link";
import { MAX_LENGTH as USERNAME_MAX } from "@/lib/username";

/**
 * Development harness for a reader's profile at `/@handle`.
 *
 * The real profile is public, so a signed-out visitor is exercised there
 * directly. What e2e cannot reach is a session, so this renders the same
 * masthead and shelf for the seeded reader as each viewer would see it:
 *
 * - `?viewer=visitor` (default) — signed out: the tally alone
 * - `?viewer=owner` — the reader looking at their own profile
 * - `?viewer=friend` — another signed-in reader
 *
 * And the content edges: `?bio=none`, `?bio=long` (at the account sheet's
 * limit), `?handle=long` (at the username limit). The long values are built
 * from the seeded reader's own bio and handle, not invented copy.
 *
 * It 404s outside development and grants nothing: no session, no mutation.
 */
const VIEWERS = ["visitor", "owner", "friend"] as const;

export default async function DevProfilePage({ searchParams }: PageProps<"/dev/profile">) {
  if (process.env.NODE_ENV === "production") notFound();

  const params = await searchParams;
  const viewer = VIEWERS.find((v) => v === params.viewer) ?? "visitor";

  const [user] = await getDb()
    .select({
      id: schema.user.id,
      name: schema.user.name,
      username: schema.user.username,
      bio: schema.user.bio,
    })
    .from(schema.user)
    .where(eq(schema.user.id, "dev-reader"));

  if (!user?.username) {
    return (
      <main className="flex-1 px-4 py-16 sm:px-6">
        <p className="max-w-[34rem] text-[0.9375rem] leading-relaxed text-ink-soft">
          No dev reader found. Run <code>pnpm seed:dev</code> first.
        </p>
      </main>
    );
  }

  const [entries, count] = await Promise.all([getDiary(user.id, null), getDiaryCount(user.id)]);

  const viewerId = { visitor: null, owner: user.id, friend: "dev-newcomer" }[viewer];

  let bio = user.bio;
  if (params.bio === "none") bio = null;
  if (params.bio === "long" && user.bio) {
    bio = `${user.bio} `.repeat(Math.ceil(BIO_MAX / user.bio.length)).slice(0, BIO_MAX).trim();
  }

  const handle =
    params.handle === "long"
      ? `${user.username}_`.repeat(USERNAME_MAX).slice(0, USERNAME_MAX)
      : user.username;

  return (
    <main className="flex-1">
      <Masthead
        name={user.name}
        span={readingSpan(entries)}
        count={count}
        handle={handle}
        bio={bio}
        link={profileMastheadLink(viewerId, user.id)}
      />
      <Shelf entries={entries} canLog={false} readerName={user.name} />
    </main>
  );
}

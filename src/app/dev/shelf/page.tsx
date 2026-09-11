import { notFound } from "next/navigation";

import { getDevReader, NoDevReader } from "@/app/dev/dev-reader";
import { MarkSeen } from "@/components/MarkSeen";
import { Masthead } from "@/components/Masthead";
import { Shelf } from "@/components/Shelf";
import { getDiary, getDiaryCount, readingSpan } from "@/lib/diary";

/**
 * Development harness for the diary surface.
 *
 * The real page at `/` is behind Google OAuth, which cannot be driven
 * headlessly, so this renders the same components against the seeded dev user
 * (`pnpm seed:dev`). It exists so UI work can be inspected at real breakpoints
 * with real cover art.
 *
 * It 404s outside development, and it grants nothing: it reads one hard-coded
 * local user and has no session, no mutation and no parameters.
 */
export default async function DevShelfPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const user = await getDevReader();
  if (!user) return <NoDevReader />;

  const [entries, count] = await Promise.all([
    getDiary(user.id, user.lastSeenAt),
    getDiaryCount(user.id),
  ]);

  return (
    <main className="flex-1">
      <Masthead name={user.name} span={readingSpan(entries)} count={count} />
      <Shelf entries={entries} />
      <MarkSeen userId={user.id} />
    </main>
  );
}

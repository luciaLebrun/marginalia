import { notFound } from "next/navigation";

import { getDevReader, NoDevReader } from "@/app/dev/dev-reader";
import { Masthead } from "@/components/Masthead";
import { Shelf3D } from "@/components/Shelf3D";
import { getDiary, getDiaryCount, readingSpan } from "@/lib/diary";

/**
 * Development harness for the 3D shelf mock (MRG-085): the seeded dev reader's
 * diary (`pnpm seed:dev`) as books standing on a library shelf. It 404s in
 * production and only reads.
 */
export default async function DevShelf3DPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const user = await getDevReader();
  if (!user) return <NoDevReader />;

  const [diary, count] = await Promise.all([
    getDiary(user.id, user.lastSeenAt),
    getDiaryCount(user.id),
  ]);

  return (
    <main className="flex-1">
      <Masthead name={user.name} span={readingSpan(diary)} count={count} />
      <Shelf3D entries={diary} />
    </main>
  );
}

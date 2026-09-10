import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { Masthead } from "@/components/Masthead";
import { Shelf } from "@/components/Shelf";
import { getDb, schema } from "@/db";
import { getDiary, getDiaryCount } from "@/lib/diary";

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

  const [user] = await getDb()
    .select({ id: schema.user.id, name: schema.user.name })
    .from(schema.user)
    .where(eq(schema.user.id, "dev-reader"));

  if (!user) {
    return (
      <main className="flex-1 px-4 py-16 sm:px-6">
        <p className="max-w-[34rem] text-[0.9375rem] leading-relaxed text-ink-soft">
          No dev reader found. Run <code>pnpm seed:dev</code> first.
        </p>
      </main>
    );
  }

  const [entries, count] = await Promise.all([
    getDiary(user.id),
    getDiaryCount(user.id),
  ]);

  return (
    <main className="flex-1">
      <Masthead name={user.name} count={count} />
      <Shelf entries={entries} />
    </main>
  );
}

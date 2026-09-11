import { eq } from "drizzle-orm";

import { getDb, schema } from "@/db";

/**
 * The seeded local reader every development harness renders (`pnpm seed:dev`).
 *
 * One lookup and one fallback, shared, so the harnesses cannot drift on who
 * they show — and so they are not three copies of the same block. Not a route:
 * only special filenames under `app/` are routed.
 */
export const DEV_READER_ID = "dev-reader";

export async function getDevReader() {
  const [reader] = await getDb()
    .select({
      id: schema.user.id,
      name: schema.user.name,
      username: schema.user.username,
      bio: schema.user.bio,
      lastSeenAt: schema.user.lastSeenAt,
    })
    .from(schema.user)
    .where(eq(schema.user.id, DEV_READER_ID));

  return reader ?? null;
}

/** What a harness shows when the seed has not been run. */
export function NoDevReader() {
  return (
    <main className="flex-1 px-4 py-16 sm:px-6">
      <p className="max-w-[34rem] text-[0.9375rem] leading-relaxed text-ink-soft">
        No dev reader found. Run <code>pnpm seed:dev</code> first.
      </p>
    </main>
  );
}

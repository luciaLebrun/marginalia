import { and, desc, eq, isNotNull } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { DEV_READER_ID } from "@/app/dev/dev-reader";
import { getDb, schema } from "@/db";
import { entryPath } from "@/lib/entry";

/**
 * Redirect to the newest entry of the *seeded* reader, by its real permalink.
 *
 * The permalink route is public, so e2e can exercise the real page rather than
 * a harness — but it needs an id, and ids are generated at seed time. This
 * hands one over. Scoped to `pnpm seed:dev`'s reader on purpose: a local
 * database also holds whatever its owner has logged themselves, and a test
 * that follows this must land somewhere it can predict.
 *
 * Development only, and read-only: it 404s in production and grants nothing a
 * visitor to `/@handle` could not already see.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") notFound();

  const [row] = await getDb()
    .select({ id: schema.log.id, username: schema.user.username })
    .from(schema.log)
    .innerJoin(schema.user, eq(schema.log.userId, schema.user.id))
    .where(and(eq(schema.user.id, DEV_READER_ID), isNotNull(schema.user.username)))
    .orderBy(desc(schema.log.createdAt))
    .limit(1);

  if (!row?.username) notFound();

  redirect(entryPath(row.username, row.id));
}

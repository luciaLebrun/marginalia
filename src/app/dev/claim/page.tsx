import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { ClaimForm } from "@/components/ClaimForm";
import { WordmarkBand } from "@/components/WordmarkBand";
import { getDb, schema } from "@/db";
import { handlePath } from "@/lib/username";

/**
 * Development harness for the claim form, matching `/dev/shelf`.
 *
 * 404s outside development, reads one hard-coded local user, grants nothing.
 */
export default async function DevClaimPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const [user] = await getDb()
    .select({ id: schema.user.id, username: schema.user.username })
    .from(schema.user)
    .where(eq(schema.user.id, "dev-newcomer"));

  if (!user) {
    return (
      <main className="flex-1 px-4 py-16 sm:px-6">
        <p className="max-w-[34rem] text-[0.9375rem] leading-relaxed text-ink-soft">
          No dev newcomer found. Run <code>pnpm seed:dev</code> first.
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <WordmarkBand />
      <div className="px-4 py-10 sm:px-6">
        {user.username ? (
        <p className="max-w-[34rem] text-[0.9375rem] leading-relaxed text-ink-soft">
          Already claimed as{" "}
          <a className="font-semibold underline" href={handlePath(user.username)}>
            @{user.username}
          </a>
          . Clear it in the database to exercise the form again.
        </p>
      ) : (
          <ClaimForm devUserId={user.id} />
        )}
      </div>
    </main>
  );
}

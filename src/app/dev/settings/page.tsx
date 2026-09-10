import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { AccountHeader } from "@/components/AccountHeader";
import { AccountSheet } from "@/components/AccountSheet";
import { DeleteAccount } from "@/components/DeleteAccount";
import { InviteRun } from "@/components/InviteRun";
import { SignOutButton } from "@/components/SignOutButton";
import { getDb, schema } from "@/db";
import { listInvitesWithState } from "@/lib/invite";

/**
 * Development harness for the account sheet, matching `/dev/shelf` and
 * `/dev/claim`.
 *
 * 404s outside development and grants nothing: every control on it still runs
 * the real server action, which still takes the reader from the session and
 * will refuse without one. This route exists so the surface can be rendered
 * and screenshotted without a Google round-trip, not to bypass the session.
 */
export default async function DevSettingsPage() {
  if (process.env.NODE_ENV === "production") notFound();

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

  const invites = await listInvitesWithState(user.id);

  return (
    <main className="flex-1">
      <AccountHeader username={user.username} note="Development harness" />

      <AccountSheet
        initial={{
          name: user.name,
          username: user.username,
          bio: user.bio ?? "",
        }}
      >
        <InviteRun invites={invites} />

        <section aria-labelledby="device-heading" className="border-t border-ink">
          <h2
            id="device-heading"
            className="band-label bg-ink px-4 py-3 text-paper sm:px-6"
          >
            This device
          </h2>
          <div className="px-4 py-5 sm:px-6">
            <SignOutButton />
          </div>
        </section>

        <DeleteAccount username={user.username} />
      </AccountSheet>
    </main>
  );
}

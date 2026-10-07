import { BottomBar } from "@/components/BottomBar";
import { notFound } from "next/navigation";

import { getDevReader, NoDevReader } from "@/app/dev/dev-reader";
import { AccountHeader } from "@/components/AccountHeader";
import { AccountSheet } from "@/components/AccountSheet";
import { DeleteAccount } from "@/components/DeleteAccount";
import { InviteRun } from "@/components/InviteRun";
import { SignOutButton } from "@/components/SignOutButton";
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

  const user = await getDevReader();
  if (!user?.username) return <NoDevReader />;

  const invites = await listInvitesWithState(user.id);

  return (
    <>
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

        <section aria-labelledby="device-heading" className="border-t border-ink max-sm:mx-4 max-sm:mt-4 max-sm:rounded-[1.25rem] max-sm:border-0 max-sm:bg-paper-sunk">
          <h2
            id="device-heading"
            className="band-label bg-ink px-4 py-3 text-paper max-sm:bg-transparent max-sm:pt-5 max-sm:pb-0 sm:px-6"
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
    <BottomBar />
    </>
  );
}

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AccountHeader } from "@/components/AccountHeader";
import { AccountSheet } from "@/components/AccountSheet";
import { DeleteAccount } from "@/components/DeleteAccount";
import { InviteRun } from "@/components/InviteRun";
import { SignOutButton } from "@/components/SignOutButton";
import { getAuth } from "@/lib/auth";
import { listInvitesWithState } from "@/lib/invite";
import { isOwner } from "@/lib/owner";

export const metadata = { title: "Your account — Marginalia" };

/**
 * The account sheet.
 *
 * One form for everything stored about the reader, then the things that are
 * not changes to be saved: the invitations they can hand out, ending the
 * session, and erasing the account. Those sit below the form's end and outside
 * it on purpose — a commit band that also owned a delete button would be
 * asking one control to mean two very different things.
 */
export default async function SettingsPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  // No handle means the reader never finished signing up. Nothing on this page
  // can be addressed without one, so finish that first.
  if (!session.user.username) redirect("/claim");

  const owner = isOwner(session.user.email);
  const invites = owner ? await listInvitesWithState(session.user.id) : [];

  return (
    <main className="flex-1">
      <AccountHeader username={session.user.username} />

      <AccountSheet
        initial={{
          name: session.user.name,
          username: session.user.username,
          bio: session.user.bio ?? "",
        }}
      >
        {owner && <InviteRun invites={invites} />}

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

        <DeleteAccount username={session.user.username} />
      </AccountSheet>
    </main>
  );
}

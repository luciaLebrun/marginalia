import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ClaimForm } from "@/components/ClaimForm";
import { WordmarkBand } from "@/components/WordmarkBand";
import { getAuth } from "@/lib/auth";
import { handlePath } from "@/lib/username";

export const metadata = { title: "Pick a username — Marginalia" };

/**
 * First stop after signing in, for a reader who has no username yet.
 *
 * Not reachable in practice until sign-in exists (MRG-033); `/dev/claim`
 * exercises the same component against the seeded reader.
 */
export default async function ClaimPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  // Already named: nothing to do here.
  if (session.user.username) redirect(handlePath(session.user.username));

  return (
    <main className="flex-1">
      <WordmarkBand />
      <div className="px-4 py-10 sm:px-6">
        <ClaimForm />
      </div>
    </main>
  );
}

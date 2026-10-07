import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { MarginsView } from "@/components/MarginsView";
import { getAuth } from "@/lib/auth";
import { getPassages } from "@/lib/passage";

export const metadata = { title: "Margins — Marginalia" };

/** Private, like the to-read list: signed-in only, the reader's own passages. */
export default async function MarginsPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect("/");
  if (!session.user.username) redirect("/claim");

  return <MarginsView passages={await getPassages(session.user.id)} />;
}

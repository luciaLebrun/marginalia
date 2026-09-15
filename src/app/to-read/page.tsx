import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ToReadView } from "@/components/ToReadView";
import { getAuth } from "@/lib/auth";
import { getToRead } from "@/lib/to-read";

export const metadata = { title: "To read — Marginalia" };

/**
 * The reader's to-read list (MRG-059). Private: signed-in only, and only ever
 * their own books. Renders from Postgres alone.
 */
export default async function ToReadPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect("/");
  if (!session.user.username) redirect("/claim");

  const books = await getToRead(session.user.id);
  return <ToReadView books={books} />;
}

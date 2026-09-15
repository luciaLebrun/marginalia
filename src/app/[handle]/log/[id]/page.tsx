import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";

import { ReviewPostcard } from "@/components/ReviewPostcard";
import { WordmarkBand } from "@/components/WordmarkBand";
import { getAuth } from "@/lib/auth";
import { getEntry, parseLogId, shareDescription } from "@/lib/entry";
import { parseHandle } from "@/lib/username";

/**
 * One diary entry, at its reader's address.
 *
 * Public, like the profile it belongs to: a link to a review has to work for
 * the friend it was sent to. The session is read for one thing only — whether
 * the page can offer the book and the reader's own diary, both signed-in only.
 *
 * Both the handle and the id are checked before anything is looked up, and
 * `getEntry` matches on both, so an entry is found only at its own reader's
 * current address.
 *
 * The lookup is wrapped per request: the page and its metadata both need the
 * entry, and Next dedupes `fetch`, not a database query.
 */
const loadEntry = cache(getEntry);

export default async function EntryPage({ params }: PageProps<"/[handle]/log/[id]">) {
  const { handle, id } = await params;

  const username = parseHandle(handle);
  const logId = parseLogId(id);
  if (!username || !logId) notFound();

  const [entry, session] = await Promise.all([
    loadEntry(username, logId),
    getAuth().api.getSession({ headers: await headers() }),
  ]);
  if (!entry) notFound();

  return (
    <main className="flex-1">
      <WordmarkBand />
      <ReviewPostcard entry={entry} signedIn={Boolean(session)} />
    </main>
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[handle]/log/[id]">): Promise<Metadata> {
  const { handle, id } = await params;

  const username = parseHandle(handle);
  const logId = parseLogId(id);
  const entry = username && logId ? await loadEntry(username, logId) : null;

  if (!entry) return { title: "Not found — Marginalia" };

  return {
    title: `${entry.book.title} — ${entry.reader.name} — Marginalia`,
    description: shareDescription(entry),
  };
}

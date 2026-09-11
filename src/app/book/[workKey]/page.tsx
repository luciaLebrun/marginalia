import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { BookOpening, BookUnavailable } from "@/components/BookStates";
import { BookTitlePage } from "@/components/BookTitlePage";
import { WordmarkBand } from "@/components/WordmarkBand";
import { getAuth } from "@/lib/auth";
import { findStoredBook, openBook, parseWorkKey } from "@/lib/book";
import { getReads } from "@/lib/book-view";
import { bookPath } from "@/lib/search";

/**
 * One book, opened.
 *
 * Signed-in only, and not only for privacy: opening a book nobody has opened
 * before writes it into the database, so a signed-out crawler walking work keys
 * could fill the free-tier `book` table.
 */
export default async function BookPage({ params }: PageProps<"/book/[workKey]">) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect("/");
  if (!session.user.username) redirect("/claim");

  const { workKey } = await params;
  // Before the stream starts, so a malformed address is a real 404 status.
  if (!parseWorkKey(workKey)) notFound();

  return (
    <main className="flex-1">
      <WordmarkBand />
      {/* A first open waits on Open Library for a second or three, so the page
          streams its frame first. The trade: a book that turns out not to
          exist, or a stub that redirects, is decided after the 200 has been
          sent — a soft 404 with noindex, or a client-side redirect. */}
      <Suspense key={workKey} fallback={<BookOpening />}>
        <OpenedBook workKey={workKey} userId={session.user.id} />
      </Suspense>
    </main>
  );
}

async function OpenedBook({
  workKey,
  userId,
}: Readonly<{ workKey: string; userId: string }>) {
  const outcome = await openBook(workKey);

  if (outcome.kind === "not-found") notFound();
  if (outcome.kind === "unavailable") return <BookUnavailable />;

  const { book } = outcome;
  // A redirect stub resolves to the surviving work, which is stored under its
  // own key. One address per book.
  if (book.olWorkKey !== parseWorkKey(workKey)) redirect(bookPath(book.olWorkKey));

  const reads = await getReads(userId, book.id);
  return <BookTitlePage book={book} reads={reads} />;
}

export async function generateMetadata({
  params,
}: PageProps<"/book/[workKey]">): Promise<Metadata> {
  const { workKey } = await params;
  // Postgres only: metadata must never be the thing that opens a book.
  const book = await findStoredBook(workKey);
  return { title: book ? `${book.title} — Marginalia` : "Book — Marginalia" };
}

import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { BookOpening, BookUnavailable } from "@/components/BookStates";
import { BookTitlePage } from "@/components/BookTitlePage";
import { WordmarkBand } from "@/components/WordmarkBand";
import { getAuth } from "@/lib/auth";
import { findStoredBook, openBook, parseBookKey } from "@/lib/book";
import { getReads } from "@/lib/book-view";
import { isOnToRead } from "@/lib/to-read";
import { bookPath } from "@/lib/client-safe";

/**
 * One book, opened.
 *
 * Signed-in only, and not only for privacy: opening a book nobody has opened
 * before writes it into the database, so a signed-out crawler walking book keys
 * could fill the free-tier `book` table.
 */
export default async function BookPage({ params }: PageProps<"/book/[bookKey]">) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect("/");
  if (!session.user.username) redirect("/claim");

  const { bookKey } = await params;
  // Before the stream starts, so a malformed address is a real 404 status.
  if (!parseBookKey(bookKey)) notFound();

  return (
    <main className="flex-1">
      <WordmarkBand />
      {/* A first open waits on the source for a second or three, so the page
          streams its frame first. The trade: a book that turns out not to
          exist, or a stub that redirects, is decided after the 200 has been
          sent — a soft 404 with noindex, or a client-side redirect. */}
      <Suspense key={bookKey} fallback={<BookOpening />}>
        <OpenedBook
          bookKey={bookKey}
          userId={session.user.id}
          username={session.user.username}
        />
      </Suspense>
    </main>
  );
}

async function OpenedBook({
  bookKey,
  userId,
  username,
}: Readonly<{ bookKey: string; userId: string; username: string }>) {
  const outcome = await openBook(bookKey);

  if (outcome.kind === "not-found") notFound();
  if (outcome.kind === "unavailable") return <BookUnavailable />;

  const { book } = outcome;
  // A redirect stub resolves to the surviving work, which is stored under its
  // own key. One address per book.
  if (book.sourceKey !== parseBookKey(bookKey)) redirect(bookPath(book.sourceKey));

  const [reads, onToRead] = await Promise.all([
    getReads(userId, book.id),
    isOnToRead(userId, book.id),
  ]);
  return <BookTitlePage book={book} reads={reads} onToRead={onToRead} username={username} />;
}

export async function generateMetadata({
  params,
}: PageProps<"/book/[bookKey]">): Promise<Metadata> {
  const { bookKey } = await params;
  // Postgres only: metadata must never be the thing that opens a book.
  const book = await findStoredBook(bookKey);
  return { title: book ? `${book.title} — Marginalia` : "Book — Marginalia" };
}

"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";

import { EditSheet } from "./LogSheet";
import { Rating } from "./Rating";
import { removeReadAction, type RemoveReadState } from "@/app/actions";
import type { Read } from "@/lib/book-view";
import { INK } from "@/lib/color";

/** A read as the slip prints it, with what the server alone can work out. */
export interface SlipRead extends Read {
  /** The read's permalink. */
  href: string;
  /** The slip's words for its date. */
  date: string;
}

const INITIAL_REMOVE: RemoveReadState = {
  error: null,
  signedOut: false,
  removed: 0,
  refusedId: null,
  refused: 0,
};

/**
 * The slip's lines, and the one place a removal is heard from.
 *
 * A removed read takes its line and its edit sheet with it, so the removal's
 * state lives here, above them: the announcement survives the line, and focus
 * goes back to the slip's heading rather than falling to the top of the page.
 */
export function SlipLines({
  reads,
  bookId,
}: Readonly<{ reads: SlipRead[]; bookId: string }>) {
  const [state, remove, removing] = useActionState<RemoveReadState, FormData>(
    removeReadAction,
    INITIAL_REMOVE,
  );

  useEffect(() => {
    if (state.removed > 0) document.getElementById("date-slip-heading")?.focus();
  }, [state.removed]);

  const removeError = state.signedOut ? (
    <>
      Not removed: you’re signed out.{" "}
      <Link
        href="/"
        className="underline decoration-alarm/40 underline-offset-4 transition-colors hover:decoration-alarm"
      >
        Sign in again
      </Link>{" "}
      to remove this read.
    </>
  ) : (
    state.error
  );

  return (
    <>
      {reads.length > 0 && (
        <ol>
          {reads.map((read) => (
            <SlipLine
              key={read.id}
              read={read}
              bookId={bookId}
              remove={remove}
              removing={removing}
              // A refusal is about one read; the other lines never hear of it.
              removeError={read.id === state.refusedId ? removeError : null}
              refusal={state.refused}
            />
          ))}
        </ol>
      )}
      <output className="sr-only">
        {state.removed === 0 ? "" : `Read removed${state.removed > 1 ? ` (${state.removed})` : ""}.`}
      </output>
    </>
  );
}

function SlipLine({
  read,
  bookId,
  remove,
  removing,
  removeError,
  refusal,
}: Readonly<{
  read: SlipRead;
  bookId: string;
  remove: (formData: FormData) => void;
  removing: boolean;
  removeError: React.ReactNode;
  refusal: number;
}>) {
  const valueClass = "text-[1.375rem] leading-snug font-semibold tracking-[-0.01em]";

  // Built from parts rather than nested templates: the line says the same
  // things a sighted reader sees on it, in the same order.
  const spoken = [
    read.date,
    read.rating === null ? "unrated" : `${read.rating} out of 5`,
    read.isReread ? "reread" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    // Open, the line draws its 2px rule in ink, as the log line does while its
    // sheet is open: the sheet below gets the same top edge.
    <li className="relative border-b border-rule [&:has(>details[open])>a]:border-ink">
      {/* The whole line is the link: hover and focus draw it in solid ink, as
          a search result does, and nothing fills. Its right end is left for
          Edit, which sits over the line rather than inside the link. */}
      <Link
        href={read.href}
        aria-label={spoken}
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b-2 border-transparent py-3 pr-[4.5rem] pl-3 transition-colors hover:border-ink focus-visible:border-ink"
      >
        {read.readAt ? (
          <time className={valueClass} dateTime={read.readAt.toISOString().slice(0, 10)}>
            {read.date}
          </time>
        ) : (
          // "Undated" is not a date, so it is not a <time>.
          <span className={`${valueClass} text-ink-soft`}>{read.date}</span>
        )}

        <span className="flex items-center gap-3">
          {read.isReread && <span className="band-label text-ink-soft">Reread</span>}
          {read.rating === null ? (
            <span className="text-[0.6875rem] font-medium text-ink-soft">Unrated</span>
          ) : (
            <Rating value={read.rating} tone={INK} />
          )}
        </span>
      </Link>

      <EditSheet
        bookId={bookId}
        read={read}
        remove={remove}
        removing={removing}
        removeError={removeError}
        refusal={refusal}
      />
    </li>
  );
}

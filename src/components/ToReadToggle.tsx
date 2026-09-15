"use client";

import Link from "next/link";
import { useActionState } from "react";

import { toggleToReadAction, type ToReadState } from "@/app/actions";
import { INK } from "@/lib/color";

const INITIAL: ToReadState = { saved: null, bookId: null, error: null, signedOut: false };

/**
 * Want to read (MRG-059): keep this book on the reader's private list, in one
 * press, without logging a read.
 *
 * Not on the list, it is an Outline Button. On the list, it is a printed line —
 * the drawn tick, the words, and the way off — never a filled badge. The page
 * keys this on the stored state, so logging a read (which takes the book off)
 * re-renders it fresh.
 */
export function ToReadToggle({
  bookId,
  saved,
  listHref = "/to-read",
}: Readonly<{
  bookId: string;
  /** Whether the book is on the reader's list as the page was rendered. */
  saved: boolean;
  listHref?: string;
}>) {
  const [state, submit, pending] = useActionState<ToReadState, FormData>(
    toggleToReadAction,
    INITIAL,
  );
  const onList = state.saved ?? saved;

  return (
    <form action={submit} className="mt-6 max-w-[34rem]">
      <input type="hidden" name="bookId" value={bookId} />
      <input type="hidden" name="intent" value={onList ? "remove" : "save"} />

      {onList ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-rule py-3">
          <span className="flex items-center gap-3">
            {/* The reread box's tick, drawn: a printed mark, not a chip. */}
            <span className="inline-flex size-5 shrink-0 items-center justify-center border border-ink">
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5 10.5l3.2 3.2L15 6.5" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="square" />
              </svg>
            </span>
            <span className="band-label">On your to-read list</span>
          </span>
          <span className="ml-auto flex items-center gap-4">
            <Link
              href={listHref}
              className="band-label underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink"
            >
              Your list
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="band-label underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink disabled:cursor-progress"
            >
              {pending ? "Taking it off…" : "Take it off"}
            </button>
          </span>
        </div>
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="band-label border border-ink px-3 py-2.5 transition-colors hover:bg-band-fiction focus-visible:bg-band-fiction disabled:cursor-progress"
        >
          {pending ? "Saving…" : "Want to read"}
        </button>
      )}

      {/* Its words change with the state, so a screen reader hears each one. */}
      <output className="sr-only">
        {state.saved === null ? "" : state.saved ? "Saved to your to-read list." : "Taken off your to-read list."}
      </output>

      {state.error && (
        <p role="alert" className="mt-3 text-[0.9375rem] leading-relaxed text-alarm">
          {state.error}{" "}
          {state.signedOut && (
            <Link
              href="/"
              className="underline decoration-alarm/40 underline-offset-4 transition-colors hover:decoration-alarm"
            >
              Sign in again
            </Link>
          )}
        </p>
      )}
    </form>
  );
}

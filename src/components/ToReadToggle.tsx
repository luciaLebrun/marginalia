"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, type MouseEvent } from "react";

import { toggleToReadAction, type ToReadState } from "@/app/actions";
import { INK } from "@/lib/color";

const INITIAL: ToReadState = { saved: null, bookId: null, error: null, signedOut: false };

function savedAnnouncement(saved: boolean | null): string {
  if (saved === null) return "";
  return saved ? "Saved to your to-read list." : "Taken off your to-read list.";
}

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
  action = toggleToReadAction,
}: Readonly<{
  bookId: string;
  /** Whether the book is on the reader's list as the page was rendered. */
  saved: boolean;
  listHref?: string;
  /** The book harness substitutes one that needs no session. */
  action?: (previous: ToReadState, form: FormData) => Promise<ToReadState>;
}>) {
  const [state, submit, pending] = useActionState<ToReadState, FormData>(action, INITIAL);
  const onList = state.saved ?? saved;
  const form = useRef<HTMLFormElement>(null);
  const onward = useRef<HTMLAnchorElement>(null);
  const want = useRef<HTMLButtonElement>(null);

  // Pending, a control is aria-disabled and ignores presses rather than going
  // natively disabled: disabling the focused control would throw keyboard
  // focus to the page mid-save.
  const hold = (event: MouseEvent) => {
    if (pending) event.preventDefault();
  };

  // The control pressed is replaced by the other state's; hand focus to the
  // replacement's first control, as Favourite does — unless the reader has
  // already moved on somewhere else.
  useEffect(() => {
    if (state.saved === null || state.error) return;
    const active = document.activeElement;
    if (active && active !== document.body && !form.current?.contains(active)) return;
    (state.saved ? onward.current : want.current)?.focus();
  }, [state]);

  return (
    <form ref={form} action={submit} className="mt-6 max-w-[34rem]">
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
              ref={onward}
              href={listHref}
              className="band-label underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink"
            >
              Your list
            </Link>
            <button
              type="submit"
              aria-disabled={pending || undefined}
              onClick={hold}
              className="band-label inline-grid underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink aria-disabled:cursor-progress"
            >
              <span className={`[grid-area:1/1] ${pending ? "invisible" : ""}`}>Take it off</span>
              <span aria-hidden={!pending} className={`[grid-area:1/1] ${pending ? "" : "invisible"}`}>
                Taking it off…
              </span>
            </button>
          </span>
        </div>
      ) : (
        // Both labels share one grid cell so the button holds its width — the
        // Outline Button's pending state.
        <button
          ref={want}
          type="submit"
          aria-disabled={pending || undefined}
          onClick={hold}
          className="band-label inline-grid border border-ink px-3 py-2.5 transition-colors hover:bg-band-fiction focus-visible:bg-band-fiction aria-disabled:cursor-progress"
        >
          <span className={`[grid-area:1/1] ${pending ? "invisible" : ""}`}>Want to read</span>
          <span aria-hidden={!pending} className={`[grid-area:1/1] ${pending ? "" : "invisible"}`}>
            Saving…
          </span>
        </button>
      )}

      {/* Its words change with the state, so a screen reader hears each one. */}
      <output className="sr-only">{savedAnnouncement(state.saved)}</output>

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

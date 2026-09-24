"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useTransition } from "react";

import { moveFavouriteAction, toggleFavouriteAction, type FavouriteState } from "@/app/actions";
import { INK } from "@/lib/color";

const INITIAL: FavouriteState = { favourite: null, error: null, signedOut: false };

function announcement(favourite: boolean | null): string {
  if (favourite === null) return "";
  return favourite ? "Added to your favourites." : "Taken off your favourites.";
}

/**
 * Favourite (MRG-071), on the page of a book the reader has read — the page
 * only draws it once the slip holds a read, because only a read book may be a
 * favourite.
 *
 * Not a favourite, it is an Outline Button. A favourite, it is the printed line
 * Want to Read uses once saved: the drawn tick, the words, and the ways on. At
 * four, the button stays, ruled through, with the reason beside it — never
 * removed (the Printed State Rule).
 */
export function FavouriteToggle({
  bookId,
  favourite,
  full,
  diaryHref = "/",
  position = -1,
  count = 0,
  action = toggleFavouriteAction,
  moveAction = moveFavouriteAction,
}: Readonly<{
  bookId: string;
  /** Whether the book is a favourite as the page was rendered. */
  favourite: boolean;
  /** Whether the reader already has four. */
  full: boolean;
  diaryHref?: string;
  /** Where this favourite stands (0-based) among `count`; -1 when it is not one. */
  position?: number;
  count?: number;
  /** The book harness substitutes one that needs no session. */
  action?: (previous: FavouriteState, form: FormData) => Promise<FavouriteState>;
  moveAction?: (form: FormData) => Promise<void>;
}>) {
  const [state, submit, pending] = useActionState<FavouriteState, FormData>(action, INITIAL);
  const isFavourite = state.favourite ?? favourite;
  const form = useRef<HTMLFormElement>(null);
  const onward = useRef<HTMLAnchorElement>(null);
  const add = useRef<HTMLButtonElement>(null);
  const earlier = useRef<HTMLButtonElement>(null);
  const later = useRef<HTMLButtonElement>(null);
  const moved = useRef<"earlier" | "later" | null>(null);
  const [moving, startMove] = useTransition();

  // Earlier / Later: the one way to arrange favourites with plain taps or
  // clicks (WCAG 2.5.7), since the diary's band is arranged by dragging. The
  // buttons stay mounted across a move; if the one pressed has just reached an
  // end and is ruled through, focus passes to the other.
  useEffect(() => {
    const step = moved.current;
    if (!step) return;
    moved.current = null;
    const pressed = step === "earlier" ? earlier.current : later.current;
    const other = step === "earlier" ? later.current : earlier.current;
    if (pressed?.disabled) other?.focus();
  }, [position]);

  const move = (step: "earlier" | "later") => {
    if (moving) return;
    const form = new FormData();
    form.set("bookId", bookId);
    form.set("to", String(position + (step === "earlier" ? -1 : 1)));
    moved.current = step;
    startMove(() => moveAction(form));
  };
  let addState = "border-ink hover:bg-band-fiction focus-visible:bg-band-fiction";
  if (full) addState = "border-rule line-through opacity-50";
  else if (pending) addState += " cursor-progress";

  const textButton =
    "band-label underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink disabled:cursor-default disabled:line-through disabled:decoration-ink disabled:opacity-50";

  // The control pressed is replaced by the other state's, which would drop
  // keyboard focus to the page. Hand it to the replacement's first control —
  // unless the reader has already moved on somewhere else.
  useEffect(() => {
    if (state.favourite === null || state.error) return;
    const active = document.activeElement;
    if (active && active !== document.body && !form.current?.contains(active)) return;
    (state.favourite ? onward.current : add.current)?.focus();
  }, [state]);

  return (
    <form ref={form} action={submit} className="mt-6 max-w-[34rem]">
      <input type="hidden" name="bookId" value={bookId} />
      <input type="hidden" name="intent" value={isFavourite ? "remove" : "add"} />

      {isFavourite ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-rule py-3">
          <span className="flex items-center gap-3">
            <span className="inline-flex size-5 shrink-0 items-center justify-center border border-ink">
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5 10.5l3.2 3.2L15 6.5" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="square" />
              </svg>
            </span>
            <span className="band-label">
              One of your favourites
              {position >= 0 && count > 1 && (
                <span className="text-ink-soft">
                  {" "}
                  · {position + 1} of {count}
                </span>
              )}
            </span>
          </span>
          <span className="ml-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
            {position >= 0 && count > 1 && (
              <>
                <button
                  ref={earlier}
                  type="button"
                  disabled={position === 0}
                  aria-label="Move earlier in your favourites"
                  onClick={() => move("earlier")}
                  className={textButton}
                >
                  Earlier
                </button>
                <button
                  ref={later}
                  type="button"
                  disabled={position === count - 1}
                  aria-label="Move later in your favourites"
                  onClick={() => move("later")}
                  className={textButton}
                >
                  Later
                </button>
              </>
            )}
            <Link
              ref={onward}
              href={diaryHref}
              className="band-label underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink"
            >
              Your favourites
            </Link>
            {/* aria-disabled while pending, both labels in one grid cell, as
                "Add to favourites" is below: the row is set from the right, so
                a wider label would slide everything before it. */}
            <button
              type="submit"
              aria-disabled={pending || undefined}
              onClick={(event) => {
                if (pending) event.preventDefault();
              }}
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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Pending keeps the flood under the pointer or focus, and both
              labels share one grid cell so the button holds its width — the
              Outline Button's pending state. Only at four does it go dark. */}
          {/* Pending, it is aria-disabled and ignores presses rather than
              going natively disabled: disabling the focused control would
              throw keyboard focus to the page mid-save. */}
          <button
            ref={add}
            type="submit"
            disabled={full}
            aria-disabled={pending || undefined}
            onClick={(event) => {
              if (pending) event.preventDefault();
            }}
            className={`band-label inline-grid border px-3 py-2.5 transition-colors ${addState}`}
          >
            <span className={`[grid-area:1/1] ${pending ? "invisible" : ""}`}>Add to favourites</span>
            <span aria-hidden={!pending} className={`[grid-area:1/1] ${pending ? "" : "invisible"}`}>
              Adding…
            </span>
          </button>
          {full && (
            <p className="text-[0.8125rem] leading-snug text-ink-soft">
              {/* Taking one off happens on that book's own page, so the line
                  leads to the four rather than promising it can be done here. */}
              You have four already. Take one off from its own page to make room.{" "}
              <Link
                href={diaryHref}
                className="underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink"
              >
                Your favourites
              </Link>
            </p>
          )}
        </div>
      )}

      <output className="sr-only">{announcement(state.favourite)}</output>

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

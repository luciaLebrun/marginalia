"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";

import { Rating } from "./Rating";
import { logReadAction, type LogReadState } from "@/app/actions";
import { INK } from "@/lib/color";
import { REVIEW_MAX, type LogReadField } from "@/lib/read-schema";
import { slipDate } from "@/lib/slip-date";

/*
 * Lives here rather than beside the action: a "use server" module may export
 * only async functions.
 */
const INITIAL_STATE: LogReadState = { error: null, field: null, signedOut: false, saved: 0 };

/**
 * The log sheet: the date slip's blank line, deployed in place.
 *
 * A native <details>, so the line opens into the sheet without JavaScript and
 * never becomes a modal. The action state lives here, above the sheet, and the
 * sheet is keyed on how many reads it has saved: a save remounts it closed and
 * empty, while a refusal leaves everything the reader typed exactly where it
 * was. After a save the page itself re-renders, so the confirmation is the new
 * line on the slip — the record, not a toast.
 */
export function LogSheet({
  bookId,
  hasReads,
}: Readonly<{
  bookId: string;
  /** A book already on the slip is being reread, so Reread starts ticked. */
  hasReads: boolean;
}>) {
  const [state, submit, pending] = useActionState<LogReadState, FormData>(
    logReadAction,
    INITIAL_STATE,
  );

  return (
    <>
      <Sheet
        key={state.saved}
        bookId={bookId}
        hasReads={hasReads}
        state={state}
        submit={submit}
        pending={pending}
        returning={state.saved > 0}
      />
      {/* Its words change on every save: a live region that repeats itself
          word for word is not announced a second time. */}
      <output className="sr-only">{savedAnnouncement(state.saved)}</output>
    </>
  );
}

function savedAnnouncement(saved: number): string {
  if (saved === 0) return "";
  if (saved === 1) return "Read saved.";
  return `Read saved — ${saved} logged this visit.`;
}

/** Today in the reader's own zone, as the date input wants it. */
function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function Sheet({
  bookId,
  hasReads,
  state,
  submit,
  pending,
  returning,
}: Readonly<{
  bookId: string;
  hasReads: boolean;
  state: LogReadState;
  submit: (formData: FormData) => void;
  pending: boolean;
  /** Remounted by a save, rather than rendered for the first time. */
  returning: boolean;
}>) {
  const ids = useId();
  const summaryRef = useRef<HTMLElement>(null);
  const [primed, setPrimed] = useState(false);
  const [today, setToday] = useState<string | undefined>(undefined);
  const [readAt, setReadAt] = useState("");
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [reread, setReread] = useState(hasReads);

  // A save remounts the sheet closed. Hand keyboard focus back to the line it
  // was opened from, rather than letting it fall to the top of the page.
  useEffect(() => {
    if (returning) summaryRef.current?.focus();
  }, [returning]);

  const errorFor = (field: LogReadField) => (state.field === field ? state.error : null);

  return (
    <details
      className="group"
      // Dated on first opening, in the reader's zone, and in an event rather
      // than during render — the server does not know what day it is for them,
      // and a value rendered on one side only would not hydrate.
      onToggle={(event) => {
        if (!event.currentTarget.open || primed) return;
        const date = localToday();
        setToday(date);
        // The toggle event is dispatched asynchronously, after the open
        // attribute changes, so a date typed in that gap must not be replaced.
        setReadAt((current) => (current === "" ? date : current));
        setPrimed(true);
      }}
    >
      {/* The blank line itself. At rest a 2px hairline, as it was when inert;
          pointed at, focused or open, the same line in solid ink. */}
      <summary
        ref={summaryRef}
        className="flex h-[3.25rem] cursor-pointer list-none items-center justify-between gap-4 border-b-2 border-rule px-3 text-ink-soft transition-colors group-open:border-ink group-open:text-ink hover:border-ink hover:text-ink focus-visible:border-ink focus-visible:text-ink [&::-webkit-details-marker]:hidden"
      >
        <span className="band-label">
          {/* The disclosure keeps its name open or closed — "Log a read,
              expanded", never "Close, expanded" with an unnamed sheet under
              it. Only the visible word and the drawn mark change. */}
          <span className="group-open:sr-only">Log a read</span>
          <span aria-hidden="true" className="hidden group-open:inline">
            Close
          </span>
        </span>
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          <path
            d="M7 1v12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
            className="group-open:hidden"
          />
        </svg>
      </summary>

      <form action={submit} className="border-b border-rule">
        <input type="hidden" name="bookId" value={bookId} />

        <Row label="Finished" htmlFor={`${ids}-date`} error={errorFor("readAt")} errorId={`${ids}-date-error`}>
          <div className="flex items-baseline gap-4">
            <RuledValue error={errorFor("readAt")}>
              <input
                id={`${ids}-date`}
                type="date"
                name="readAt"
                value={readAt}
                max={today}
                onChange={(event) => setReadAt(event.target.value)}
                aria-invalid={errorFor("readAt") ? true : undefined}
                aria-describedby={errorFor("readAt") ? `${ids}-date-error` : undefined}
                // Empty, the field still prints "mm/dd/yyyy" at the field step.
                // Soft ink keeps that from reading as a date — the slip sets
                // Undated the same way.
                className={`w-full bg-transparent py-1 text-[1.375rem] leading-snug font-semibold tracking-[-0.01em] outline-none ${
                  readAt === "" ? "text-ink-soft" : ""
                }`}
              />
            </RuledValue>
            <TextButton onClick={() => setReadAt("")} disabled={readAt === ""}>
              Undated
            </TextButton>
          </div>
          {/* A native date field prints in the browser's own order — 09/11 in
              one locale, 11/09 in another. Underneath, the words the slip will
              actually print, so there is never a doubt which day it means. */}
          {primed && (
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-soft">
              Logs as {slipDate(readAt === "" ? null : new Date(readAt))}
            </p>
          )}
        </Row>

        <Row label="Rating" htmlFor={`${ids}-rating`} error={errorFor("rating")} errorId={`${ids}-rating-error`}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* The marks are drawn; one real range input lies over them and
                does the work — tap, drag, arrow keys, a screen reader. Its
                thumb is a pixel wide, so where you tap is the value you get. */}
            {/* The ring is drawn around the marks at the world's one focus
                geometry — 2px ink at a 2px offset — since the input under
                them has no visible box of its own to ring. */}
            <div className="relative inline-flex has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink">
              <span aria-hidden="true" className="flex">
                <Rating value={rating} tone={INK} size={32} />
              </span>
              <input
                id={`${ids}-rating`}
                type="range"
                name="rating"
                min={0}
                max={5}
                step={0.5}
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
                aria-valuetext={rating === 0 ? "Unrated" : `${rating} out of 5`}
                aria-invalid={errorFor("rating") ? true : undefined}
                aria-describedby={errorFor("rating") ? `${ids}-rating-error` : undefined}
                className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent outline-none [&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:w-px [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-transparent [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-px [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-transparent"
              />
            </div>
            <span className="text-[0.8125rem] font-medium text-ink-soft">
              {rating === 0 ? "Unrated" : `${rating} of 5`}
            </span>
            <TextButton onClick={() => setRating(0)} disabled={rating === 0}>
              Clear
            </TextButton>
          </div>
        </Row>

        <Row label="Review" htmlFor={`${ids}-review`} error={errorFor("review")} errorId={`${ids}-review-error`}>
          <RuledValue error={errorFor("review")}>
            {/* The body step, not the field step: a review is paragraphs of
                prose, and the user approved it as a named exception to the
                Value Over Label Rule. Grows with the text where field-sizing
                is supported; elsewhere three rows and a scroll. */}
            <textarea
              id={`${ids}-review`}
              name="review"
              rows={3}
              maxLength={REVIEW_MAX}
              value={review}
              onChange={(event) => setReview(event.target.value)}
              placeholder="Optional"
              aria-invalid={errorFor("review") ? true : undefined}
              aria-describedby={errorFor("review") ? `${ids}-review-error` : undefined}
              className="w-full resize-none bg-transparent py-1 text-[0.9375rem] leading-relaxed outline-none [field-sizing:content] placeholder:text-ink-soft"
            />
          </RuledValue>
        </Row>

        <label className="flex cursor-pointer items-center gap-3 border-b border-rule px-3 py-4">
          <span className="relative inline-flex size-5 shrink-0">
            <input
              type="checkbox"
              name="isReread"
              checked={reread}
              onChange={(event) => setReread(event.target.checked)}
              className="peer absolute inset-0 cursor-pointer appearance-none border border-rule bg-paper transition-colors checked:border-ink"
            />
            {/* The tick is drawn, and only once ticked: a printed mark, not a
                chrome control. */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="pointer-events-none relative hidden peer-checked:block"
            >
              <path
                d="M5 10.5l3.2 3.2L15 6.5"
                fill="none"
                stroke={INK}
                strokeWidth="1.5"
                strokeLinecap="square"
              />
            </svg>
          </span>
          <span className="band-label">Reread</span>
        </label>

        {/* An error with no field of its own would otherwise never be shown.
            A lost session also offers the way back in, not only the refusal. */}
        {state.error && state.field === null && (
          <p role="alert" className="px-3 pt-4 text-[0.9375rem] leading-relaxed text-alarm">
            {state.signedOut ? (
              <>
                Not saved: you’re signed out.{" "}
                <Link
                  href="/"
                  className="underline decoration-alarm/40 underline-offset-4 transition-colors hover:decoration-alarm"
                >
                  Sign in again
                </Link>{" "}
                to log this read.
              </>
            ) : (
              state.error
            )}
          </p>
        )}

        {/* The commit, in the flow of the sheet — the One Pin Rule's single
            exception is the account sheet's. While saving it stays at full
            ink on full orange: "Saving…" is the live readout and carries the
            state itself, and a faded band would be a greyed box. */}
        <button
          type="submit"
          disabled={pending}
          className="band-label mt-4 flex w-full items-baseline bg-band-fiction px-3 py-4 text-left text-ink disabled:cursor-progress"
        >
          <span className="font-stretch-[118%] tracking-[0.2em]">
            {pending ? "Saving…" : "Save this read"}
          </span>
        </button>
      </form>
    </details>
  );
}

/** One row of the sheet: label in the band voice, the value under it. */
function Row({
  label,
  htmlFor,
  error,
  errorId,
  children,
}: Readonly<{
  label: string;
  htmlFor: string;
  error: string | null;
  errorId: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="border-b border-rule px-3 py-4">
      <label htmlFor={htmlFor} className="band-label block text-ink-soft">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-[0.8125rem] leading-snug text-alarm">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * A value on a ruled line: hairline at rest, ink while typed in, alarm when it
 * is what failed. Set by class, never by inline style, so focus can always win.
 */
function RuledValue({
  error,
  children,
}: Readonly<{ error: string | null; children: React.ReactNode }>) {
  return (
    <div
      className={`min-w-0 flex-1 border-b-2 transition-colors ${
        error ? "border-alarm" : "border-rule focus-within:border-ink"
      }`}
    >
      {children}
    </div>
  );
}

/**
 * A secondary control set as words. Unavailable is the printed mark for it —
 * ruled through at half strength — never a greyed box.
 */
function TextButton({
  onClick,
  disabled,
  children,
}: Readonly<{ onClick: () => void; disabled: boolean; children: React.ReactNode }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      // line-through replaces the underline outright — both are
      // text-decoration-line — so no reset is needed, and adding one would win.
      className="band-label shrink-0 underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink disabled:cursor-default disabled:line-through disabled:decoration-ink disabled:opacity-50"
    >
      {children}
    </button>
  );
}

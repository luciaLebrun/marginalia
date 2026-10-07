"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";

import {
  editPassageAction,
  keepPassageAction,
  removePassageAction,
  type PassageState,
} from "@/app/actions";
import { PASSAGE_MAX, PASSAGE_NOTE_MAX } from "@/lib/client-safe";

/*
 * Lives here rather than beside the actions: a "use server" module may export
 * only async functions.
 */
const INITIAL: PassageState = { kept: 0, error: null, signedOut: false };

type Field = "words" | "page" | "note";

/** A passage as the sheet edits it; the page arrives as a number or nothing. */
export interface PassageDraft {
  id: string;
  words: string;
  page: number | null;
  note: string | null;
}

/**
 * Keep a passage (MRG-110): a line under the book page's reads that opens in
 * place, as the log sheet does — a native <details>, never a modal. Keyed on
 * how many it has kept, so a save closes it empty while a refusal leaves what
 * was typed exactly where it was.
 */
export function KeepPassage({ bookId }: Readonly<{ bookId: string }>) {
  const [state, submit, pending] = useActionState(keepPassageAction, INITIAL);
  return (
    <>
      <Sheet key={state.kept} state={state} submit={submit} pending={pending} bookId={bookId} />
      <output className="sr-only">
        {/* The words change on every save: a live region repeating itself word
            for word is not announced a second time. */}
        {state.kept > 0 && (state.kept % 2 ? "Passage kept in your Margins." : "Kept in your Margins.")}
      </output>
    </>
  );
}

/** The same sheet, opened from a passage in Margins, holding its words. */
export function EditPassage({ passage }: Readonly<{ passage: PassageDraft }>) {
  const [state, submit, pending] = useActionState(editPassageAction, INITIAL);
  return <Sheet key={state.kept} state={state} submit={submit} pending={pending} edit={passage} />;
}

function Sheet({
  state,
  submit,
  pending,
  bookId,
  edit,
}: Readonly<{
  state: PassageState;
  submit: (form: FormData) => void;
  pending: boolean;
  bookId?: string;
  edit?: PassageDraft;
}>) {
  const ids = useId();
  const [words, setWords] = useState(edit?.words ?? "");
  const errorFor = (field: Field) => state.fieldErrors?.[field] ?? null;

  return (
    <details className={edit ? "group/passage" : "group mt-6 max-w-[34rem]"}>
      {edit ? (
        <summary className="band-label inline-flex cursor-pointer list-none text-ink-soft underline decoration-rule underline-offset-4 transition-colors group-open/passage:text-ink hover:text-ink hover:decoration-ink [&::-webkit-details-marker]:hidden">
          <span className="group-open/passage:hidden">Edit</span>
          <span aria-hidden="true" className="hidden group-open/passage:inline">
            Close
          </span>
        </summary>
      ) : (
        <summary className="flex h-[3.25rem] cursor-pointer list-none items-center justify-between gap-4 border-b-2 border-rule px-3 text-ink-soft transition-colors group-open:border-ink group-open:text-ink hover:border-ink hover:text-ink focus-visible:border-ink focus-visible:text-ink [&::-webkit-details-marker]:hidden">
          <span className="band-label">
            <span className="group-open:sr-only">Keep a passage</span>
            <span aria-hidden="true" className="hidden group-open:inline">
              Close
            </span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
            <path d="M6 18c2.4-1.2 3.5-3.4 3.5-6.5H5.5V6h6v5.2c0 4.3-2 6.9-5.5 8.3M14 18c2.4-1.2 3.5-3.4 3.5-6.5h-4V6h6v5.2c0 4.3-2 6.9-5.5 8.3" strokeLinejoin="round" />
          </svg>
        </summary>
      )}

      <form action={submit} className={edit ? "mt-3 border-y border-rule" : "border-b border-rule"}>
        {bookId && <input type="hidden" name="bookId" value={bookId} />}
        {edit && <input type="hidden" name="id" value={edit.id} />}

        <Row label="The passage" htmlFor={`${ids}-words`} error={errorFor("words")} errorId={`${ids}-words-error`}>
          <Ruled error={errorFor("words")}>
            <textarea
              id={`${ids}-words`}
              name="words"
              rows={4}
              required
              maxLength={PASSAGE_MAX}
              value={words}
              onChange={(event) => setWords(event.target.value)}
              aria-invalid={errorFor("words") ? true : undefined}
              aria-describedby={errorFor("words") ? `${ids}-words-error` : `${ids}-words-count`}
              className="w-full resize-none bg-transparent py-1 text-[1.0625rem] leading-relaxed outline-none [field-sizing:content]"
            />
          </Ruled>
          <p id={`${ids}-words-count`} className="mt-2 text-[0.8125rem] text-ink-soft tabular-nums">
            {words.length} / {PASSAGE_MAX}
          </p>
        </Row>

        <div className="grid grid-cols-[6rem_minmax(0,1fr)]">
          <Row label="Page" htmlFor={`${ids}-page`} error={errorFor("page")} errorId={`${ids}-page-error`}>
            <Ruled error={errorFor("page")}>
              <input
                id={`${ids}-page`}
                name="page"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                defaultValue={edit?.page ?? ""}
                placeholder="—"
                aria-invalid={errorFor("page") ? true : undefined}
                aria-describedby={errorFor("page") ? `${ids}-page-error` : undefined}
                className="w-full bg-transparent py-1 text-[1.375rem] leading-snug font-semibold tabular-nums outline-none placeholder:text-ink-soft"
              />
            </Ruled>
          </Row>
          <Row label="Your note" htmlFor={`${ids}-note`} error={errorFor("note")} errorId={`${ids}-note-error`}>
            <Ruled error={errorFor("note")}>
              <input
                id={`${ids}-note`}
                name="note"
                maxLength={PASSAGE_NOTE_MAX}
                autoComplete="off"
                defaultValue={edit?.note ?? ""}
                placeholder="Optional"
                aria-invalid={errorFor("note") ? true : undefined}
                aria-describedby={errorFor("note") ? `${ids}-note-error` : undefined}
                className="w-full bg-transparent py-1 text-[0.9375rem] leading-relaxed outline-none placeholder:text-ink-soft"
              />
            </Ruled>
          </Row>
        </div>

        {/* A field's own refusal is set under that field; this line is for
            the rest — signed out, a book that is gone. */}
        {state.error && !state.fieldErrors && (
          <p role="alert" className="px-3 pt-4 text-[0.9375rem] leading-relaxed text-alarm">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || words.trim() === ""}
          className="band-label mt-4 flex w-full items-baseline bg-band-fiction px-3 py-4 text-left text-ink disabled:cursor-not-allowed disabled:line-through disabled:opacity-50"
        >
          <span className="font-stretch-[118%] tracking-[0.2em]">
            {pending ? "Keeping…" : edit ? "Keep the changes" : "Keep it"}
          </span>
        </button>
      </form>

      {edit && <RemovePassage id={edit.id} />}
    </details>
  );
}

/** Two presses, as a read's removal is: the first asks, focus lands on the way out. */
function RemovePassage({ id }: Readonly<{ id: string }>) {
  const [armed, setArmed] = useState(false);
  const [disarmed, setDisarmed] = useState(false);
  const keepRef = useRef<HTMLButtonElement>(null);
  const armRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (armed) keepRef.current?.focus();
    else if (disarmed) armRef.current?.focus();
  }, [armed, disarmed]);

  if (!armed) {
    return (
      <div className="py-4">
        <button
          ref={armRef}
          type="button"
          onClick={() => setArmed(true)}
          className="band-label underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink"
        >
          Remove this passage
        </button>
      </div>
    );
  }

  return (
    <form action={removePassageAction} className="flex flex-wrap items-center gap-x-5 gap-y-3 py-4">
      <input type="hidden" name="id" value={id} />
      <p className="w-full text-[0.9375rem] leading-relaxed text-alarm">Remove this passage for good?</p>
      <button
        ref={keepRef}
        type="button"
        onClick={() => {
          setArmed(false);
          setDisarmed(true);
        }}
        className="band-label underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink"
      >
        Keep it
      </button>
      <button type="submit" className="band-label border border-alarm px-3 py-2.5 text-alarm transition-colors">
        Remove
      </button>
    </form>
  );
}

function Row({
  label,
  htmlFor,
  error,
  errorId,
  children,
}: Readonly<{ label: string; htmlFor: string; error: string | null; errorId: string; children: React.ReactNode }>) {
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

function Ruled({ error, children }: Readonly<{ error: string | null; children: React.ReactNode }>) {
  return (
    <div className={`border-b-2 transition-colors ${error ? "border-alarm" : "border-rule focus-within:border-ink"}`}>
      {children}
    </div>
  );
}

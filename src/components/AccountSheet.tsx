"use client";

import { useActionState, useState } from "react";

import { saveAccountAction, type AccountState } from "@/app/actions";
import { BIO_MAX, NAME_MAX } from "@/lib/account";
import { MAX_LENGTH as USERNAME_MAX } from "@/lib/username";

/*
 * Lives here rather than beside the action: a "use server" module may export
 * only async functions, and a plain object among them breaks the whole file at
 * the server-action boundary — silently at render, loudly on submit.
 */
const INITIAL_STATE: AccountState = { error: null, field: null, saved: false };

export interface AccountValues {
  name: string;
  username: string;
  bio: string;
}

/**
 * The account sheet: one form, one commit.
 *
 * Every field here lives in the same database row and is written by a single
 * UPDATE, so the page can honestly say "3 changes pending" and mean it — the
 * count is the number of fields that differ from what is stored, and pressing
 * commit either lands all of them or none.
 *
 * The commit band is the only thing on this project pinned to the viewport,
 * and it earns that: a page that silently holds unsaved work is the failure
 * this arrangement exists to prevent. It is not rendered at all while nothing
 * is pending, so the exception costs nothing in the resting state.
 *
 * Everything below the form — the invite run, sign out, the delete fence —
 * arrives as `children` and is rendered *between* the form and the band. That
 * is the whole reason this component wraps them: `position: sticky` only holds
 * inside its own containing block, so a band that lived inside the `<form>`
 * would unpin the moment the reader scrolled past the last field, which is
 * precisely the stretch of page where unsaved work must not go quiet. The band
 * reaches the form by id instead of by nesting.
 */
const FORM_ID = "account-sheet";

export function AccountSheet({
  initial,
  children,
}: Readonly<{ initial: AccountValues; children?: React.ReactNode }>) {
  const [state, submit, pending] = useActionState<AccountState, FormData>(
    saveAccountAction,
    INITIAL_STATE,
  );
  const [values, setValues] = useState<AccountValues>(initial);

  const set = (key: keyof AccountValues) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  // Compared against what the server last rendered. After a successful commit
  // the page revalidates and `initial` arrives as the new truth, so the count
  // returns to zero without this component tracking the save itself.
  const pendingKeys = (Object.keys(values) as (keyof AccountValues)[]).filter(
    (key) => values[key].trim() !== initial[key].trim(),
  );
  const handleMoved = values.username.trim() !== initial.username.trim();

  return (
    <>
      <form id={FORM_ID} action={submit}>
        <div className="flex flex-col">
          <Field
            name="name"
            label="Name"
            hint="Set at display size across the top of your diary."
            value={values.name}
            onChange={set("name")}
            maxLength={NAME_MAX}
            error={state.field === "name" ? state.error : null}
          />

          <Field
            name="username"
            label="Handle"
            prefix="@"
            hint={
              handleMoved
                ? `Your diary moves to /@${values.username.trim() || "…"}. The old address stops working immediately and anyone may take it.`
                : "The public address of your diary."
            }
            hintUrgent={handleMoved}
            value={values.username}
            onChange={set("username")}
            maxLength={USERNAME_MAX}
            error={state.field === "username" ? state.error : null}
          />

          <Field
            name="bio"
            label="Note"
            hint="A few lines under your handle on your diary. Optional."
            value={values.bio}
            onChange={set("bio")}
            maxLength={BIO_MAX}
            multiline
            error={state.field === "bio" ? state.error : null}
          />
        </div>

        {/* An error with no field of its own would otherwise never be shown. */}
        {state.error && state.field === null && (
          <p role="alert" className="px-4 pt-4 text-[0.9375rem] text-alarm sm:px-6">
            {state.error}
          </p>
        )}
      </form>

      {children}

      <CommitBand count={pendingKeys.length} pending={pending} saved={state.saved} />
    </>
  );
}

/**
 * The commit band. Sticky to the foot of the viewport while work is pending,
 * gone entirely when it is not — so the page is never wearing a bar that says
 * nothing.
 */
function CommitBand({
  count,
  pending,
  saved,
}: Readonly<{ count: number; pending: boolean; saved: boolean }>) {
  if (count === 0) {
    return saved ? (
      <p
        role="status"
        className="band-label border-t border-rule px-4 py-4 text-ink-soft sm:px-6"
      >
        Saved
      </p>
    ) : null;
  }

  const noun = count === 1 ? "change" : "changes";

  return (
    <div className="sticky bottom-0 border-t border-ink bg-paper">
      {/*
        The count sits next to the verb rather than at the far end of the band.
        Pushed apart by `justify-between` it ends up a thousand pixels from the
        word it qualifies on a laptop, which is two facts rather than one
        sentence. Full ink, not 80%: ink on the fiction band is 4.9:1, and the
        same tone at 80% falls to 3.9:1 — under the floor for the one live
        readout on the page. Width and tracking separate them instead.
      */}
      <button
        type="submit"
        form={FORM_ID}
        disabled={pending}
        className="band-label flex w-full flex-wrap items-baseline gap-x-4 gap-y-1 bg-band-fiction px-4 py-4 text-left text-ink transition-opacity disabled:opacity-60 sm:px-6"
      >
        <span className="font-stretch-[118%] tracking-[0.2em]">
          {pending ? "Saving…" : "Save"}
        </span>
        <span className="tabular-nums">
          {count} {noun} pending
        </span>
      </button>
    </div>
  );
}

/**
 * One row of the sheet. Label in the band voice, value on a ruled line — the
 * pairing this world already uses everywhere else.
 *
 * The rule under the value is the whole control: hairline at rest, solid ink
 * on focus, and drawn in the error tone when this field is what failed. There
 * is no box, no fill and no radius, because nothing else here has one.
 */
function Field({
  name,
  label,
  hint,
  hintUrgent = false,
  prefix,
  value,
  onChange,
  maxLength,
  multiline = false,
  error,
}: Readonly<{
  name: string;
  label: string;
  hint: string;
  hintUrgent?: boolean;
  prefix?: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  multiline?: boolean;
  error: string | null;
}>) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;

  const shared = {
    id: name,
    name,
    value,
    maxLength,
    "aria-describedby": error ? `${hintId} ${errorId}` : hintId,
    "aria-invalid": error ? (true as const) : undefined,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => onChange(event.target.value),
    className:
      "w-full bg-transparent py-1 text-[1.375rem] leading-snug font-semibold tracking-[-0.01em] outline-none placeholder:font-normal placeholder:text-ink-soft/60",
  };

  return (
    <div className="border-b border-rule px-4 py-5 sm:px-6">
      <label htmlFor={name} className="band-label block text-ink-soft">
        {label}
      </label>

      {/* Capped, so the rule under a value is a line on a page rather than a
          1400px stroke across a laptop. */}
      <div
        className="mt-2 flex max-w-[34rem] items-baseline border-b-2 focus-within:border-ink"
        style={{ borderColor: error ? "var(--color-alarm)" : "var(--color-rule)" }}
      >
        {prefix && (
          <span aria-hidden="true" className="pr-0.5 text-[1.375rem] text-ink-soft">
            {prefix}
          </span>
        )}
        {multiline ? (
          /*
            `field-sizing: content` grows the box to the text instead of
            clipping it. Where it is unsupported the two rows and the scroll
            that comes with them are the fallback, which is why overflow is
            left alone rather than hidden.
          */
          <textarea
            {...shared}
            rows={2}
            className={`${shared.className} resize-none [field-sizing:content]`}
          />
        ) : (
          <input {...shared} type="text" autoComplete="off" spellCheck={false} />
        )}
      </div>

      <p
        id={hintId}
        className="mt-2 max-w-[38rem] text-[0.8125rem] leading-relaxed"
        style={{ color: hintUrgent ? "var(--color-alarm)" : "var(--color-ink-soft)" }}
      >
        {hint}
      </p>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1 text-[0.8125rem] leading-snug text-alarm"
        >
          {error}
        </p>
      )}
    </div>
  );
}

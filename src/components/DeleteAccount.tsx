"use client";

import { useActionState, useState } from "react";

import { deleteAccountAction, type DeleteState } from "@/app/actions";

/**
 * The last thing on the page, and the only block on it fenced in solid ink.
 *
 * Deleting is guarded by typing the handle back rather than by a confirm
 * dialog. A dialog can be dismissed by reflex; this cannot be satisfied
 * without reading what it asks for. It is the convention of the craft bar this
 * surface was measured against, and it is the right one here — there is no
 * soft delete and no grace period behind it.
 */
export function DeleteAccount({ username }: Readonly<{ username: string }>) {
  const [state, submit, pending] = useActionState<DeleteState, FormData>(
    deleteAccountAction,
    { error: null },
  );
  const [typed, setTyped] = useState("");

  const matches = typed.trim().replace(/^@/, "").toLowerCase() === username;

  return (
    <section aria-labelledby="delete-heading" className="m-4 border border-ink sm:m-6">
      <h2 id="delete-heading" className="band-label bg-ink px-2.5 py-2 text-paper">
        Delete this account
      </h2>

      <form action={submit} className="flex flex-col gap-4 px-3 py-5 sm:px-4">
        <p className="max-w-[38rem] text-[0.9375rem] leading-relaxed text-ink-soft">
          This erases your diary, every entry and review in it, and the
          invitations you issued. Your handle becomes available to someone else.
          There is no undo and no copy kept.
        </p>

        <label htmlFor="confirm" className="band-label text-ink-soft">
          Type <span className="normal-case">@{username}</span> to confirm
        </label>

        <div className="flex max-w-[24rem] items-baseline border-b-2 border-rule focus-within:border-ink">
          <span aria-hidden="true" className="pr-0.5 text-[1.375rem] text-ink-soft">
            @
          </span>
          <input
            id="confirm"
            name="confirm"
            type="text"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-describedby={state.error ? "delete-error" : undefined}
            aria-invalid={state.error ? true : undefined}
            className="w-full bg-transparent py-1 text-[1.375rem] font-semibold outline-none"
          />
        </div>

        {state.error && (
          <p
            id="delete-error"
            role="alert"
            className="text-[0.8125rem] leading-snug text-alarm"
          >
            {state.error}
          </p>
        )}

        {/*
          Disabled until the handle matches. The mark for unavailable in this
          world is a rule run through the label, not a greyed-out box.
        */}
        <button
          type="submit"
          disabled={!matches || pending}
          className="band-label self-start border px-3 py-2.5 transition-colors enabled:hover:bg-band-fiction enabled:focus-visible:bg-band-fiction disabled:line-through disabled:opacity-50"
          style={{ borderColor: matches ? "var(--color-alarm)" : "var(--color-rule)" }}
        >
          {pending ? "Deleting…" : "Delete this account"}
        </button>
      </form>
    </section>
  );
}

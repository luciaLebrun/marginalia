"use client";

import { useActionState } from "react";

import { claimUsernameAction, type ClaimState } from "@/app/actions";
import { MAX_LENGTH } from "@/lib/username";

/**
 * Claiming a username, shaped as a tri-band cell like every other object in
 * this world: colour band, field, record band.
 */
export function ClaimForm({
  devUserId,
}: Readonly<{
  /**
   * Only the development harness passes this. In production the action takes
   * the reader from the session and ignores anything sent in the form.
   */
  devUserId?: string;
}>) {
  const [state, submit, pending] = useActionState<ClaimState, FormData>(
    claimUsernameAction,
    { error: null },
  );

  return (
    <form action={submit} className="max-w-[26rem] border border-ink bg-paper">
      {devUserId && <input type="hidden" name="devUserId" value={devUserId} />}

      <div className="band-label bg-ink px-2.5 py-2 text-paper">Your handle</div>

      <div className="flex flex-col gap-3 px-3 py-5">
        <label
          htmlFor="username"
          className="text-[1.375rem] leading-tight font-semibold tracking-[-0.01em]"
        >
          Pick a username
        </label>
        <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
          It becomes the address of your diary, and it cannot be changed later.
          Letters, numbers and underscores.
        </p>

        <div className="mt-1 flex items-baseline border-b border-ink">
          <span aria-hidden="true" className="pr-0.5 text-[1.375rem] text-ink-soft">
            @
          </span>
          <input
            id="username"
            name="username"
            type="text"
            required
            autoFocus
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={MAX_LENGTH}
            aria-describedby={state.error ? "username-error" : undefined}
            aria-invalid={state.error ? true : undefined}
            className="w-full bg-transparent py-1 text-[1.375rem] font-semibold tracking-[-0.01em] outline-none placeholder:font-normal placeholder:text-ink-soft/60"
            placeholder="lucia"
          />
        </div>

        {state.error && (
          <p
            id="username-error"
            role="alert"
            className="text-[0.9375rem] leading-snug"
            style={{ color: "#951D10" }}
          >
            {state.error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="band-label w-full border-t border-ink bg-band-fiction px-2.5 py-3 text-left text-ink transition-opacity disabled:opacity-60"
      >
        {pending ? "Claiming…" : "Claim it"}
      </button>
    </form>
  );
}

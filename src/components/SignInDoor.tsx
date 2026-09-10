"use client";

import { useActionState } from "react";

import { beginSignInAction, type DoorState } from "@/app/actions";

import { CodeMask } from "./CodeMask";

/**
 * The door. One tri-band cell: what this is, the code that opens it, and the
 * hand-off to Google.
 *
 * The code field is optional rather than a second path, because an existing
 * member needs no code — `enforceInvite` runs only when an account is being
 * created. Two buttons would make the reader classify themselves before they
 * have done anything; one button lets the gate decide, which it does anyway.
 */
export function SignInDoor() {
  const [state, submit, pending] = useActionState<DoorState, FormData>(
    beginSignInAction,
    { error: null },
  );

  return (
    <form action={submit} className="max-w-[30rem] border border-ink bg-paper">
      <div className="band-label bg-ink px-2.5 py-2 text-paper">
        Invitation only
      </div>

      <div className="flex flex-col gap-5 px-3 py-6 sm:px-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-[2.25rem]">
            A reading diary, kept between friends.
          </h1>
          <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
            Enter the code a member sent you. If you already have an account,
            leave it blank — Google is only the doorway.
          </p>
        </div>

        <CodeMask
          name="code"
          invalid={state.error !== null}
          describedBy={state.error ? "code-error" : undefined}
        />

        {state.error && (
          <p
            id="code-error"
            role="alert"
            className="text-[0.9375rem] leading-snug text-alarm"
          >
            {state.error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="band-label w-full border-t border-ink bg-band-fiction px-2.5 py-3.5 text-left text-ink transition-opacity disabled:opacity-60"
      >
        {pending ? "Taking you to Google…" : "Continue with Google"}
      </button>
    </form>
  );
}

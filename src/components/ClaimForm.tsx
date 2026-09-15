"use client";

import { useActionState, useState } from "react";

import { claimUsernameAction, type ClaimState } from "@/app/actions";
import { MAX_LENGTH } from "@/lib/username";

/**
 * Claiming a username, shaped as a tri-band cell like every other object in
 * this world: colour band, field, record band.
 */
export function ClaimForm({
  suggestion,
  devUserId,
}: Readonly<{
  /** A handle built from the reader's own name, shown as the placeholder only. */
  suggestion: string;
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
  const [typed, setTyped] = useState("");
  // A refusal is about what was sent. Once the reader types again it is no
  // longer true, so it stands down and the ink focus line takes over.
  const [editedSinceSubmit, setEditedSinceSubmit] = useState(false);
  const error = editedSinceSubmit ? null : state.error;

  return (
    // noValidate: an empty field is refused by the action in this world's own
    // alarm sentence, not by the browser's bubble.
    <form
      action={(formData) => {
        setEditedSinceSubmit(false);
        submit(formData);
      }}
      noValidate className="max-w-[26rem] border border-ink bg-paper">
      {devUserId && <input type="hidden" name="devUserId" value={devUserId} />}

      {/* The band carries the address the handle becomes, as it is typed. At
          rest it is left unwritten — a ruled blank after /@ — so the suggestion
          in the field is never also printed as if it were already an address. */}
      <div aria-hidden="true" className="flex items-baseline bg-ink px-2.5 py-2 text-[0.8125rem] font-medium text-paper">
        /@
        {typed.trim() ? (
          typed.trim().toLowerCase()
        ) : (
          <span className="ml-0.5 inline-block w-16 border-b border-paper/50" />
        )}
      </div>

      <div className="flex flex-col gap-3 px-3 py-5">
        <label
          htmlFor="username"
          className="text-[1.375rem] leading-tight font-semibold tracking-[-0.01em]"
        >
          Pick a username
        </label>
        <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
          It becomes the address of your diary. You can change it later, but
          the old address stops working. Letters, numbers and underscores.
        </p>

        <div
          className={`mt-1 flex items-baseline border-b-2 transition-colors ${
            error ? "border-alarm" : "border-rule focus-within:border-ink"
          }`}
        >
          <span aria-hidden="true" className="pr-0.5 text-[1.375rem] text-ink-soft">
            @
          </span>
          <input
            id="username"
            name="username"
            type="text"
            autoFocus
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={MAX_LENGTH}
            onChange={(event) => {
              setTyped(event.target.value);
              setEditedSinceSubmit(true);
            }}
            aria-describedby={error ? "username-error" : undefined}
            aria-invalid={error ? true : undefined}
            className="w-full bg-transparent py-1 text-[1.375rem] font-semibold tracking-[-0.01em] outline-none placeholder:font-normal placeholder:text-ink-soft"
            placeholder={suggestion}
          />
        </div>

        {error && (
          <p
            id="username-error"
            role="alert"
            className="text-[0.9375rem] leading-snug text-alarm"
          >
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="band-label w-full border-t border-ink bg-band-fiction px-2.5 py-3 text-left text-ink disabled:cursor-progress"
      >
        {pending ? "Claiming…" : "Claim it"}
      </button>
    </form>
  );
}

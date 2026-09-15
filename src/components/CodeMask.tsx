"use client";

import { useId, useState } from "react";

import { ALPHABET, CODE_LENGTH, GROUP } from "@/lib/invite-code";

/**
 * Anything outside the code alphabet, dropped as it is typed. Built from the
 * alphabet itself so the mask cannot drift from what the server will accept.
 */
const DISALLOWED = new RegExp(`[^${ALPHABET}]`, "g");

/**
 * The invite code, set in eight drawn cells with the dash between the groups —
 * the same cells the account sheet uses to show a code, so a code looks the
 * same being typed as it does being handed out.
 *
 * One real `<input>` does all the work: it holds the whole value, takes a
 * paste, works with a password manager and with a phone keyboard, and carries
 * the label, the error and the focus ring. The cells are drawn behind it and
 * the input's own text and caret are made invisible. Eight separate inputs
 * would look identical and break every one of those behaviours.
 *
 * Empty cells are drawn rather than left blank: the mask says how long a code
 * is before you have typed any of it, the way an unfilled slot on the shelf is
 * ruled rather than absent.
 */
export function CodeMask({
  name,
  invalid,
  describedBy,
}: Readonly<{
  name: string;
  invalid: boolean;
  describedBy?: string;
}>) {
  const id = useId();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  const cells = Array.from({ length: CODE_LENGTH }, (_, i) => value[i] ?? "");
  // The cell the next character lands in; past the end, nothing is waiting.
  const cursor = value.length < CODE_LENGTH ? value.length : -1;

  return (
    <div>
      <label htmlFor={id} className="band-label block text-ink-soft">
        Invite code
      </label>

      <div className="relative mt-2">
        <div aria-hidden="true" className="flex items-stretch gap-1 select-none">
          {cells.map((char, i) => (
            <Cell
              key={`${id}-${i}`}
              char={char}
              active={focused && i === cursor}
              invalid={invalid}
              dashAfter={i === GROUP - 1}
            />
          ))}
        </div>

        {/*
          Sits exactly over the cells with its own text and caret invisible.
          Not `opacity: 0`, which would take the field out of forced-colours
          mode and hide it entirely from Windows high contrast.
        */}
        <input
          id={id}
          name={name}
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={CODE_LENGTH}
          value={value}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(event) => {
            // Forgive what a person actually types: lowercase, spaces, a dash
            // they add themselves. Characters outside the alphabet are dropped
            // rather than rejected, so a pasted "k7qm-3xpt" simply works.
            setValue(
              event.target.value
                .toUpperCase()
                .replace(DISALLOWED, "")
                .slice(0, CODE_LENGTH),
            );
          }}
          className="absolute inset-0 w-full bg-transparent text-transparent caret-transparent outline-none"
        />
      </div>
    </div>
  );
}

/**
 * One cell. Its state is a printed mark rather than chrome: a hairline while
 * empty, solid ink once it carries a character, and the ground sunk on the
 * cell waiting for the next keystroke.
 */
function Cell({
  char,
  active,
  invalid,
  dashAfter,
}: Readonly<{
  char: string;
  active: boolean;
  invalid: boolean;
  dashAfter: boolean;
}>) {
  const border = invalid
    ? "var(--color-alarm)"
    : char || active
      ? "var(--color-ink)"
      : "var(--color-rule)";

  return (
    <>
      <span
        className="flex h-12 flex-1 items-center justify-center border text-[1.375rem] font-semibold tabular-nums sm:h-14 sm:text-[1.75rem]"
        style={{
          borderColor: border,
          background: active ? "var(--color-paper-sunk)" : "transparent",
        }}
      >
        {char}
      </span>
      {dashAfter && (
        <span className="flex h-12 w-3 shrink-0 items-center justify-center text-ink-soft sm:h-14">
          {/* Drawn, not a hyphen character: it rules between two groups and
              must not be read out as part of the code. */}
          <svg width="12" height="2" viewBox="0 0 12 2" aria-hidden="true">
            <path d="M0 1h12" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      )}
    </>
  );
}

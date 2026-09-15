"use client";

import { useActionState } from "react";

import { mintInviteAction, type MintState } from "@/app/actions";
import type { InviteRow, InviteState } from "@/lib/invite";

/** What each state means, said in a word — colour is never the only signal. */
const STATE_WORD: Record<InviteState, string> = {
  live: "Unused",
  spent: "Used",
  expired: "Expired",
};

/**
 * The codes this reader has issued, and the control that mints another.
 *
 * A code is set in eight drawn cells, the same mask the door takes it in. A
 * spent or expired code keeps its cells and its characters rather than
 * disappearing — the run reads as a run, and you can see at a glance how many
 * you have handed out against how many are still open.
 */
export function InviteRun({
  invites,
}: Readonly<{ invites: readonly InviteRow[] }>) {
  const [state, mint, pending] = useActionState<MintState, FormData>(
    mintInviteAction,
    { error: null },
  );

  const live = invites.filter((invite) => invite.state === "live").length;

  return (
    <section aria-labelledby="invites-heading" className="border-t border-ink">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 bg-ink px-4 py-3 text-paper sm:px-6">
        <h2 id="invites-heading" className="band-label font-stretch-[118%] tracking-[0.2em]">
          Invitations
        </h2>
        <p className="band-label tabular-nums">
          {live === 0 ? "None unused" : `${live} unused`}
        </p>
      </div>

      {invites.length === 0 ? (
        <p className="px-4 py-5 text-[0.9375rem] leading-relaxed text-ink-soft sm:px-6">
          You have not issued any invitations. Each one opens exactly one
          account and expires after thirty days.
        </p>
      ) : (
        <ul className="px-4 sm:px-6">
          {invites.map((invite) => (
            <InviteLine key={invite.code} invite={invite} />
          ))}
        </ul>
      )}

      <form action={mint} className="px-4 pt-1 pb-5 sm:px-6">
        <button
          type="submit"
          disabled={pending}
          className="band-label border border-ink px-3 py-2.5 transition-colors hover:bg-band-fiction focus-visible:bg-band-fiction disabled:opacity-60"
        >
          {pending ? "Minting…" : "Mint a code"}
        </button>
        {state.error && (
          <p role="alert" className="mt-2 text-[0.8125rem] text-alarm">
            {state.error}
          </p>
        )}
      </form>
    </section>
  );
}

function InviteLine({ invite }: Readonly<{ invite: InviteRow }>) {
  const spent = invite.state !== "live";

  return (
    <li className="border-b border-rule py-4 last:border-b-0">
      {/*
        The code and its state are one object, so they are grouped and capped
        rather than pushed to opposite ends of the row. Held apart by the
        viewport, the word sits a thousand pixels from the code it describes on
        a laptop; wrapped at 360, it lands nearer the next row's rule than its
        own. Tight vertical gap keeps the pair readable when it does wrap.
      */}
      <div className="flex max-w-[34rem] flex-wrap items-center gap-x-5 gap-y-1.5">
        <CodeCells code={invite.code} spent={spent} />

        <p className="band-label text-ink-soft">
          {STATE_WORD[invite.state]}
          {invite.usedByName && (
            <span className="normal-case"> · {invite.usedByName}</span>
          )}
        </p>
      </div>
    </li>
  );
}

/**
 * A code in its cells. A spent code keeps every cell and every character and
 * is run through with a single rule — the printed way of saying "this one is
 * closed" without deleting the evidence that it existed.
 */
function CodeCells({
  code,
  spent,
}: Readonly<{ code: string; spent: boolean }>) {
  // Stored with its dash; the cells want the characters, and the dash is drawn
  // between the groups exactly as the door draws it.
  const characters = [...code.replace("-", "")];
  const group = characters.length / 2;

  return (
    <span className="relative inline-flex items-stretch gap-1">
      {/* The cells are how the code is drawn; the sr-only line below is how it
          is read. Without this, a screen reader spells out eight separate
          characters and never says the code. */}
      {/*
        A closed code steps down to soft ink (6.4:1) rather than fading. At the
        0.55 opacity this started as, the characters read about 4.0:1 — under
        the floor, and a code you cannot read is not evidence that it existed.
        The struck bar and the word beside it carry "closed"; the tone only
        seconds them.
      */}
      <span
        aria-hidden="true"
        className={`inline-flex items-stretch gap-1 ${spent ? "text-ink-soft" : ""}`}
      >
        {characters.map((char, i) => (
          <span key={`${code}-${i}`} className="contents">
            <span className="flex h-9 w-7 items-center justify-center border border-rule text-[0.9375rem] font-semibold tabular-nums sm:w-8">
              {char}
            </span>
            {i === group - 1 && (
              <span className="flex h-9 w-2.5 shrink-0 items-center justify-center text-ink-soft">
                <svg width="10" height="2" viewBox="0 0 10 2" aria-hidden="true">
                  <path d="M0 1h10" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
            )}
          </span>
        ))}
      </span>
      {spent && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 h-px bg-ink"
        />
      )}
      <span className="sr-only">{code}</span>
    </span>
  );
}

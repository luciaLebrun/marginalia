"use client";

import Link, { useLinkStatus } from "next/link";
import { useEffect, useRef } from "react";

const BUTTON = "band-label inline-grid border px-3 py-2.5";

/**
 * "Show 20 more" under a full grid of results (MRG-073). An Outline Button, as
 * every standing control outside a form is.
 *
 * It keeps the reader where they are: `scroll={false}`, because the next books
 * land under the ones already on screen and the merge keeps those in place.
 * `prefetch={false}`, because prefetching it would ask both sources for twenty
 * more books every time the button scrolled into view.
 *
 * Once it cannot show more it stays, ruled through, with the reason beside it
 * — a control is never removed (the Printed State Rule). That is also what
 * keeps this component mounted across the last step, so it can hand keyboard
 * focus on.
 */
export function ShowMore({
  href,
  count,
  step,
  note,
}: Readonly<{
  /** Absent once there is no more to show. */
  href?: string;
  /** Results on the page now; the first new one after a step is `count + 1`. */
  count: number;
  step: number;
  /** Why it is unavailable, beside it. */
  note?: string;
}>) {
  const focusFrom = useRef<number | null>(null);

  // A keyboard reader who asked for more is taken to the first new book, in
  // view where the partial row's empty slots were. Left on the button, they
  // would be under the new rows and walk them backwards; at the last step the
  // button's link goes and focus would fall to the page. A pointer click moves
  // nothing: the pointer is already where the reader wants it.
  useEffect(() => {
    const from = focusFrom.current;
    if (from === null || count <= from) return;
    focusFrom.current = null;
    document
      .querySelector<HTMLElement>(`ol.shelf-grid > li:nth-child(${from + 1}) a`)
      ?.focus({ preventScroll: true });
  }, [count]);

  if (!href) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* A native disabled button, as the delete fence's is: announced as
            unavailable and out of the tab order, which neither a bare span
            nor a span given a link role manages (Sonar S6819). */}
        <button type="button" disabled className={`${BUTTON} border-rule line-through opacity-50`}>
          Show {step} more
        </button>
        <p className="text-[0.8125rem] leading-snug text-ink-soft">{note}</p>
      </div>
    );
  }

  return (
    <Link
      href={href}
      scroll={false}
      prefetch={false}
      // `detail` is 0 when Enter or Space activated it rather than a pointer.
      onClick={(event) => {
        focusFrom.current = event.detail === 0 ? count : null;
      }}
      className={`${BUTTON} border-ink bg-paper transition-colors hover:bg-band-fiction focus-visible:bg-band-fiction`}
    >
      <Label step={step} />
    </Link>
  );
}

/**
 * The pending readout replaces the label in place, as "Removing…" does on an
 * armed Outline Button. Both labels share one grid cell so the button holds
 * the width of the longer and nothing beside it moves.
 */
function Label({ step }: Readonly<{ step: number }>) {
  const { pending } = useLinkStatus();
  return (
    <>
      <span className={`[grid-area:1/1] ${pending ? "invisible" : ""}`}>
        Show {step} more
      </span>
      <span aria-hidden={!pending} className={`[grid-area:1/1] ${pending ? "" : "invisible"}`}>
        Finding more…
      </span>
    </>
  );
}

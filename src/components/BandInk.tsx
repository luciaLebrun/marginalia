"use client";

import { useEffect, useRef } from "react";

/**
 * The colour band of an entry, inked in the first time this reader sees it.
 *
 * Two rules the contract and the craft floor set between them:
 *
 * - **New is decided per record, on the server** (`isNew`, from the reader's
 *   `lastSeenAt`), not by browser storage. A second device, a private window
 *   or a cleared store would otherwise replay the whole shelf's entrance,
 *   which is the revisit flicker this exists to prevent.
 * - **Nothing animates below the fold.** The band only inks when it first
 *   scrolls into view, so a long shelf does not spend its one authored moment
 *   on cells the reader never looks at.
 *
 * The band renders visible from the server; the animation is added afterwards
 * and is `backwards`, so with no JS or under reduced motion nothing is hidden.
 */
export function BandInk({
  isNew,
  background,
  color,
  children,
}: Readonly<{
  isNew: boolean;
  background: string;
  color: string;
  children: React.ReactNode;
}>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!isNew || !node) return;

    if (typeof IntersectionObserver === "undefined") {
      node.classList.add("band-ink");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry], self) => {
        if (!entry.isIntersecting) return;
        node.classList.add("band-ink");
        self.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isNew]);

  return (
    <div
      ref={ref}
      className="flex items-center justify-between gap-2 px-2.5 py-2"
      style={{ background, color }}
    >
      {children}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

/**
 * The phone's way around (MRG-108): a floating bar in thumb reach, below 40rem
 * only. Log sits in the middle as the one raised pill, because capture is the
 * product's first job; the other four are places.
 *
 * The lit slot's pill is one element that slides between slots on a spring
 * curve rather than five that blink, so moving between places reads as moving.
 */
const SLOTS = [
  { href: "/", label: "Diary", icon: "M4 5.5h6.5v13H4zM13.5 5.5H20v13h-6.5z" },
  { href: "/margins", label: "Margins", icon: "M6 18c2.4-1.2 3.5-3.4 3.5-6.5H5.5V6h6v5.2c0 4.3-2 6.9-5.5 8.3M14 18c2.4-1.2 3.5-3.4 3.5-6.5h-4V6h6v5.2c0 4.3-2 6.9-5.5 8.3" },
  { href: "/search?log=1", label: "Log", icon: "M12 5v14M5 12h14" },
  { href: "/to-read", label: "To read", icon: "M7 4h10v16l-5-3.5L7 20z" },
  { href: "/settings", label: "Account", icon: "M12 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5zM4.5 20c.9-3.6 3.9-5.5 7.5-5.5s6.6 1.9 7.5 5.5" },
] as const;

/**
 * Each page draws its own bar, so the pill would arrive already in place.
 * Where it last stood is remembered across pages, and it travels from there.
 */
let lastAt: number | null = null;

function current(path: string): number {
  // The /dev harnesses stand in for the real routes.
  const pathname = path.replace(/^\/dev(?=\/)/, "").replace(/^\/shelf$/, "/");
  if (pathname === "/") return 0;
  // A book is opened from somewhere: it keeps the place the reader came from.
  if (pathname.startsWith("/book")) return lastAt ?? 0;
  if (pathname.startsWith("/margins")) return 1;
  // Search is where Log lands (MRG-110 gave its slot to Margins).
  if (pathname.startsWith("/search")) return 2;
  if (pathname.startsWith("/to-read")) return 3;
  if (pathname.startsWith("/settings")) return 4;
  // A profile is somebody's diary; the reader's own reads as theirs.
  return 0;
}

export function BottomBar() {
  const at = current(usePathname());
  const pill = useRef<HTMLLIElement>(null);

  useLayoutEffect(() => {
    const from = lastAt;
    lastAt = at;
    if (from === null || from === at || !pill.current) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    pill.current.animate(
      [{ transform: `translateX(${from * 100}%)` }, { transform: `translateX(${at * 100}%)` }],
      { duration: 520, easing: "cubic-bezier(0.34, 1.36, 0.5, 1)" },
    );
  }, [at]);

  return (
    <nav
      aria-label="Places"
      // The frost and the transition name live on the <nav>: Chromium did not
      // blur behind the list inside it, whichever of the two carried the name.
      style={{ viewTransitionName: "bottom-bar" }}
      className="bottom-bar fixed rounded-[1.75rem] backdrop-blur-[24px] backdrop-saturate-[1.8] inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 sm:hidden"
    >
      <ul
        className="relative grid grid-cols-5 items-end p-1.5"
        style={{ "--at": at } as React.CSSProperties}
      >
        {/* The sliding pill: one mark that travels between places. */}
        <li
          ref={pill}
          aria-hidden="true"
          // Under Log the raised pill is its own mark, so the slider steps aside.
          className={`bar-pill pointer-events-none absolute inset-y-1.5 left-1.5 w-[calc((100%-0.75rem)/5)] rounded-[1.375rem] ${at === 2 ? "opacity-0" : ""}`}
        />
        {SLOTS.map((slot, i) => {
          const log = i === 2;
          const here = i === at;
          return (
            <li key={slot.label} className="relative">
              <Link
                href={slot.href}
                // Five places, read from Postgres alone: prefetching them whole
                // (data too, not just the loading frame) costs a few small
                // renders and makes a tap land on the real page (MRG-123).
                // The bar is display:none from 40rem, so desktop never fetches.
                prefetch
                aria-current={here ? "page" : undefined}
                transitionTypes={["nav-swap"]}
                className={`bar-slot flex flex-col items-center gap-1 py-2 ${log ? "bar-log" : ""}`}
              >
                <span className={log ? "bar-log-pill grid place-items-center" : "grid place-items-center"}>
                  <svg
                    width={log ? 22 : 21}
                    height={log ? 22 : 21}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={log ? 2.25 : 1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={slot.icon} />
                  </svg>
                </span>
                <span className="bar-label">{slot.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

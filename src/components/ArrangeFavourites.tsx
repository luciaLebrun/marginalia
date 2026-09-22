"use client";

import {
  useLayoutEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
  type PointerEvent,
  type CSSProperties,
  type ReactNode,
} from "react";

import { moveFavouriteAction } from "@/app/actions";

export interface ArrangeItem {
  bookId: string;
  title: string;
  /** The cell, rendered on the server. */
  cell: ReactNode;
}

/** Hold this long on a touch screen before a drag begins; a swipe still scrolls. */
const HOLD_MS = 350;
/** A mouse must travel this far before a press becomes a drag, so a click stays a click. */
const DRAG_SLOP = 6;

interface Press {
  bookId: string;
  pointerId: number;
  x: number;
  y: number;
  touch: boolean;
  active: boolean;
  timer?: ReturnType<typeof setTimeout>;
}

/**
 * The owner's favourites, arranged by drag and drop (MRG-071).
 *
 * - **Mouse:** press and drag a book onto another's position; the rest close
 *   up behind it. A press that does not travel is still a click on the link.
 * - **Touch:** press and hold, then drag. A swipe that starts moving at once is
 *   left to scroll the page, so the band never traps a thumb.
 * - **Keyboard:** Alt and an arrow key move the focused book one place, and
 *   focus stays on it. Dragging is never the only way (WCAG 2.1.1).
 *
 * The order shown is optimistic and settles on what the server returns, so a
 * refused move falls back rather than lingering. Every move is announced.
 * State is printed, per the world: the target position takes an ink ring,
 * the carried book follows the pointer with nothing added — no shadow, no tilt.
 */
export function ArrangeFavourites({
  items,
  max,
  action = moveFavouriteAction,
}: Readonly<{
  items: ArrangeItem[];
  max: number;
  /** The diary harness substitutes one that needs no session. */
  action?: (form: FormData) => Promise<void>;
}>) {
  const serverOrder = items.map((item) => item.bookId);
  const [order, setOrder] = useOptimistic(serverOrder);
  const [, startTransition] = useTransition();
  const [drag, setDrag] = useState<{ bookId: string; dx: number; dy: number; over: number } | null>(
    null,
  );
  const [announcement, setAnnouncement] = useState("");
  const press = useRef<Press | null>(null);
  const cells = useRef(new Map<string, HTMLLIElement>());
  const refocus = useRef<string | null>(null);

  const byId = new Map(items.map((item) => [item.bookId, item]));

  // A keyed item that moves is moved in the DOM, which drops its focus.
  useLayoutEffect(() => {
    const bookId = refocus.current;
    if (!bookId) return;
    refocus.current = null;
    cells.current.get(bookId)?.querySelector<HTMLElement>("a, [tabindex]")?.focus();
  }, [order]);

  function commit(bookId: string, to: number) {
    const from = order.indexOf(bookId);
    const target = Math.max(0, Math.min(order.length - 1, to));
    if (from === -1 || target === from) return;

    const next = order.filter((id) => id !== bookId);
    next.splice(target, 0, bookId);
    setAnnouncement(
      `${byId.get(bookId)?.title} moved to ${target + 1} of ${next.length}.`,
    );
    const form = new FormData();
    form.set("bookId", bookId);
    form.set("to", String(target));
    startTransition(async () => {
      setOrder(next);
      await action(form);
    });
  }

  /**
   * Which position the pointer is over, by the positions' own boxes. Only a
   * carried book's contents travel; its position stays put, so hovering it
   * again means "put it back where it was".
   */
  function positionAt(x: number, y: number): number | null {
    for (const [index, bookId] of order.entries()) {
      const box = cells.current.get(bookId)?.getBoundingClientRect();
      if (box && x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) return index;
    }
    return null;
  }

  // While a touch drag runs the page must not scroll under it. touch-action
  // cannot be switched on mid-gesture, so the one tool left is a non-passive
  // touchmove listener.
  function holdScroll(on: boolean) {
    if (on) document.addEventListener("touchmove", preventTouch, { passive: false });
    else document.removeEventListener("touchmove", preventTouch);
  }

  function begin(state: Press) {
    state.active = true;
    holdScroll(state.touch);
    cells.current.get(state.bookId)?.setPointerCapture?.(state.pointerId);
    setDrag({ bookId: state.bookId, dx: 0, dy: 0, over: order.indexOf(state.bookId) });
  }

  function end() {
    const state = press.current;
    if (state?.timer) clearTimeout(state.timer);
    holdScroll(false);
    press.current = null;
    setDrag(null);
  }

  function onPointerDown(event: PointerEvent<HTMLLIElement>, bookId: string) {
    if (event.button !== 0 || press.current) return;
    const state: Press = {
      bookId,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      touch: event.pointerType !== "mouse",
      active: false,
    };
    if (state.touch) state.timer = setTimeout(() => begin(state), HOLD_MS);
    press.current = state;
  }

  function onPointerMove(event: PointerEvent<HTMLLIElement>) {
    const state = press.current;
    if (!state || event.pointerId !== state.pointerId) return;
    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;

    if (!state.active) {
      if (Math.hypot(dx, dy) < DRAG_SLOP) return;
      // A touch that moves before the hold is a scroll: let it go.
      if (state.touch) return end();
      begin(state);
    }
    const over = positionAt(event.clientX, event.clientY);
    setDrag((current) =>
      current && { ...current, dx, dy, over: over ?? current.over },
    );
  }

  function onPointerUp(event: PointerEvent<HTMLLIElement>) {
    const state = press.current;
    if (!state || event.pointerId !== state.pointerId) return;
    if (state.active) {
      // The press ended on a link; a drag must not also open the book.
      window.addEventListener("click", swallowClick, { capture: true, once: true });
      if (drag) commit(state.bookId, drag.over);
    }
    end();
  }

  function onKeyDown(event: KeyboardEvent<HTMLLIElement>, bookId: string) {
    if (!event.altKey) return;
    const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
    if (!step) return;
    event.preventDefault();
    refocus.current = bookId;
    commit(bookId, order.indexOf(bookId) + step);
  }

  return (
    <>
      <ol className="favourites-grid">
        {order.map((bookId, index) => {
          const item = byId.get(bookId);
          if (!item) return null;
          const carried = drag?.bookId === bookId;
          const target = drag !== null && !carried && drag.over === index;
          return (
            <li
              key={bookId}
              ref={(node) => {
                if (node) cells.current.set(bookId, node);
                else cells.current.delete(bookId);
              }}
              onPointerDown={(event) => onPointerDown(event, bookId)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={end}
              onKeyDown={(event) => onKeyDown(event, bookId)}
              // Links and jackets are natively draggable; this drag is ours.
              onDragStart={(event) => event.preventDefault()}
              // A held press on a phone would otherwise open the link menu.
              onContextMenu={(event) => press.current && event.preventDefault()}
              data-over={target || undefined}
              data-carried={carried || undefined}
              className={`favourite-arrangeable flex flex-col select-none ${
                carried ? "relative z-10 cursor-grabbing" : "cursor-grab"
              }`}
              // The book travels; its position stays put and shows as empty
              // while it is away (globals.css), as any empty position does.
              style={
                carried
                  ? ({ "--carry-x": `${drag.dx}px`, "--carry-y": `${drag.dy}px` } as CSSProperties)
                  : undefined
              }
            >
              {item.cell}
            </li>
          );
        })}
        {Array.from({ length: max - order.length }, (_, i) => (
          <li key={`empty-${i}`} aria-hidden="true" className="flex flex-col">
            <div className="flex-1 border border-rule" />
          </li>
        ))}
      </ol>

      <p id="favourites-arrange-hint" className="text-[0.8125rem] leading-snug text-ink-soft">
        <span className="pointer-coarse:hidden">
          Drag a book to arrange them, or hold Alt (Option on a Mac) and use the arrow keys.
        </span>
        <span className="hidden pointer-coarse:inline">
          Press and hold a book, then drag it to arrange them.
        </span>
      </p>

      <output className="sr-only">{announcement}</output>
    </>
  );
}

function preventTouch(event: TouchEvent) {
  event.preventDefault();
}

function swallowClick(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

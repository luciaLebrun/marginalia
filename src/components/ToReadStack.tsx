"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { Cover } from "./Cover";
import { toggleToReadAction, type ToReadState } from "@/app/actions";
import { bookPath, matchesFilter, showsFilter } from "@/lib/client-safe";
import { spineHeightRem, spineOffsetStep } from "@/lib/spine";
import type { ToReadBook } from "@/lib/to-read";

const INITIAL: ToReadState = { saved: null, bookId: null, error: null, signedOut: false };

/**
 * The bedside stack (MRG-059): the reader's to-read list as the pile of books
 * waiting by the bed. Each book lies as a spine — an ink band, since a book
 * earns its colour by being read — its thickness set by its length and the
 * whole spine set a little off true, the newest saved on top.
 *
 * Taking a book off is owned here rather than by its spine, because the spine
 * goes with it: the announcement and the return of focus outlive the book.
 */
export function ToReadStack({
  books,
  action = toggleToReadAction,
}: Readonly<{
  books: ToReadBook[];
  /** The dev harness's session-free stand-in for the take-off action (MRG-079). */
  action?: (previous: ToReadState, form: FormData) => Promise<ToReadState>;
}>) {
  const [state, submit] = useActionState<ToReadState, FormData>(action, INITIAL);
  const stackRef = useRef<HTMLOListElement>(null);
  const successor = useRef<string | null>(null);
  const handled = useRef<ToReadState>(INITIAL);
  const filterRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState("");
  const shown = books.filter((book) => matchesFilter(book, filter));
  const filterShown = showsFilter(books.length, filter);

  // The spine goes with the book, so note who sits next to it before it does:
  // the one below, or the one above if it was last.
  const takeOff = (formData: FormData) => {
    const at = shown.findIndex((book) => book.bookId === formData.get("bookId"));
    successor.current = (shown[at + 1] ?? shown[at - 1])?.bookId ?? null;
    submit(formData);
  };

  // Once the spine is gone, focus goes to its successor's control, or the
  // heading when the list is empty (MRG-079).
  useEffect(() => {
    if (state.saved !== false || handled.current === state) return;
    if (books.some((book) => book.bookId === state.bookId)) return; // not yet re-rendered
    handled.current = state;
    // Unless the reader has already moved on to something else.
    const at = document.activeElement;
    if (at && at !== document.body) return;
    const next = stackRef.current?.querySelector<HTMLElement>(`[data-take-off="${successor.current}"]`);
    if (next) return next.focus();
    // The only match gone while filtered: back to the field that filtered.
    (filterRef.current ?? document.querySelector("h1"))?.focus();
  }, [state, books]);

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      {books.length === 0 ? (
        <EmptyStack />
      ) : (
        <>
          {filterShown && <Filter ref={filterRef} value={filter} onChange={setFilter} />}
          {shown.length === 0 ? (
            <NoMatch
              filter={filter}
              clear={() => {
                setFilter("");
                filterRef.current?.focus(); // the button unmounts with the message
              }}
            />
          ) : (
            <ol
              ref={stackRef}
              aria-label="Books waiting to be read, newest saved first"
              // The paper between spines is the pile's hairline.
              className="flex max-w-[48rem] flex-col gap-px"
            >
              {shown.map((book) => (
                <Spine
                  key={book.bookId}
                  book={book}
                  takeOff={takeOff}
                  refusal={state.error && state.bookId === book.bookId ? state : null}
                />
              ))}
            </ol>
          )}
        </>
      )}

      <output className="sr-only">
        {announcement(state, books.length, shown.length, filter)}
      </output>
    </div>
  );
}

function Spine({
  book,
  takeOff,
  refusal,
}: Readonly<{
  book: ToReadBook;
  takeOff: (formData: FormData) => void;
  refusal: ToReadState | null;
}>) {
  const height = spineHeightRem(book.pageCount);
  const href = bookPath(book.sourceKey);

  return (
    <li style={{ "--step": spineOffsetStep(book.sourceKey) } as React.CSSProperties}>
      {/* The whole spine lies off true by a stable step — up to half a rem on
          a phone, a rem and a half on a laptop — and gives up that width, so
          both its edges move and the pile never runs past its measure. */}
      <div
        className="group/spine ml-[calc(var(--step)*0.1667rem)] flex w-[calc(100%-0.5rem)] items-stretch bg-ink text-paper sm:ml-[calc(var(--step)*0.5rem)] sm:w-[calc(100%-1.5rem)]"
        style={{ minHeight: `${height}rem` }}
      >
        {/* The spine's words are the link; its ring is paper, drawn inside the
            ink, since the spines above and below are ink too. */}
        <Link
          href={href}
          prefetch={false}
          className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2 focus-visible:outline-paper focus-visible:[outline-offset:-4px] sm:px-4"
        >
          <span className="text-[1.375rem] leading-snug font-semibold tracking-[-0.01em] text-balance underline decoration-paper/40 underline-offset-4 transition-colors group-hover/spine:decoration-paper group-has-[a:focus-visible]/spine:decoration-paper">
            {book.title}
          </span>
          <span className="truncate text-[0.9375rem] text-paper/70">
            {book.authors[0] ?? "Author unknown"}
          </span>
        </Link>

        <form action={takeOff} className="flex shrink-0 items-center px-3">
          <input type="hidden" name="bookId" value={book.bookId} />
          <input type="hidden" name="intent" value="remove" />
          <TakeOffButton bookId={book.bookId} title={book.title} />
        </form>

        {/* The jacket at the spine's end, two-thirds of the spine's height
            wide. A title that wraps grows the spine past that height, and the
            jacket then sits letterboxed on ink — the spine's own ground — never
            on pale bars. (Sizing the well from the rendered height feeds back:
            a wider well wraps the title, which grows the spine, which widens
            the well.) A second way to the same page, so it is kept out of the
            tab order and the tree. A book with no cover has no well: the ink
            runs to the end rather than framing nothing. */}
        {book.coverId !== null && (
          <Link
            href={href}
            prefetch={false}
            tabIndex={-1}
            aria-hidden="true"
            className="flex shrink-0 items-center overflow-hidden border-l border-paper/20 bg-ink"
            style={{ width: `${(height * 2) / 3}rem` }}
          >
            <Cover coverId={book.coverId} coverUrl={book.coverUrl} title={book.title} authors={book.authors} sizes="5rem" />
          </Link>
        )}
      </div>

      {refusal && (
        <p role="alert" className="mt-2 mb-3 ml-[calc(var(--step)*0.1667rem)] text-[0.9375rem] leading-relaxed text-alarm sm:ml-[calc(var(--step)*0.5rem)]">
          {refusal.error}{" "}
          {refusal.signedOut && (
            <Link
              href="/"
              className="underline decoration-alarm/40 underline-offset-4 transition-colors hover:decoration-alarm"
            >
              Sign in again
            </Link>
          )}
        </p>
      )}
    </li>
  );
}

/** Its own component so only the spine being taken off says so. */
function TakeOffButton({ bookId, title }: Readonly<{ bookId: string; title: string }>) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      data-take-off={bookId}
      // aria-disabled, not disabled: disabling the focused control would throw
      // keyboard focus to the page mid-removal (MRG-074).
      aria-disabled={pending || undefined}
      onClick={(event) => {
        if (pending) event.preventDefault();
      }}
      aria-label={`Take ${title} off your list`}
      // Words on the ink band: paper, underlined at 40%, the paper ring.
      className="band-label text-paper underline decoration-paper/40 underline-offset-4 transition-colors hover:decoration-paper focus-visible:outline-paper aria-disabled:cursor-progress"
    >
      {pending ? "Taking off…" : "Take it off"}
    </button>
  );
}

/**
 * Nothing waiting: the outline of the first spine — a ruled blank with its
 * jacket well drawn — and the way to put a book on it. The state most readers
 * meet first, so it shows what the pile will be and says what it is for.
 */
function EmptyStack() {
  return (
    <div className="max-w-[48rem]">
      <div className="flex min-h-[4.5rem] w-[calc(100%-0.5rem)] items-stretch border border-rule sm:w-[calc(100%-1.5rem)]">
        <p className="flex flex-1 items-center px-3 text-[1.375rem] leading-snug font-semibold tracking-[-0.01em] text-ink-soft sm:px-4">
          Nothing waiting
        </p>
        <span aria-hidden="true" className="w-12 shrink-0 border-l border-rule" />
      </div>
      <p className="mt-4 max-w-[34rem] text-[0.9375rem] leading-relaxed text-ink-soft">
        When a book catches your eye, open it and press Want to read. It waits
        here until you log it.
      </p>
      <Link
        href="/search"
        className="band-label mt-4 inline-block border border-ink px-3 py-2.5 transition-colors hover:bg-band-fiction focus-visible:bg-band-fiction"
      >
        Search for a book
      </Link>
    </div>
  );
}

/** What the always-mounted output says: a take-off outranks a filter count. */
function announcement(state: ToReadState, total: number, shown: number, filter: string): string {
  if (state.saved === false) return "Taken off your to-read list.";
  if (filter.trim() === "") return "";
  if (shown === 0) return `Nothing on your list matches “${filter.trim()}”.`;
  return `${shown} of ${total} ${total === 1 ? "book matches" : "books match"}`;
}

/** A native search field on the page's ruled line, labelled in the band voice. */
function Filter({
  ref,
  value,
  onChange,
}: Readonly<{ ref: React.Ref<HTMLInputElement>; value: string; onChange: (value: string) => void }>) {
  return (
    <div className="mb-6 max-w-[34rem]">
      <label htmlFor="to-read-filter" className="band-label block text-ink-soft">
        Find in your list
      </label>
      <div className="mt-2 border-b-2 border-rule transition-colors focus-within:border-ink">
        <input
          ref={ref}
          id="to-read-filter"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Title or author"
          autoComplete="off"
          spellCheck={false}
          className="w-full appearance-none bg-transparent py-1 text-[1.375rem] leading-snug font-semibold tracking-[-0.01em] outline-none placeholder:font-normal placeholder:text-ink-soft [&::-webkit-search-cancel-button]:appearance-none"
        />
      </div>
    </div>
  );
}

/** The filter found nothing: say so, and the way back to the whole pile. Announced by the page's output. */
function NoMatch({ filter, clear }: Readonly<{ filter: string; clear: () => void }>) {
  return (
    <div className="max-w-[48rem]">
      <p className="text-[0.9375rem] leading-relaxed [overflow-wrap:anywhere] text-ink-soft">
        Nothing on your list matches “{filter.trim()}”.
      </p>
      <button
        type="button"
        onClick={clear}
        className="band-label mt-4 inline-block border border-ink px-3 py-2.5 transition-colors hover:bg-band-fiction focus-visible:bg-band-fiction"
      >
        Clear the filter
      </button>
    </div>
  );
}

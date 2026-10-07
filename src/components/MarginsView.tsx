import Link from "next/link";

import { BottomBar } from "./BottomBar";
import { Cover } from "./Cover";
import { Masthead } from "./Masthead";
import { EditPassage } from "./PassageSheet";
import { Place } from "./Place";
import { bookBand } from "@/lib/book-view";
import { bookPath, unquote } from "@/lib/client-safe";
import { DIARY_LINK, TO_READ_LINK } from "@/lib/masthead-link";
import type { MarginPassage } from "@/lib/passage";

/**
 * Margins (MRG-110): the reader's own commonplace book. The words lead — the
 * latest passage owns the first viewport as a quotation, the rest follow as one
 * quiet column, newest first. A jacket is only ever a small stamp, so the page
 * never reads as a second shelf. Private: rendered for its owner only.
 */
export function MarginsView({ passages }: Readonly<{ passages: MarginPassage[] }>) {
  const [latest, ...earlier] = passages;
  const noun = passages.length === 1 ? "passage" : "passages";

  return (
    <>
      <Place>
        <main className="flex-1">
          <div className="m-hidden">
            <Masthead
              name="Margins"
              span={`${passages.length} ${noun}`}
              count={passages.length}
              tally={passages.length === 0 ? "Kept from a book’s page" : "Newest kept first"}
              link={[DIARY_LINK, TO_READ_LINK]}
            />
          </div>

          {latest ? <Spotlight passage={latest} count={passages.length} /> : <Empty />}

          {earlier.length > 0 && (
            <ol className="mx-4 flex flex-col border-t border-rule pb-10 sm:mx-auto sm:max-w-[41rem]">
              {earlier.map((passage) => (
                <li key={passage.id} className="reveal border-b border-rule py-7 last:border-b-0">
                  <Passage passage={passage} />
                </li>
              ))}
            </ol>
          )}
        </main>
      </Place>
      <BottomBar />
    </>
  );
}

/**
 * How large the latest words are set. A short passage takes the display step,
 * so neither the page name nor a heading ever outranks the words; a long one
 * steps down rather than running a viewport of display type.
 */
function wordsSize(words: string): string {
  if (words.length <= 80) return "text-[2.25rem] leading-[1.02] tracking-[-0.02em] sm:text-[3.5rem]";
  if (words.length <= 240) return "text-[1.75rem] leading-[1.18] tracking-[-0.02em] sm:text-[2.25rem] sm:leading-[1.12]";
  return "text-[1.375rem] leading-snug tracking-[-0.01em]";
}

/**
 * The latest passage, set as a quotation. On a phone it floats on its book's
 * flood, as the diary's hero does; on a laptop the book's colour is a band at
 * page scale — the book page's band-two idiom — above words on paper. Either
 * way the colour is earned: a book not on the shelf floods ink.
 */
function Spotlight({ passage, count }: Readonly<{ passage: MarginPassage; count: number }>) {
  const band = bookBand(passage, passage.onShelf);

  return (
    <section
      aria-labelledby="latest-passage"
      className="m-flood sm:mx-auto sm:max-w-[44rem] sm:px-6 sm:pt-10"
      // On a phone the words sit on the flood, so they take its readable
      // foreground; on a laptop they sit on paper in ink.
      style={{ "--flood": band.background, "--tone": band.color } as React.CSSProperties}
    >
      {/* The credit, once: on a laptop the band carries it and opens the book;
          the stamp under the words keeps only its jacket. */}
      <Link
        href={bookPath(passage.sourceKey)}
        transitionTypes={["sheet-up"]}
        prefetch={false}
        className="band-label hidden bg-[var(--flood)] px-4 py-3 text-[var(--tone)] focus-visible:[outline-color:var(--tone)] sm:block"
      >
        <span className="underline decoration-[color-mix(in_srgb,var(--tone)_40%,transparent)] underline-offset-4">{passage.title}</span>
        {[passage.authors[0], passage.page !== null ? `p. ${passage.page}` : null]
          .filter(Boolean)
          .map((part) => ` · ${part}`)
          .join("")}
      </Link>

      <div className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-9 sm:px-0 sm:pt-8 sm:pb-8">
        <div className="m-only flex items-baseline justify-between text-[var(--tone)]">
          <p className="band-wordmark text-[0.75rem] opacity-90">Marginalia</p>
          <p className="text-[0.8125rem] font-medium tabular-nums opacity-80">
            {count} {count === 1 ? "passage" : "passages"}
          </p>
        </div>

        <h1 id="latest-passage" className="sr-only">
          The passage you kept last, from {passage.title}
        </h1>
        <blockquote className="hero-in mt-8 max-sm:text-[var(--tone)] sm:mt-0">
          <p className={`font-semibold text-pretty whitespace-pre-line ${wordsSize(passage.words)}`}>
            <Quoted words={passage.words} />
          </p>
        </blockquote>

        <Stamp passage={passage} large />
        {passage.note && (
          <p className="mt-4 max-w-[34rem] text-[0.9375rem] leading-relaxed text-ink-soft max-sm:text-[var(--tone)] max-sm:opacity-75">
            {passage.note}
          </p>
        )}
        <div className="mt-5">
          <EditPassage passage={passage} />
        </div>
      </div>
    </section>
  );
}

/**
 * A passage between its double quotes, as it would be printed (the user's
 * call, MRG-110): opening and closing marks inline, at every width. The
 * marks are type, not words, so a screen reader hears the blockquote alone.
 */
function Quoted({ words }: Readonly<{ words: string }>) {
  return (
    <>
      <span aria-hidden="true">“</span>
      {unquote(words)}
      <span aria-hidden="true">”</span>
    </>
  );
}

/** An earlier passage: the words first, then the stamp that says where from. */
function Passage({ passage }: Readonly<{ passage: MarginPassage }>) {
  return (
    <article>
      <blockquote>
        {/* The Passage step: body voice a step up, on the 34rem measure. */}
        <p className="max-w-[34rem] text-[1.0625rem] leading-relaxed text-pretty whitespace-pre-line">
          <Quoted words={passage.words} />
        </p>
      </blockquote>
      <Stamp passage={passage} />
      {passage.note && (
        <p className="mt-3 max-w-[34rem] text-[0.8125rem] leading-relaxed text-ink-soft">{passage.note}</p>
      )}
      <div className="mt-3">
        <EditPassage passage={passage} />
      </div>
    </article>
  );
}

/**
 * Where a passage came from: a small jacket, the title and the page. The whole
 * stamp opens the book, whose jacket travels there as it does from the shelf.
 * On the phone's flood (`large`) its words take the flood's tone, never grey.
 */
function Stamp({ passage, large = false }: Readonly<{ passage: MarginPassage; large?: boolean }>) {
  const onFlood = large ? "max-sm:text-[var(--tone)]" : "";
  return (
    <Link
      href={bookPath(passage.sourceKey)}
      transitionTypes={["sheet-up"]}
      prefetch={false}
      className="press group mt-5 inline-flex max-w-full items-center gap-3"
    >
      <span
        // Rounded on the phone only: Tri-band's corners are square.
        className={`m-jacket aspect-[2/3] shrink-0 overflow-hidden border border-rule bg-paper-sunk ${large ? "w-11 max-sm:rounded-[0.375rem]" : "w-8 max-sm:rounded-[0.25rem]"}`}
      >
        <Cover
          coverId={passage.coverId}
          coverUrl={passage.coverUrl}
          title={passage.title}
          authors={passage.authors}
          sizes="3rem"
        />
      </span>
      <span className={`min-w-0 ${large ? "sm:hidden" : ""}`}>
        <span className={`block truncate font-semibold underline decoration-rule underline-offset-4 transition-colors group-hover:decoration-ink ${large ? "text-[0.9375rem]" : "text-[0.8125rem]"} ${onFlood}`}>
          {passage.title}
        </span>
        <span className={`block truncate text-[0.8125rem] text-ink-soft ${large ? "max-sm:text-[var(--tone)] max-sm:opacity-75" : ""}`}>
          {[passage.authors[0], passage.page !== null ? `p. ${passage.page}` : null].filter(Boolean).join(" · ")}
        </span>
      </span>
    </Link>
  );
}

/** First run: nothing kept yet. Says where passages come from, invents none. */
function Empty() {
  return (
    <section className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-10 sm:mx-auto sm:max-w-[44rem] sm:px-6 sm:pt-10">
      <p className="band-wordmark m-only text-[0.75rem]">Marginalia</p>
      <h1 className="mt-6 text-[2.25rem] leading-[0.95] font-semibold tracking-[-0.02em] text-balance sm:mt-0">
        Nothing kept yet
      </h1>
      <p className="mt-4 max-w-[30rem] text-[0.9375rem] leading-relaxed text-ink-soft">
        When a line stops you, open that book’s page and keep the passage — with
        its page, and a word of your own if you like. Everything you keep lands
        here, newest first, and only you can see it.
      </p>
      <Link
        href={DIARY_LINK.href}
        transitionTypes={["nav-swap"]}
        className="press band-label mt-6 inline-flex border border-ink px-3 py-2.5 transition-colors hover:bg-band-fiction"
      >
        Open your diary
      </Link>
    </section>
  );
}

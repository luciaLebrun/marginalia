import { BottomBar } from "./BottomBar";
import { NO_BOOK_FLOOD } from "./NowReading";
import { Place } from "./Place";
import { WordmarkBand } from "./WordmarkBand";
import { readableOn } from "@/lib/color";

/**
 * What a signed-in route shows while its page renders (MRG-120). A route with
 * a `loading.tsx` is prefetched down to this boundary, so the tap lands here at
 * once instead of waiting on the server with nothing on screen.
 *
 * Drawn the way the book page's "Opening…" frame is: the real shells and bands,
 * with ruled empty positions where content will go — never skeleton cards, and
 * nothing moves, so reduced motion needs no case of its own. The bar is the
 * real one, so its pill starts travelling to the tapped place straight away.
 */
export function LoadingFrame({
  children,
  bar = true,
}: Readonly<{ children: React.ReactNode; bar?: boolean }>) {
  return (
    <>
      <Place>
        <main className="flex-1" aria-busy="true">
          <output className="sr-only">Loading…</output>
          {children}
        </main>
      </Place>
      {bar && <BottomBar />}
    </>
  );
}

/** A line of type not yet known, as the book page draws its title. */
function Rule({ className = "" }: Readonly<{ className?: string }>) {
  return <div aria-hidden="true" className={`border-b-2 border-rule ${className}`} />;
}

/**
 * The masthead's frame: wordmark band, the page's name, the record band. The
 * name is set when the page knows it ("To read") and ruled when it is the
 * reader's own.
 */
export function HeadFrame({ name }: Readonly<{ name?: string }>) {
  return (
    <header>
      <WordmarkBand />
      <div className="px-4 py-6 max-sm:px-5 max-sm:pt-4 sm:px-6 sm:py-8">
        {name ? (
          <h1 className="text-[2.25rem] leading-[0.95] font-semibold tracking-[-0.02em] max-sm:text-[2.75rem] max-sm:font-bold max-sm:tracking-[-0.035em] max-sm:[font-stretch:112%] sm:text-[3.5rem]">
            {name}
          </h1>
        ) : (
          <Rule className="h-[2.75rem] max-w-[34rem] sm:h-[3.5rem]" />
        )}
      </div>
      {/* The record band, empty: its height is the real one's. */}
      <div aria-hidden="true" className="h-[2.75rem] bg-ink max-sm:hidden" />
    </header>
  );
}

/**
 * The phone's first viewport: the diary's hero and the margins' quotation both
 * sit on a flood. The ground is the hero's own no-book colour, since the book
 * it will light is not known yet.
 */
export function FloodFrame({ lines = 2, jacket = false }: Readonly<{ lines?: number; jacket?: boolean }>) {
  const flood = NO_BOOK_FLOOD;
  return (
    <header
      className="m-only m-flood px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-9"
      style={{ "--flood": flood, color: readableOn(flood) } as React.CSSProperties}
    >
      <p className="band-wordmark text-[0.75rem] opacity-90">Marginalia</p>
      <div aria-hidden="true" className="mt-8 flex flex-col gap-4">
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className={`h-[2.25rem] border-b-2 border-current opacity-20 ${i === lines - 1 ? "w-2/3" : ""}`} />
        ))}
      </div>
      {/* The real hero's jacket, outlined, so the hand-off does not jump. */}
      {jacket && <div aria-hidden="true" className="mt-7 aspect-[2/3] w-[46%] border border-current opacity-20" />}
    </header>
  );
}

/** The shelf waiting for print: the grid's own hairlines, no cards. */
export function ShelfFrame() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <div aria-hidden="true" className="shelf-grid min-h-[28rem]" />
    </div>
  );
}

/** A ruled row, for the account sheet and the like. */
export function RowsFrame({ rows }: Readonly<{ rows: number }>) {
  return (
    <div aria-hidden="true" className="mx-4 border-t border-rule sm:mx-6">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-16 border-b border-rule" />
      ))}
    </div>
  );
}

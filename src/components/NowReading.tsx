import Link from "next/link";

import { Cover } from "./Cover";
import type { DiaryEntry } from "./Entry";
import { Jacket } from "./Place";
import { Rating } from "./Rating";
import { bandColor, readableOn } from "@/lib/color";
import { bookPath } from "@/lib/client-safe";
import { cellDate } from "@/lib/slip-date";

/**
 * The phone's first viewport on a reader's own diary (MRG-108): the last book
 * they finished, its jacket lit on a field of its own colour. On a laptop the
 * Tri-band masthead does this job, so this renders below 40rem only.
 */
export function NowReading({
  name,
  count,
  span,
  latest,
}: Readonly<{
  name: string | null;
  count: number;
  span: string;
  latest: DiaryEntry | null;
}>) {
  const flood = latest ? bandColor(latest.coverColor, latest.sourceKey) : "#2a2a2e";
  const tone = readableOn(flood);
  const noun = count === 1 ? "book" : "books";

  return (
    <header
      className="m-only m-flood relative overflow-hidden px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8"
      style={{ "--flood": flood } as React.CSSProperties}
    >
      <div className="flex items-baseline justify-between" style={{ color: tone }}>
        <p className="band-wordmark text-[0.75rem] opacity-90">Marginalia</p>
        <p className="text-[0.8125rem] font-medium tabular-nums opacity-80">{span}</p>
      </div>

      <h1
        tabIndex={-1}
        className="mt-6 text-[2.75rem] leading-[0.92] font-bold tracking-[-0.035em] break-words [font-stretch:112%]"
        style={{ color: tone }}
      >
        {name ?? "Your reading"}
      </h1>
      <p className="mt-2 text-[0.9375rem] font-medium" style={{ color: tone }}>
        <span key={count} className="roll tabular-nums">{count}</span>{" "}
        <span className="opacity-75">{count === 0 ? "books logged — yet" : `${noun} logged`}</span>
      </p>

      {latest ? (
        <Link
          href={bookPath(latest.sourceKey)}
          transitionTypes={["sheet-up"]}
          prefetch={false}
          className="press mt-7 flex items-end gap-5"
        >
          <div className="hero-in w-[46%] shrink-0">
            <Jacket sourceKey={latest.sourceKey}>
              <div className="m-jacket aspect-[2/3] bg-paper-sunk">
                <Cover
                  coverId={latest.coverId}
                  coverUrl={latest.coverUrl}
                  title={latest.title}
                  authors={latest.authors}
                  sizes="46vw"
                  scale="page"
                />
              </div>
            </Jacket>
          </div>
          <div className="min-w-0 pb-1 text-ink">
            <p className="text-[1.375rem] leading-[1.1] font-semibold tracking-[-0.02em] text-balance">
              {latest.title}
            </p>
            <p className="mt-1 truncate text-[0.875rem] text-ink-soft">
              {latest.authors[0] ?? "Author unknown"}
              {latest.readAt && ` · ${cellDate(latest.readAt)}`}
            </p>
            {latest.rating !== null && (
              <div className="mt-3">
                <Rating value={latest.rating} tone="currentColor" size={14} />
              </div>
            )}
          </div>
        </Link>
      ) : (
        <div className="mt-8">
          <p className="max-w-[18rem] text-[0.9375rem] leading-relaxed text-ink-soft">
            When you finish a book, find it and set the day you finished. A
            rating and a few words are optional.
          </p>
          <Link
            href="/search?log=1"
            transitionTypes={["nav-swap"]}
            className="press mt-5 inline-flex items-center gap-2 rounded-full bg-band-fiction px-5 py-3.5 text-[0.9375rem] font-semibold"
          >
            Log your first book
          </Link>
        </div>
      )}
    </header>
  );
}

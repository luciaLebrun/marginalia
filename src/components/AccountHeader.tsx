import Link from "next/link";

import { WordmarkBand } from "./WordmarkBand";
import { handlePath } from "@/lib/username";

/**
 * The head of the account sheet, shared by `/settings` and its development
 * harness so the harness renders the real header rather than a lookalike —
 * a screenshot of the harness is then evidence about the real route.
 */
export function AccountHeader({
  username,
  note,
}: Readonly<{
  username: string;
  /** The harness says what it is here; the real route links to the diary. */
  note?: string;
}>) {
  return (
    <>
      <WordmarkBand />
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-[2.25rem] leading-[0.95] font-semibold tracking-[-0.02em] sm:text-[3.5rem]">
          Your account
        </h1>
        {note ? (
          <p className="band-label text-ink-soft">{note}</p>
        ) : (
          <Link
            href={handlePath(username)}
            className="band-label text-ink-soft underline decoration-rule underline-offset-4 hover:decoration-ink"
          >
            View your diary
          </Link>
        )}
      </div>
    </>
  );
}

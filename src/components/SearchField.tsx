import Form from "next/form";

import { MAX_QUERY_LENGTH, isBlank, type BookQuery } from "@/lib/search";

/**
 * The query, as two field rows: title and author, each a label in the band
 * voice over a value on a ruled line, no box. The same pattern as the account
 * sheet, so a search reads as filling in a line on the page rather than as a
 * chrome input.
 *
 * Two lines rather than one box since MRG-068. Both sources take a title and
 * an author apart — Google as `intitle:`/`inauthor:`, Open Library as its own
 * parameters — and rank far better when they are not left to guess which word
 * was which. Either line alone is a search.
 *
 * A GET form rather than search-as-you-type: the query lives in the URL, so
 * Back and a shared link both work, it works without JavaScript, and each
 * source is asked once per search rather than once per pause in typing.
 */
/** Both lines are described by the one hint that governs the pair. */
const HINT_ID = "search-hint";

export function SearchField({
  query,
  action = "/search",
  hidden,
}: Readonly<{
  query: BookQuery;
  action?: string;
  /** Extra parameters to carry through a submit; only the dev harness uses it. */
  hidden?: Record<string, string>;
}>) {
  // Guidance, not a standing caption: once either line is filled the reader
  // has demonstrably followed it, and repeating it instructs someone who is
  // already done — while spending first-viewport height in the one state
  // where that height buys results.
  const hinted = isBlank(query);

  return (
    <Form
      action={action}
      role="search"
      className="border-b border-rule px-4 py-5 sm:px-6"
    >
      {hidden &&
        Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

      <div className="max-w-[34rem] space-y-5">
        <Line name="title" label="Title" value={query.title} hinted={hinted} />
        <Line name="author" label="Author" value={query.author} hinted={hinted} />

        {/* The rule governing both lines, as the Field Row's own hint: under
            the last line, where it is read before the submit rather than
            after it. It used to sit in the record band below the button,
            which put the only sentence saying what this page is for after
            the control it qualifies. Both inputs point at it. */}
        {hinted && (
          <p id={HINT_ID} className="-mt-3 text-[0.8125rem] leading-relaxed text-ink-soft">
            A title, an author, or both.
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="band-label border border-ink px-3 py-2.5 transition-colors hover:bg-band-fiction focus-visible:bg-band-fiction"
          >
            Search
          </button>
        </div>
      </div>
    </Form>
  );
}

/** One line of the query. The Field Row, exactly as the account sheet sets it. */
function Line({
  name,
  label,
  value,
  hinted,
}: Readonly<{ name: string; label: string; value: string; hinted: boolean }>) {
  return (
    <div>
      <label htmlFor={name} className="band-label block text-ink-soft">
        {label}
      </label>

      <div className="mt-2 border-b-2 border-rule transition-colors focus-within:border-ink">
        <input
          // Remounting on a new value is what makes Back restore the field,
          // and it drops focus so a phone keyboard closes over the results.
          key={value}
          id={name}
          name={name}
          type="search"
          defaultValue={value}
          // No autoFocus (Sonar S9379): it moves a screen reader past the
          // page's context, and iOS Safari ignores it without a tap anyway,
          // so the phone — where capture mostly happens — gains nothing.
          // Only while the hint is on the page; a dangling id describes nothing.
          aria-describedby={hinted ? HINT_ID : undefined}
          maxLength={MAX_QUERY_LENGTH}
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full appearance-none bg-transparent py-1 text-[1.375rem] leading-snug font-semibold tracking-[-0.01em] outline-none [&::-webkit-search-cancel-button]:appearance-none"
        />
      </div>
    </div>
  );
}

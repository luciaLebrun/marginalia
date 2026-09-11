import Form from "next/form";

import { MAX_QUERY_LENGTH } from "@/lib/search";

/**
 * The query, as a field row: label in the band voice, the value at the field
 * step on a ruled line, no box. The same pattern as the account sheet, so a
 * search reads as filling in a line on the page rather than as a chrome input.
 *
 * A GET form rather than search-as-you-type: the query lives in the URL, so
 * Back and a shared link both work, it works without JavaScript, and Open
 * Library is asked once per search rather than once per pause in typing.
 */
export function SearchField({
  query,
  action = "/search",
  hidden,
}: Readonly<{
  query: string;
  action?: string;
  /** Extra parameters to carry through a submit; only the dev harness uses it. */
  hidden?: Record<string, string>;
}>) {
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

      <label htmlFor="q" className="band-label block text-ink-soft">
        Search
      </label>

      <div className="mt-2 flex max-w-[34rem] items-end gap-3">
        <div className="min-w-0 flex-1 border-b-2 border-rule transition-colors focus-within:border-ink">
          <input
            // Remounting on a new query is what makes Back restore the field's
            // value, and it drops focus so a phone keyboard closes over results.
            key={query}
            id="q"
            name="q"
            type="search"
            defaultValue={query}
            // No autoFocus (Sonar S9379): it moves a screen reader past the
            // page's context, and iOS Safari ignores it without a tap anyway,
            // so the phone — where capture mostly happens — gains nothing.
            maxLength={MAX_QUERY_LENGTH}
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="w-full appearance-none bg-transparent py-1 text-[1.375rem] leading-snug font-semibold tracking-[-0.01em] outline-none [&::-webkit-search-cancel-button]:appearance-none"
          />
        </div>

        <button
          type="submit"
          className="band-label shrink-0 border border-ink px-3 py-2.5 transition-colors hover:bg-band-fiction focus-visible:bg-band-fiction"
        >
          Search
        </button>
      </div>
    </Form>
  );
}

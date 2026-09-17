/**
 * Live smoke test against the real book APIs. NOT part of CI — CI runs against
 * fixtures so a third-party outage can never turn a PR red.
 *
 * Run with: pnpm smoke:books
 *
 * Verifies what fixtures cannot:
 *   1. Google Books, the primary source, still answers with the fields we ask
 *      for and with a jacket URL on the host we allow
 *   2. the Open Library search endpoint still returns the fields we ask for
 *   3. its results carry a cover_i (the CoverID we depend on)
 *   4. a CoverID-addressed cover URL actually resolves to an image
 *   5. redirect stubs still resolve to the surviving work
 *
 * Open Library connections fail intermittently (connect timeouts and resets
 * alternating with 200s), so every step retries. The app itself does NOT
 * retry — in a serverless request path that just burns the user's time; there
 * it degrades to a "search unavailable" state instead.
 */
import { fetchWork, searchWorks } from "../src/lib/books/openlibrary.ts";
import { searchVolumes, fetchVolume, apiKey } from "../src/lib/books/google-books.ts";
import { coverUrl, sampleUrl } from "../src/lib/books/covers.ts";
import type { BookSummary } from "../src/lib/books/types.ts";
import { bandColorFromCover } from "../src/lib/cover-color.ts";
import { fallbackBand, meetsAA, readableOn } from "../src/lib/color.ts";

const QUERY = process.argv[2] ?? "dune herbert";

// Open Library resets connections often enough that a small budget is not
// enough — especially for the redirect check, which makes two requests per
// attempt. This is generous on purpose: a red smoke run should mean something
// changed, not that the Internet Archive hiccuped.
const ATTEMPTS = 8;

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

/** Retry with linear backoff — the upstream fails at the connection level. */
async function retry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      const cause = (error as { cause?: { message?: string } })?.cause?.message;
      console.warn(
        `  ${label} attempt ${attempt}/${ATTEMPTS} failed: ${cause ?? (error as Error).message}`,
      );
      if (attempt < ATTEMPTS) {
        await new Promise((r) => setTimeout(r, Math.min(attempt * 2000, 8000)));
      }
    }
  }
  throw last;
}

// ---------------------------------------------------------------- Google Books
// The primary source. Skipped rather than failed without a key: no key is a
// supported state, and it is the state a contributor's checkout is in.
if (!apiKey()) {
  console.log("– GOOGLE_BOOKS_API_KEY unset, skipping the Google Books checks");
} else {
  const volumes: BookSummary[] = await retry("google search", () =>
    searchVolumes(QUERY, 5),
  ).catch((error: unknown) => fail(`Google Books search failed: ${(error as Error).message}`));

  if (volumes.length === 0) fail(`Google Books returned nothing for "${QUERY}"`);
  console.log(`✓ Google Books returned ${volumes.length} volumes for "${QUERY}"`);

  const jacketed = volumes.find((v) => v.coverUrl);
  if (!jacketed?.coverUrl) {
    fail("no Google volume carried a jacket — imageLinks may have changed shape");
  }
  // jacketFromImageLinks forces https, drops the page curl and raises the zoom.
  // If Google moves these images, this is where we find out.
  if (!jacketed.coverUrl.startsWith("https://")) {
    fail(`Google jacket was not https: ${jacketed.coverUrl}`);
  }
  const jres = await retry("google jacket", () =>
    fetch(jacketed.coverUrl as string, { redirect: "follow" }),
  ).catch((error: unknown) => fail(`Google jacket fetch failed: ${(error as Error).message}`));
  const jtype = jres.headers.get("content-type") ?? "";
  if (!jres.ok || !jtype.startsWith("image/")) {
    fail(`Google jacket returned ${jres.status} ${jtype} for ${jacketed.coverUrl}`);
  }
  console.log(`✓ "${jacketed.title}" jacket → ${jres.status} ${jtype}`);

  // A volume id from search must still open on its own endpoint: that is the
  // whole path from a search result to a book page.
  const id = jacketed.sourceKey.slice("gb:".length);
  const volume = await retry("google volume", () => fetchVolume(id)).catch(
    (error: unknown) => fail(`Google volume lookup failed: ${(error as Error).message}`),
  );
  if (!volume) fail(`volume ${id} came back from search but not from /volumes/${id}`);
  console.log(`✓ volume ${id} reopens as "${volume.title}"`);
}

// ------------------------------------------------------------- Open Library
const results = await retry("search", () => searchWorks(QUERY, 5)).catch(
  (error: unknown) =>
    fail(
      `search failed after ${ATTEMPTS} attempts: ${
        error instanceof Error ? error.message : String(error)
      }\n` +
        `  Open Library (Internet Archive) has recurring short outages.\n` +
        `  Check https://openlibrary.org/status before assuming this is our bug.`,
    ),
);

if (results.length === 0) fail(`no results for "${QUERY}"`);
console.log(`✓ search returned ${results.length} works for "${QUERY}"`);

const withCover = results.find((r) => r.coverId != null);
if (!withCover) fail("no result carried a cover_i — the cover strategy is broken");
console.log(`✓ "${withCover.title}" has cover_i=${withCover.coverId}`);

const url = coverUrl(withCover.coverId, "L");
if (!url) fail("coverUrl returned null for a valid CoverID");

const res = await retry("cover", () => fetch(url, { redirect: "follow" })).catch(
  (error: unknown) =>
    fail(`cover fetch failed: ${(error as Error).message} for ${url}`),
);
if (!res.ok) fail(`cover fetch returned ${res.status} for ${url}`);

const type = res.headers.get("content-type") ?? "";
if (!type.startsWith("image/")) fail(`cover was ${type}, not an image`);
console.log(`✓ ${url} → ${res.status} ${type}`);

// Open Library merges duplicate works and leaves /type/redirect stubs behind.
// OL893415W is one, pointing at OL893414W (Dune). If this stops resolving, any
// key we already stored could silently become a book titled after its own key.
const REDIRECT_KEY = "OL893415W";
const REDIRECT_TARGET = "OL893414W";

const redirected = await retry("redirect", () => fetchWork(REDIRECT_KEY)).catch(
  (error: unknown) => fail(`redirect lookup failed: ${(error as Error).message}`),
);

if (!redirected) fail(`${REDIRECT_KEY} resolved to nothing`);
if (redirected.sourceKey !== REDIRECT_TARGET) {
  fail(
    `${REDIRECT_KEY} resolved to ${redirected.sourceKey}, expected ${REDIRECT_TARGET}`,
  );
}
if (!redirected.title || redirected.title === REDIRECT_KEY) {
  fail(`${REDIRECT_KEY} resolved without a real title — redirects are not being followed`);
}
console.log(
  `✓ redirect ${REDIRECT_KEY} → ${redirected.sourceKey} "${redirected.title}"`,
);

// The band colour is derived from real cover art, so synthetic pixel tests
// cannot prove it works on the jackets Open Library actually serves.
const band = await retry("band colour", () =>
  bandColorFromCover(sampleUrl(withCover)),
).catch(() => null);

const resolved = band ?? fallbackBand(withCover.sourceKey);
const foreground = readableOn(resolved);

if (!/^#[0-9A-F]{6}$/.test(resolved)) fail(`band colour "${resolved}" is not a hex colour`);
if (!meetsAA(resolved, foreground, true)) {
  fail(`band ${resolved} with text ${foreground} does not clear WCAG AA`);
}
console.log(
  `✓ band ${resolved} ${band ? "from cover art" : "(fallback)"}, text ${foreground}, clears AA`,
);

console.log("\nAll book-data smoke checks passed.");

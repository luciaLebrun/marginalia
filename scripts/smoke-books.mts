/**
 * Live smoke test against the real Open Library API. NOT part of CI — CI runs
 * against fixtures so a third-party outage can never turn a PR red.
 *
 * Run with: pnpm smoke:books
 *
 * Verifies the three things fixtures cannot:
 *   1. the search endpoint still returns the fields we ask for
 *   2. results carry a cover_i (the CoverID we depend on)
 *   3. a CoverID-addressed cover URL actually resolves to an image
 */
import { searchBooks } from "../src/lib/books/openlibrary";
import { coverUrl } from "../src/lib/books/covers";

const QUERY = process.argv[2] ?? "dune herbert";

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

const results = await searchBooks(QUERY, 5).catch((error: unknown) =>
  fail(
    `search failed: ${error instanceof Error ? error.message : String(error)}\n` +
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

const res = await fetch(url, { redirect: "follow" });
if (!res.ok) fail(`cover fetch returned ${res.status} for ${url}`);

const type = res.headers.get("content-type") ?? "";
if (!type.startsWith("image/")) fail(`cover was ${type}, not an image`);
console.log(`✓ ${url} → ${res.status} ${type}`);
console.log("\nAll book-data smoke checks passed.");

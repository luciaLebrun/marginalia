---
name: book-data
description: Rules and contracts for fetching book metadata from Open Library and Google Books. Use whenever touching src/lib/books/, adding a field to the book table, rendering a cover, or debugging search, covers, or missing metadata.
---

# Book data

All book metadata enters the app through `src/lib/books/`. Nothing else may call
`openlibrary.org` or `googleapis.com`.

## The CoverID rule (most important)

`covers.openlibrary.org` is **rate limited to 100 requests per IP per 5 minutes
when a cover is addressed by ISBN, LCCN or OCLC**, and returns 403 past that.
Covers addressed by **CoverID** (`/b/id/{cover_i}-L.jpg`) or **OLID** are not
rate limited.

A cover grid trips the ISBN limit almost immediately, and because the limit is
per *IP*, one user scrolling breaks the page for every user behind the same
egress — including all Vercel serverless traffic.

So:

- Always persist `cover_i` from the search response into `book.coverId`.
- Build URLs only via `coverUrl(coverId, size)` from `src/lib/books/covers.ts`.
- **Do not add an ISBN-based cover helper.** If a book has no `cover_i`, render
  the placeholder — `coverUrl` returns `null` precisely so this is explicit.
- Render covers with a plain lazy `<img>`, not `next/image`: Open Library asks
  that public pages point `src` at their CDN, and it keeps us off Vercel Hobby's
  image-transformation quota.

## Open Library

Base `https://openlibrary.org`. No API key. Read endpoints are public.

- **Search**: `/search.json?q={q}&limit={n}&fields={...}` — *always* send an
  explicit `fields` list; the default response is enormous.
- **Work**: `/works/{key}.json` — has `description` and `covers`, but no author
  names and no publish year. `fetchWork()` therefore combines a search call with
  a work call, and degrades to work-only if search fails.
- Results are **works**, which is the right granularity for "I read this book".
  Editions only matter if we later want accurate page counts.
- `description` is either a bare string or `{ type, value }`. Use
  `normalizeDescription()`.
- `covers` can contain `-1` as a "no cover" sentinel. Filter it.
- Keys come back as `/works/OL893414W`; we store `OL893414W`. Use
  `stripWorkPrefix()`.
- **Redirect stubs.** Open Library merges duplicate works and leaves a
  `/type/redirect` at the old key, carrying only a `location`. These are common
  and have no title, authors or covers. `fetchWork()` follows them (max 3 hops,
  cycle-safe) and returns the *resolved* `olWorkKey` — always store that, not
  the key you asked for. `OL893415W` → `OL893414W` is a live example, asserted
  by `pnpm smoke:books`.
- **null vs throw.** `fetchWork()` returns `null` only when the work genuinely
  does not exist (404) or a redirect chain is broken. It *throws*
  `OpenLibraryError` (or a transport error) when Open Library is unreachable.
  Never conflate them: "book not found" and "search unavailable" are different
  screens.

Open Library asks callers to cache and to identify themselves. We send a
descriptive `User-Agent` and `next: { revalidate: 86400 }`. Keep both.

## Google Books

Enrichment only, and only for gaps (`description`, `pageCount`). Requires a free
API key (~1000 req/day). **Every failure path must return the input unchanged** —
enrichment must never be able to fail a book page. Open Library stays
authoritative for identity: key, title, authors.

## When Open Library is down

It is Internet Archive infrastructure and has recurring outages of 30–45
minutes, plus frequent connection-level failures (`ECONNRESET`, connect
timeouts) even while it is nominally up. That is designed for, not worked
around:

- `book` rows are the record. Existing diaries, profiles and reviews are pure
  Postgres reads and keep working.
- Only *search* and *first-time* book lookups degrade. Surface that as a
  friendly "search is unavailable" state, never a 500.
- Check `https://openlibrary.org/status` before assuming a bug is ours.

## Testing

Unit tests run against `tests/fixtures/*.json` so an upstream outage can never
turn a PR red. Keep the normalization functions pure and exported so they can be
tested without touching the network; test the fetch wrappers with a stubbed
`global.fetch`.

`pnpm smoke:books` is the opt-in live check — run it after changing a fetch path
or when you suspect the upstream schema shifted. It retries generously (8
attempts) because the upstream drops connections routinely; a red smoke run
should mean something actually changed.

The app itself does **not** retry. In a serverless request path retries just
burn the user's time — there, degrade to a "search unavailable" state instead.

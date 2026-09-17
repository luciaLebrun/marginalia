---
name: book-data
description: Rules and contracts for fetching book metadata from Open Library and Google Books. Use whenever touching src/lib/books/, adding a field to the book table, rendering a cover, or debugging search, covers, or missing metadata.
---

# Book data

All book metadata enters the app through `src/lib/books/`. Nothing else may call
`openlibrary.org` or `googleapis.com`.

**Google Books is the primary source; Open Library is the fallback** (MRG-063,
ADR 0009). `searchBooks()` asks Google and reaches Open Library only when Google
is unconfigured, errors, or finds nothing. Keys carry their source:
`gb:B1hSG45JCX4C` for a Google volume, bare `OL45804W` for an Open Library work.
A key is never offered to the other source — it would answer with a different
book. `parseBookKey()` guards both forms.

The permanent cost: a Google key identifies an **edition**, an Open Library key
a **work**, so two readers can open two volumes of one book and get two rows.
ISBN-13 is the only bridge.

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

Base `https://www.googleapis.com/books/v1`. **Requires an API key.** Keyless
requests now carry a daily quota of *zero* (verified 2026-09-17: 429
`RESOURCE_EXHAUSTED`, `quota_limit_value: 0`), and Vercel shares egress IPs, so
keyless in production breaks everyone's search at once. No key is a supported
state: `searchBooks()` simply stays on Open Library.

- **Search**: `/volumes?q=…&printType=books&fields=…` — always send `fields`;
  the default payload is roughly ten times what we keep. `maxResults` caps at 40.
- **Volume**: `/volumes/{id}` — the same shape as one search item.
- Results are **editions**, not works. This is the granularity cost above.
- `publishedDate` is "1965", "1965-06" or "1965-06-01"; take the year only.
- `industryIdentifiers` is a mixed list — pick the `ISBN_13` entry.
- Throws `GoogleBooksError` with the status so `searchBooks()` can fall back.
  A 404 from `/volumes/{id}` is a real "no such volume" and returns null.

### Jacket URLs — ask by `w`, never by `zoom`

`imageLinks` entries all address the same scan and differ only in the rendition
requested. **The `zoom` parameter is a short ladder of small renditions whose
highest number is not the largest image.** Measured against a live volume:

| request | actual |
|---|---|
| `zoom=1` | 128x192 |
| `zoom=2` | 300x462 |
| `zoom=5` (what `smallThumbnail` carries) | 128x192 |
| `w=800` | 800x1232 |
| `w=1280` | 1280x1972 |

So `jacketFromImageLinks()` drops `zoom` entirely and rewrites the URL to a
width, and `jacket()` builds a real srcset (256/512/800) with
`withJacketWidth()`. Do not reintroduce `zoom` — it silently caps the
frontispiece, which is the LCP, at a 300px upscale.

Also fixed in the URL: `https` is forced (the API returns `http`, which is mixed
content on our pages) and `edge=curl` is stripped (a page-curl graphic burnt
into the scan — a picture of a book rather than a jacket).

**Only `books.google.com` may be pointed at from `book.cover_url`.** That value
becomes an `<img src>` on a public page, so the host is checked at
normalization, not at render.

### Enrichment

`enrich()` still exists for the fallback direction: an **Open Library** book
with gaps (`description`, `pageCount`) is topped up from Google. It is a no-op
for a `source: "google"` row — re-asking Google fills nothing. **Every failure
path must return the input unchanged**; enrichment must never fail a book page.

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

# ADR 0004 — Our database is the record for books, not Open Library

**Status:** accepted · 2026-09-09

## Context

Book metadata comes from Open Library (free, no API key) with Google Books as a
fallback enricher. The naive design queries Open Library whenever a book is
displayed.

Open Library is Internet Archive infrastructure and has recurring outages of
30–45 minutes. One occurred during this project's very first build session: the
API was unreachable while `covers.openlibrary.org` and `archive.org` stayed up.

## Decision

Copy a book into our `book` table the first time it is opened, and read from
Postgres forever after. Reviews foreign-key to our row, never to an Open Library
key alone.

Covers are the exception: they are hotlinked from `covers.openlibrary.org`, by
**CoverID only** — ISBN-addressed covers are rate limited to 100 requests per IP
per 5 minutes and would 403 across all of Vercel's shared egress.

## Rationale

An outage must not be able to take down someone's reading diary. With this
design only *search* and *first-time* lookups degrade; every profile, book page
and review is a pure indexed Postgres read.

It is also faster — no network round-trip on the render path — and it means we
own the schema, so enrichment can be backfilled later without touching review
data.

## Consequences

- `book` rows can go stale. Acceptable: book metadata barely changes, and
  `cachedAt` lets us refresh later if needed.
- Search must have a first-class "unavailable" state, not a 500.
- Unit tests run against recorded fixtures in `tests/fixtures/`, never the live
  API, so an upstream outage cannot turn a PR red. `pnpm smoke:books` is the
  opt-in live check.
- Work keys are not stable identifiers. Open Library merges duplicate works and
  leaves a `/type/redirect` stub behind, so a key already stored in `book` can
  become a stub later. `fetchWork()` follows redirects and returns the resolved
  key; store that one. Verified live: `OL893415W` → `OL893414W`.
- `fetchWork()` distinguishes "no such book" (returns null) from "Open Library
  is unreachable" (throws `OpenLibraryError` or a transport error), because the
  UI owes the reader a different answer in each case.

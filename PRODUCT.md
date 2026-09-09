# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The author and a small, invited circle of friends — under a dozen people. They
are readers who finish books and want a record of them.

The moment of use is right after finishing a book: someone closes it, picks up
a phone or opens a laptop, and wants the book logged before the impulse passes.
A second, slower mode is revisiting: scrolling back through what they have read
over months.

Both device classes are primary. Confirmed with the user: phone and laptop are
used genuinely equally, so neither may be treated as the fallback.

## Product Purpose

A reading diary. Log a book you have read, optionally rate it, optionally write
about it, and keep a profile of those entries over time.

Success is two things: capture is fast enough that nobody skips it, and the
resulting record is pleasurable to scroll back through months later.

Confirmed with the user: the primary job is **recording what you just
finished** — a private log you enjoy revisiting. Friends are an audience for
that record, not the reason to open the app. A friends' activity feed and
discovery/to-read features are deliberately **not** the product's centre, and
are out of scope for the first release.

## Positioning

A closed reading diary running entirely on infrastructure the author controls,
with no ads, no paywall, and no algorithmic feed — where the comparable
products each give up one of those.

The mechanism a neighbouring product could not truthfully copy: book records
are copied into this product's own database on first use, so the diary keeps
working when the upstream metadata source is unavailable, and pages render from
one indexed query rather than a third-party round-trip.

## Operating Context

- Account creation is gated: sign-in is Google OAuth, and signing up requires
  an invite code issued by an existing member. There is no open registration.
- Book metadata comes from Open Library (no API key), enriched opportunistically
  by Google Books. Cover images are served from Open Library's CDN.
- Used in short bursts, often days or weeks apart, rather than daily. The
  hosting must survive long idle periods without manual intervention.
- Entries are written by the reader themselves; nothing is imported from
  Goodreads or elsewhere at this stage.

## Capabilities and Constraints

Confirmed in scope for the first release: search for a book, log it with a read
date, rate it in half-stars, write a review, and view a profile of your entries.

Durable constraints:

- **Zero cost.** Every layer must sit inside a permanent free tier, for the
  operator and for users. This has already ruled out design options and will
  again.
- **The database is the record.** A book is copied into the local `book` table
  on first use and read from Postgres afterwards. An upstream outage may degrade
  search; it must never degrade an existing diary, profile, or review.
- **Cover images are addressed by Open Library CoverID, never by ISBN.**
  ISBN-addressed covers are rate limited to 100 requests per IP per 5 minutes
  and return 403 beyond that, and serverless hosts share egress IPs.
- **A book entry is a diary entry, not a rating.** The same reader may log the
  same book more than once; rereads are separate entries. Rating and review text
  are independently optional.
- Open Library work keys are not stable identifiers — the source merges
  duplicate works and leaves redirect stubs behind.

Explicitly undecided: whether a friends' feed, shelves/lists, reading progress,
or saved quotes are ever built. They are parked, not planned.

## Brand Commitments

The name **Marginalia** — the notes a reader writes in a book's margins — was
chosen by the user.

Recorded so future work does not treat it as settled: the name is contested. An
iOS app called "Marginalia: Book Quotes" exists, as does the unrelated
marginalia.nu search engine. This does not block a private deployment, but the
name may change before any public domain is bought. Do not build the identity
around wordplay that only works for this exact spelling.

There is no logo, wordmark, colour palette, typeface, or any other brand asset
yet. None has been specified or made binding.

## Evidence on Hand

- Book metadata and cover imagery: Open Library / Internet Archive. Real, and
  the only substantial visual asset the product has.
- The database is empty. There are **no** users, entries, ratings, or reviews.
- There are no testimonials, customers, reviews, press mentions, usage numbers,
  or benchmarks, and none may be invented or implied — including as placeholder
  or sample content in a design. Empty states must be designed honestly rather
  than mocked up with fictional activity.

## Product Principles

1. **Capture must be faster than the impulse to skip it.** Every step between
   "I finished this" and a saved entry is a chance to lose the entry.
2. **The record outlives its source.** Nothing a reader has written may depend
   on a third party being reachable.
3. **Free is a feature, not a phase.** Cost constraints are permanent and shape
   design decisions, not just infrastructure ones.
4. **Both phone and laptop are first-class.** Neither is a degraded version of
   the other.
5. **No ads, no paywall, no algorithm.** The reader's own record is the whole
   product; nothing may be introduced that competes with it for attention.

## Accessibility & Inclusion

Asked and answered: no specific accessibility need is known among the intended
users. Recorded so it is not re-asked.

No product-specific requirement is therefore established, and the ordinary
baseline applies — WCAG AA contrast, full keyboard operation, visible focus,
and meaningful alternative text. Because the interface is built around book
cover art, alt text on covers is load-bearing rather than decorative.

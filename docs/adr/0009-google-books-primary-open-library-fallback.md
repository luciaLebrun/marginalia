# ADR 0009 — Google Books is the primary source, Open Library the fallback

**Status:** accepted · 2026-09-17

## Context

Open Library was the only search source, with Google Books used behind it to
fill in descriptions and page counts (ADR 0004). In use, its relevance on the
query a reader actually types — a title, half a title, a title and an author —
is poor: the wanted book is often below the fold or absent, buried under
editions, anthologies and unrelated works with a matching word.

Google Books ranks those queries markedly better. Its cost is that a Google key
identifies an **edition** (a volume), where an Open Library key identifies a
**work**.

## Decision

`searchBooks()` asks Google Books first and falls back to Open Library when
Google is unconfigured, errors, or returns nothing. Both sources are kept.

Book keys carry their source. A Google volume is stored and addressed tagged,
`gb:B1hSG45JCX4C`; an Open Library work stays bare, `OL45804W`. `ol_work_key`
was renamed to `source_key` to stop the column name being a lie. A key is never
offered to the other source: it would answer with a different book, or none.

Google is asked **only with an API key**. Keyless Google Books carries a daily
quota of zero, and Vercel shares serverless egress IPs between projects, so
keyless in production would break everyone's search at once. Without
`GOOGLE_BOOKS_API_KEY` the app runs entirely on Open Library, which needs none —
a supported state, and the state a fresh checkout is in.

Covers follow the source. Open Library addresses them by CoverID and serves a
size ladder; Google gives one URL per volume and no ladder, stored in the new
`book.cover_url`. Only `books.google.com` may be pointed at from that column.

## Consequences

**Accepted, and permanent:** two readers can open two different volumes of the
same book and get two `book` rows, splitting its page and its reviews. The
stored ISBN-13 is the only bridge, and nothing currently uses it for this. This
is the real price of the relevance, and it was judged worth paying for a diary
read by a handful of people. If it starts to bite, the fix is to merge rows on
ISBN-13 at upsert — not to reverse this decision.

**Nothing already stored moves.** Every existing row keeps its bare Open Library
key, renders from Postgres as before (ADR 0004 is untouched), links out to Open
Library, and keeps its CoverID covers. `/book/OL45804W` still resolves.

**Google jackets are lower quality.** They are ~256px against Open Library's
~500px and some scans carry a page-curl graphic, which is stripped in the URL.
This was chosen over an ISBN → Open Library cover lookup, which would have cost
a second request on every first open and missed every Google-only book.

**Two live dependencies instead of one.** Search now degrades in two steps
rather than one, which is strictly better for availability: Google failing is
invisible to the reader. Only both failing shows "unavailable".

# ADR 0009 — Google Books is the primary source, Open Library the fallback

**Status:** accepted · 2026-09-17

## Context

Open Library was the only search source, with Google Books used behind it to
fill in descriptions and page counts (ADR 0004).

Open Library is Internet Archive infrastructure. It has recurring 30-45 minute
outages, frequent connection-level failures, and — measured against both live
APIs — it degrades sharply under concurrency:

| | idle (sequential) | 8 concurrent |
|---|---|---|
| Google Books | 771ms median | **797ms median, 1718ms p95** |
| Open Library | **403ms median** | 1238ms median, 2635ms p95 |

Open Library is the faster of the two when idle, and roughly half Google's
latency at the concurrency this POC actually sees. What it does not do is hold
that number: it triples under load where Google is flat.

**The relevance case for Google was investigated and does not hold.** Across
all 20 results a reader sees, `dune herbert` never returns *Dune*, and
`the dispossessed` never returns Le Guin's. This was measured with and without
`langRestrict`, `printType` and `orderBy`, and with `intitle:`/`inauthor:`
query shaping; none of them move the real book into view. The Books API ranks
quite differently from the books.google.com website, and this is not tunable
from our side.

## Decision

`searchBooks()` asks **both sources on every search, in parallel**, and merges:
Google holds the top of the grid (capped at 12 of 20 slots) and Open Library
fills the rest, de-duplicated. Either source failing leaves the other's results
standing; only both failing is an outage.

The plain fallback this started as did not work, and the reason is worth
keeping: it fired on *absence* and never on *wrongness*, so a query Google
ranked badly never reached Open Library at all. Nothing in the code can tell a
confident wrong answer from a right one, so asking both every time is the only
remedy. The reserved quota is the mechanism — Google reliably returns a full
page, so appending Open Library after it would append into no space.

De-duplication is on folded title + first author, with ISBN-13 as an exact key
where it lines up. ISBN alone does not work: Google returns *editions* and Open
Library *works*, so the two hand back different ISBNs for the same book.

**This was chosen for latency stability, with the relevance regression accepted
as a known cost** — the owner's call, made with the measurements above in hand.
It is recorded plainly because the reasoning is counterintuitive: the obvious
reading of "better search" would be relevance, and on relevance this decision
is a step backwards.

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

**Relevance is recovered by the merge, at the cost of a second request.**
Before it, `dune herbert` and `the dispossessed` returned no edition of the
book across all twenty results. After it, measured live:

| query | before | after |
|---|---|---|
| `dune herbert` | missing from 20 | #13 (Open Library) |
| `the dispossessed` | missing from 20 | #7 |
| `freakonomics` | #2 | #2 |
| `piranesi susanna clarke` | #1 | #1 |

The cost is latency: every search now waits for the slower of the two rather
than for Google alone, around 1.3s cold against Google's 0.8s. They run in
parallel, so it is the max and not the sum, and both are cached for 24h.
`GOOGLE_SLOTS` is the tuning knob — lower it to bring Open Library's works
further up the grid, raise it to give Google more of the page.

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

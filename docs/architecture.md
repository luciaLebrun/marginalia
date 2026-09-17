# Architecture

Marginalia is a reading diary: log a book, rate it, review it. It applies
Letterboxd's model to books, for a closed circle of users, entirely on free
infrastructure.

## Shape

A single Next.js 16 application on Vercel, rendering server-side against a
Postgres database on Neon. There is no separate API service — route handlers and
server actions are the API.

```
browser
  │
  ▼
Next.js (App Router, RSC) ── Vercel Hobby
  │                    │
  │                    └── src/lib/books/ ──► googleapis.com    (primary)
  │                                       └─► openlibrary.org   (fallback)
  ▼
Postgres ── Neon Free
```

Covers are loaded by the browser directly from `books.google.com` or
`covers.openlibrary.org`, whichever source the book was opened at; they never
pass through our server.

## The two sources

**Google Books is primary, Open Library is the fallback** (MRG-063, ADR 0009).
Google leads for latency stability, not relevance: Open Library is the faster of
the two when idle but triples under concurrency where Google stays flat, and it
has recurring 30-45 minute outages.

Google's ranking is the worse of the two — `dune herbert` returned no edition of
*Dune* in twenty results — so `searchBooks()` asks **both sources every time,
in parallel, and merges them** (MRG-067). Google holds the top of the grid,
capped at `GOOGLE_SLOTS`; Open Library is guaranteed the rest and is what puts
the actual book on the page. De-duplication is on folded title + first author,
since Google returns editions and Open Library works and their ISBNs disagree.
Either source failing leaves the other's results standing; only both failing is
an outage.

Google is asked only with an API key. Keyless requests carry a daily quota of
zero, and Vercel shares egress IPs between projects, so keyless in production
would break everyone's search at once. Without `GOOGLE_BOOKS_API_KEY` the app
runs entirely on Open Library, which needs none.

The cost, which is permanent and worth remembering: a Google key identifies an
**edition** (a volume), an Open Library key a **work**. Two readers can open two
volumes of the same book and get two `book` rows, splitting its page. The stored
ISBN-13 is the only bridge. This was accepted deliberately, for the relevance.

Keys therefore carry their source: `gb:B1hSG45JCX4C` for a Google volume, a bare
`OL45804W` for an Open Library work. Books opened before the swap keep working
untouched, and a key is never offered to the other source — it would answer with
a different book.

## The central invariant: the database is the record

Neither source is our datastore. The first time anyone opens a book, we copy it
into the `book` table. From then on the book renders from Postgres and no
external call is made.

This is why the app stays usable when a source is unreachable — Open Library,
being Internet Archive infrastructure, is down for 30–45 minutes at a time on a
regular basis. Under an outage, only search and first-time lookups degrade;
every existing diary, profile and review is a pure Postgres read.

It also means a book page is one indexed query rather than a network round-trip,
which is what makes the cover grid feel instant.

## Data model

```
user ──┬── session          (Better Auth)
       ├── account          (Better Auth, Google link)
       ├── invite_code      signup gate for a closed POC
       └── log ─────────────► book
```

`log` is a **diary entry**, not a rating: `(userId, bookId)` is deliberately not
unique, so a reread is a separate row. `rating` and `reviewText` are
independently nullable — "read it, no opinion" and "4 stars, no words" are both
valid entries. `readAt` nullable means "read at some point, date unknown".

Indexes, one per hot query:

| Index | Serves |
|---|---|
| `log(user_id, read_at DESC)` | the profile / diary |
| `log(book_id)` | the book page's review list |
| `book(source_key)` unique | the cache lookup on every book open |

`log → book` is `ON DELETE RESTRICT`: a book someone reviewed must not vanish
from under the review. Everything hanging off `user` cascades, so deleting an
account removes its data.

## Covers

`covers.openlibrary.org` rate limits covers addressed by **ISBN/LCCN/OCLC** to
100 requests per IP per 5 minutes, then returns 403. Covers addressed by
**CoverID** or OLID are unrestricted.

Because Vercel's serverless egress shares IPs, one user scrolling a grid could
403 covers for everyone. So `book.coverId` stores Open Library's `cover_i`, and
`coverUrl()` accepts a CoverID and nothing else. There is intentionally no
ISBN-based variant.

Google addresses covers by URL instead, and offers no size ladder, so a Google
row stores `book.coverUrl` and renders one `src` with no `srcset`. `jacket()` in
`src/lib/books/covers.ts` is the only place that knows the difference. Only
`books.google.com` may be pointed at from a stored `coverUrl`, enforced at
normalization: that value becomes an `<img src>` on a public page.

Covers render as a plain lazy `<img>` rather than `next/image`: Open Library
asks that public pages point `src` at their CDN, Google jackets are pointed at
for the same reason, and it keeps us off Vercel Hobby's image-transformation
quota for images we do not own.

## Routes

| Route | Purpose |
|---|---|
| `/` | Signed out: the door. Signed in: your diary, newest first. |
| `/claim` | First stop after signing in, for a reader with no handle yet. |
| `/search?q=` | Search Google Books, then Open Library; cover-grid results. |
| `/book/[bookKey]` | Book page: metadata, your logs, all reviews. |
| `/@[username]` | Profile: cover grid of latest reads. |
| `/@[username]/log/[id]` | Review permalink. |
| `/settings` | Name, handle, bio; invitations; sign out; delete account. |
| `/dev/*` | Development harnesses. `notFound()` outside development. |

There are deliberately no `/signin` and `/signup` routes. A signed-out visitor
lands on `/`, and the door there takes an optional invite code before handing
off to Google — an existing member needs no code, because `enforceInvite()`
runs only when a user row is being created. Two routes would have made the
visitor classify themselves before doing anything, to reach the same gate.

## Environments

| | Branch | URL | Database |
|---|---|---|---|
| Production | `main` | Vercel production | Neon `main` branch |
| Preview | `develop` | persistent Vercel preview | Neon `main` branch |
| Local | any | `localhost:3000` | a Neon dev branch |

Deployment is Vercel's Git integration, not a workflow — there is no
`deploy.yml` and there should not be one.

## Decisions

See `docs/adr/`. Work in progress is tracked in Obsidian at
`~/Documents/Notes/Marginalia/Backlog.md`.

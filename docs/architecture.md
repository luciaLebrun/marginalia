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
  │                    └── src/lib/books/ ──► openlibrary.org   (search only)
  │                                       └─► googleapis.com    (enrichment)
  ▼
Postgres ── Neon Free
```

Covers are loaded by the browser directly from `covers.openlibrary.org`; they
never pass through our server.

## The central invariant: the database is the record

Open Library is a *search index*, not our datastore. The first time anyone opens
a book, we copy it into the `book` table. From then on the book renders from
Postgres and no external call is made.

This is why the app stays usable when openlibrary.org is unreachable — which,
being Internet Archive infrastructure, happens for 30–45 minutes at a time on a
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
| `book(ol_work_key)` unique | the cache lookup on every book open |

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

Covers render as a plain lazy `<img>` rather than `next/image`: Open Library
asks that public pages point `src` at their CDN, and it keeps us off Vercel
Hobby's image-transformation quota for images we do not own.

## Routes

| Route | Purpose |
|---|---|
| `/` | Logged out: landing. Logged in: your diary, newest first. |
| `/signin`, `/signup` | Google OAuth; signup consumes an invite code. |
| `/search?q=` | Search Open Library, cover-grid results. |
| `/book/[workKey]` | Book page: metadata, your logs, all reviews. |
| `/@[username]` | Profile: cover grid of latest reads. |
| `/@[username]/log/[id]` | Review permalink. |
| `/settings` | Username, bio, generate invite codes. |

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

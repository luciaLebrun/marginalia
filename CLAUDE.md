@AGENTS.md

# Marginalia

A reading diary: log a book, rate it, review it. Letterboxd's model applied to
books. Closed POC for the author and a few friends — every layer must stay
inside a permanent free tier.

## Commands

```bash
pnpm dev              # next dev
pnpm lint             # eslint
pnpm typecheck        # next typegen && tsc --noEmit  (typegen is required first)
pnpm test             # vitest run
pnpm test:coverage    # vitest run --coverage  → coverage/lcov.info for Sonar
pnpm build            # next build
pnpm smoke:books      # LIVE check against openlibrary.org (not in CI)

pnpm db:generate      # drizzle-kit generate — write a migration from schema.ts
pnpm db:migrate       # drizzle-kit migrate  — apply migrations
pnpm db:studio        # drizzle-kit studio
```

## Stack

Next.js 16 (App Router, RSC) · TypeScript strict · Tailwind v4 · Drizzle ORM ·
PostgreSQL on Neon · Better Auth (Google OAuth) · Zod · Vitest.

Hosting: Vercel Hobby. `main` → production, `develop` → preview, via Vercel's
Git integration (there is deliberately no deploy workflow).

## Architectural invariants

These four rules are the ones that are easy to break and expensive to unbreak.

**1. Book data only ever flows through `src/lib/books/`.**
No component, route handler or server action may call `openlibrary.org` or
`googleapis.com` directly. The caching policy, the `User-Agent`, the response
normalization and the CoverID rule all live in that one module.

**2. Never build a cover URL from an ISBN. Only from `cover_i`.**
Covers addressed by CoverID or OLID are unrestricted; covers addressed by
ISBN/LCCN/OCLC are rate limited to **100 requests per IP per 5 minutes** and
return 403 past that — which breaks the cover grid for everyone behind the same
egress IP. `coverUrl()` in `src/lib/books/covers.ts` accepts a CoverID and
nothing else, on purpose. Do not add an ISBN variant.

**3. Our database is the record; Open Library is not.**
A book is copied into the `book` table the first time it is opened, and read
from Postgres forever after. Diaries, profiles and reviews must keep working
when openlibrary.org is down — which, being Internet Archive infrastructure, it
periodically is. Never put an external API call on the path of rendering a
profile or an existing review.

**4. Work keys can be redirect stubs. Always resolve through `fetchWork()`.**
Open Library merges duplicate works and leaves a `/type/redirect` stub at the
old key, holding only a `location`. A stub has no title, authors or covers, so
a caller that does not follow it creates a book titled after its own key. Any
key can become one at any time, *including one already saved in `book`*. Trust
the resolved `olWorkKey` that `fetchWork()` returns over the one you passed in.

**5. `fetchWork()` returning null means "no such book". A throw means "Open
Library is down".**
Do not collapse the two — the UI must show "not found" and "temporarily
unavailable" differently. `OpenLibraryError` carries the status.

**6. Nothing reaches the database at module scope.**
`next build` runs with a placeholder `DATABASE_URL`. Use `getDb()` from
`src/db`, which constructs lazily. A top-level `drizzle(...)` call breaks CI.

## Conventions

- **Open Library keys are stored bare**: `OL893415W`, never `/works/OL893415W`.
  Use `stripWorkPrefix()` at every boundary.
- **`log` is a diary entry, not a rating.** `(userId, bookId)` is deliberately
  not unique — rereads are separate rows. `rating` and `reviewText` are both
  nullable, independently.
- **Validate at the boundary with Zod**, in a schema shared by the form and the
  server action. Never trust a server action's input.
- **Tests run against fixtures in `tests/fixtures/`**, never the live API — a
  third-party outage must not be able to turn a PR red. `pnpm smoke:books` is
  the opt-in live check.
- Covers render as a plain lazy `<img>`, **not** `next/image`. Open Library asks
  that public pages point `src` at their CDN, and it keeps us off Vercel Hobby's
  image-transformation quota for images we do not own.

## Git flow

`main` (protected, production, tagged `vX.Y.Z`) · `develop` (default, preview) ·
`feature/MRG-###-slug` → PR into `develop` · `hotfix/slug` → PR into `main`,
**then back-merged into `develop`**.

Branch names carry the backlog ID. The backlog lives in Obsidian at
`~/Documents/Notes/Marginalia/Backlog.md`. See the `gitflow` and `backlog`
skills in `.claude/skills/`.

## Where things are

```
src/app/          routes (App Router)
src/components/   UI
src/db/           schema.ts, index.ts (getDb), migrations/
src/lib/books/    the ONLY door to Open Library / Google Books
src/lib/auth.ts   Better Auth config
tests/fixtures/   recorded API responses
docs/             architecture.md + adr/   ← decisions live here, not in Obsidian
scripts/          smoke-books.mts
```

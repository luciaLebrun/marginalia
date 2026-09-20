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
pnpm test:integration # only the suites that need a real DATABASE_URL
pnpm build            # next build
pnpm smoke:books      # LIVE check against openlibrary.org (not in CI)

pnpm seed:dev         # one local reader, real books, three invite codes
pnpm shot /dev/shelf  # screenshot a route at 360/768/1440 (needs pnpm dev)
pnpm e2e              # playwright, desktop + mobile projects

pnpm db:generate      # drizzle-kit generate — write a migration from schema.ts
pnpm db:migrate       # drizzle-kit migrate  — apply migrations
pnpm db:studio        # drizzle-kit studio, against .env.local
pnpm db:studio:preview  # …against .env.preview
pnpm db:studio:prod     # …against .env.production
```

### Looking at a deployed environment's data

Vercel stores `DATABASE_URL` as a Secret, so it cannot be read back — not from
the dashboard and not from `vercel env pull`, which returns `[SENSITIVE]`. Get
the connection string from the **Neon** dashboard instead, per branch, and put
it in a gitignored `.env.preview` or `.env.production`:

```
DATABASE_URL=postgresql://…   # that branch's pooled connection string
```

Then `pnpm db:studio:preview` or `pnpm db:studio:prod`. The file exists so the
string never reaches your shell history or a process listing; `.env*` is
already gitignored. A one-off `DATABASE_URL="…" pnpm db:studio` also works —
`drizzle.config.ts` loads `.env.local` without overriding what is already in
the environment, so the inline value wins.

**Which branch is which is worth checking rather than assuming.** Preview and
local sharing one branch is how seeded development fixtures ended up publicly
readable on a deployed URL — see MRG-046.

## Stack

Next.js 16 (App Router, RSC) · TypeScript strict · Tailwind v4 · Drizzle ORM ·
PostgreSQL on Neon · Better Auth (Google OAuth) · Zod · Vitest.

Hosting: Vercel Hobby. `main` → production, `develop` → preview, via Vercel's
Git integration (there is deliberately no deploy workflow).

`vercel.json` sets the build command to `pnpm db:migrate && pnpm build`, so each
environment migrates the database it points at before building — see ADR 0005.
A destructive migration must therefore be split across two deploys: expand
first, contract once nothing reads the old shape.

## Architectural invariants

These are the rules that are easy to break and expensive to unbreak.

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

**3. Our database is the record; neither source is.**
A book is copied into the `book` table the first time it is opened, and read
from Postgres forever after. Diaries, profiles and reviews must keep working
when openlibrary.org is down — which, being Internet Archive infrastructure, it
periodically is. Never put an external API call on the path of rendering a
profile or an existing review.

`openBook()` in `src/lib/book.ts` is the only app code that writes to `book`,
and the only path by which a book is opened. It returns `found`, `not-found` or
`unavailable`, and a stored row is returned without reaching either source.
Reach for it rather than calling `fetchBook()` from a page.

**4. Work keys can be redirect stubs. Always resolve through `fetchWork()`.**
Open Library merges duplicate works and leaves a `/type/redirect` stub at the
old key, holding only a `location`. A stub has no title, authors or covers, so
a caller that does not follow it creates a book titled after its own key. Any
key can become one at any time, *including one already saved in `book`*. Trust
the resolved `sourceKey` that `fetchWork()` returns over the one you passed in.

**5. `fetchWork()` returning null means "no such book". A throw means "Open
Library is down".**
Do not collapse the two — the UI must show "not found" and "temporarily
unavailable" differently. `OpenLibraryError` carries the status.

**6. Nothing reaches the database at module scope.**
`next build` runs with a placeholder `DATABASE_URL`. Use `getDb()` from
`src/db`, which constructs lazily. A top-level `drizzle(...)` call breaks CI.

## Auth

Better Auth, Google OAuth only, gated by invite codes. `getAuth()` is lazy for
the same reason `getDb()` is.

- **The invite gate is the only thing protecting this app.** Google will
  authenticate anyone on earth; `enforceInvite()` in the `user.create.before`
  hook is what stops them getting an account. It fails closed — missing,
  unknown, expired and already-used codes all reject. A throwing `before` hook
  aborts the whole sign-up, verified in `auth-gate.integration.test.ts`.
- **Invite codes come from the CSPRNG, never `Math.random()`.** V8 implements
  `Math.random` with xorshift128+, whose internal state is recoverable from a
  handful of outputs — someone legitimately sent two or three codes could
  predict the next ones. `secureRandomInt()` uses `crypto.getRandomValues` with
  rejection sampling (the 29-character alphabet does not divide 256, so plain
  `% 29` would bias the early letters and shrink the keyspace). A unit test
  asserts `Math.random` is never called.
- **Claiming a code is a single atomic UPDATE** (`SET used_at = now() WHERE
  used_at IS NULL`), not read-then-write. The race test proves exactly one of
  five concurrent claims wins. Never "fix" this into a select followed by an
  update.
- The code crosses the Google round-trip in a short-lived httpOnly cookie
  (`INVITE_COOKIE`), because OAuth gives us no way to carry a form field.
- `transaction: false` on the Drizzle adapter is required: the neon-http driver
  sends one HTTP request per statement and cannot hold a transaction open. The
  consequence is that a code is burned if user creation then fails — the safer
  direction to fail in for a closed POC.
- **Only the owner mints codes, and the owner is an env var.**
  `MARGINALIA_OWNER_EMAIL` (one address or several, comma separated) is checked
  by `isOwner()` in `src/lib/owner.ts`. Deliberately not a column: it costs no
  migration, and it cannot be escalated by anything that reaches the database.
  Unset means nobody can mint — a misconfigured deployment closes the door
  rather than opening it. The check lives in the server action as well as the
  page, because hiding a button hides nothing.
- **The first account cannot be invited, so it is exempted.** The gate and the
  schema deadlock otherwise: no account without a code, and no code without an
  account. `bootstrapAllowed()` lets the address in `MARGINALIA_OWNER_EMAIL`
  create an account **only while no accounts exist**, checked before the code
  is. One account closes it forever, and deleting every account reopens it —
  which is correct, since an empty deployment must be enterable. See ADR 0008.
- **The door checks a code before the Google round-trip.** This is a known,
  accepted oracle: a holder can learn their own code is spent. The alternative
  is worse — a typo would send someone through Google only to have sign-up
  aborted on the way back, with the session burned. With 29^8 codes and single
  figures live, mistyping is the threat model, not guessing.
- Integration tests hit the real database and **skip** when `DATABASE_URL` is
  missing or a placeholder, so CI stays green without one. Run them with
  `pnpm test:integration`. They must always clean up after themselves.

## Conventions

- **Google Books is the primary source; Open Library is the fallback**
  (MRG-063, ADR 0009). Chosen for **latency stability under load**, not
  relevance: Open Library is faster idle (403ms vs 771ms median) but triples
  under concurrency while Google stays flat, and it has recurring 30-45 min
  outages. The accepted cost is that Google's ranking is worse — "dune herbert"
  does not return *Dune* in any of the 20 results a reader sees (MRG-067), and
  a plain fallback could not rescue it, because it fires on an *empty* result
  and never on a *wrong* one. So `searchBooks()` in `src/lib/books/index.ts`
  asks **both sources every time, in parallel, and merges** (MRG-067): Google
  holds the top of the grid, capped at `GOOGLE_SLOTS` of the 20, and Open
  Library is guaranteed the rest. De-duplication is on folded title + first
  author — ISBN-13 alone does not work, since Google returns editions and Open
  Library works. Either source failing leaves the other standing.
  **A query is a title and an author, kept apart all the way down** (MRG-068):
  `searchBooks()` takes a `BookQuery`, and each source scopes the two itself —
  Google as `intitle:"…" inauthor:"…"`, Open Library as its `title` / `author`
  parameters. Never join them back into one free-text string: measured live,
  that is what made "the dispossessed" return no Le Guin and "dune herbert"
  return a book about soil. Either field alone is a valid search; both empty is
  not a search at all. Keys
  carry their source: a Google volume is tagged `gb:B1hSG45JCX4C`, an Open
  Library work stays bare `OL893415W`, never `/works/OL893415W` — use
  `stripWorkPrefix()` at every boundary. `parseBookKey()` is the guard for both,
  and a key is never handed to the other source: it would answer with a
  different book. The cost of the swap, which is permanent: a Google key
  identifies an *edition*, an Open Library key a *work*, so two readers can
  open two volumes of the same book and get two rows. ISBN-13 is the only
  bridge.
- **A jacket comes from whichever source the row was opened at.** Open Library
  addresses covers by CoverID and serves sizes; Google gives one URL per volume
  and none. `jacket()` in `src/lib/books/covers.ts` picks, and is the only
  place that knows the difference. Only `books.google.com` may be pointed at
  from a stored `coverUrl` — `jacketFromImageLinks()` enforces it, because that
  value becomes an `<img src>` on a public page.
- **`log` is a diary entry, not a rating.** `(userId, bookId)` is deliberately
  not unique — rereads are separate rows. `rating` and `reviewText` are both
  nullable, independently.
- **A handle can be changed, and the old one dies.** There is no handle history
  and no redirect: renaming frees the old name immediately, a link to it 404s,
  and anyone may take it. `claimUsername()` is the first claim (`WHERE username
  IS NULL`); `updateAccount()` is the rename. Both let the unique index decide,
  never a check-then-write.
- **The account sheet is one UPDATE.** Name, handle and bio are written
  together or not at all, which is what makes the surface's "one commit"
  promise true rather than cosmetic. A taken handle fails the whole save on
  purpose; do not "improve" this into partial writes.
- **Validate at the boundary with Zod**, in a schema shared by the form and the
  server action. Never trust a server action's input.
- **Tests run against fixtures in `tests/fixtures/`**, never the live API — a
  third-party outage must not be able to turn a PR red. `pnpm smoke:books` is
  the opt-in live check.
- Covers render as a plain `<img>`, **not** `next/image`. Open Library asks
  that public pages point `src` at their CDN, Google Books jackets are pointed
  at for the same reason, and it keeps us off Vercel Hobby's
  image-transformation quota for images we do not own. Grid covers are lazy; a
  page-scale jacket is the LCP and loads eagerly at high priority.
- **Client components import nothing that builds a Zod schema or reaches the
  database.** Shared limits live in `src/lib/client-safe.ts`;
  `client-imports.test.ts` fails the build otherwise (MRG-022).

## Frontend, UX review and optimisation → use Impeccable

All UI work on this project goes through the **Impeccable** skill rather than
ad-hoc design judgement. `PRODUCT.md` holds the confirmed product truth it
reads; do not restate or contradict it elsewhere.

| Task | Command |
|---|---|
| Plan a screen before coding | `impeccable shape` |
| Build a new surface | Impeccable new-work flow |
| **UX design review** | `impeccable critique <target>` |
| Accessibility / responsive / perf audit | `impeccable audit <target>` |
| **Front-end optimisation** | `impeccable optimize <target>` |
| Final pass before a release | `impeccable polish <target>` |
| Spacing, rhythm, hierarchy | `impeccable layout <target>` |
| Empty and first-run states | `impeccable onboard <target>` |
| Errors, i18n, edge cases | `impeccable harden <target>` |
| Record the design system once UI exists | `impeccable document` |

Workflow settings already recorded, do not re-ask: `.impeccable/config.json`
sets `buildPath: "code"` (build directly; ambition goes in the direction
contract and is audited at the finish).

After finishing changed UI, run the mechanical detector once:
`.claude/skills/impeccable/scripts/impeccable detect --json <changed targets>`

DESIGN.md and `.impeccable/design.json` exist, written from the shipped
tri-band build by the Impeccable documenter — not by hand. An ordinary
extension does not rewrite them; a new world or an approved system change does.

The two project review agents in `.claude/agents/` (`ui-reviewer`,
`schema-reviewer`) are cheap pre-PR checks for project-specific rules. They do
not replace `impeccable critique` or `impeccable audit`, which own design
quality and the technical audit respectively.

## Git flow

`main` (protected, production, tagged `vX.Y.Z`) · `develop` (default, preview) ·
`feature/MRG-###-slug` → PR into `develop` · `hotfix/slug` → PR into `main`,
**then back-merged into `develop`**.

**Merge method:** squash feature and hotfix PRs; use a real merge commit for
the release (`develop` → `main`) and the back-merge. Squashing a release makes
the two trunks diverge permanently — see the `gitflow` skill.

Branch names carry the backlog ID. The backlog lives in Obsidian at
`~/Documents/Notes/Marginalia/Backlog.md`. See the `gitflow` and `backlog`
skills in `.claude/skills/`.

## Where things are

```
src/app/          routes (App Router)
src/components/   UI
src/db/           schema.ts, index.ts (getDb), migrations/
src/lib/books/    the ONLY door to Google Books (primary) / Open Library
src/lib/auth.ts   Better Auth config
tests/fixtures/   recorded API responses
docs/             architecture.md + adr/   ← decisions live here, not in Obsidian
PRODUCT.md        confirmed product truth, read by Impeccable
.impeccable/      Impeccable workflow config
scripts/          smoke-books.mts
```

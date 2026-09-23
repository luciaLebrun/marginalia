<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Marginalia: working notes

## Shape and source of truth

- This is one root package, not a multi-package workspace: pnpm `10.5.0`; CI uses Node 22. `src/app` contains routes and server actions, `src/components` UI, `src/lib` domain code, `src/db` Drizzle code, and `tests/fixtures` recorded API responses.
- `scripts/*.mts` run through Node's type-stripping loader, so relative imports must keep explicit `.ts` extensions.
- The README's “No UI yet” status is stale; the current tree has the App Router UI and Playwright suites. Trust `package.json`, configs, code, `docs/architecture.md`, and the ADRs over that status.
- `PRODUCT.md` is the product source of truth; `DESIGN.md`/`.impeccable/design.json` describe the shipped design system. Read `.claude/skills/db-change/SKILL.md`, `.claude/skills/book-data/SKILL.md`, and `.claude/skills/gitflow/SKILL.md` when those areas are involved.

## Commands

```bash
pnpm install
cp .env.example .env.local       # fresh checkout; fill required values, never commit env files
pnpm db:migrate
pnpm dev
```

- Core checks: `pnpm lint`, `pnpm typecheck` (runs `next typegen` first; use its generated `PageProps` types), `pnpm test`, `pnpm test:coverage`, `pnpm build`; `pnpm test:integration` is the separate DB-backed suite.
- Before a PR, run `pnpm lint && pnpm typecheck && pnpm test && pnpm build` in that order. CI additionally runs `pnpm db:migrate` when `DATABASE_URL` is present, then `pnpm test:coverage`; its build deliberately uses placeholder auth/database values.
- Focused Vitest: `pnpm exec vitest run src/lib/books/router.test.ts`. Focused browser test: `pnpm exec playwright test e2e/search.spec.ts --project=desktop`.
- `pnpm smoke:books` is the opt-in live upstream check, not a normal test or CI check. `pnpm shot /dev/shelf` needs `pnpm dev` and captures 360/768/1440-width evidence.

## Boundaries that are easy to break

- All Google Books/Open Library I/O, normalization, caching, and cover URL policy belong in `src/lib/books/`. Components, route handlers, and server actions must not call either provider directly.
- `searchBooks()` queries both sources in parallel and merges them (Google leads; Open Library fills the remaining slots). A key never crosses providers: Google keys are `gb:<volume-id>`, Open Library keys are bare `OL...W`; keep title and author as separate query fields.
- `openBook()` in `src/lib/book.ts` is the app code's only first-open/book-insert path. Once a `book` row exists, diaries, profiles, reviews, and metadata use Postgres; do not re-fetch it. Preserve the distinction between a provider `null` (not found) and a thrown provider error (temporarily unavailable), and resolve Open Library redirect stubs to the stored key.
- Open Library cover URLs may use only a numeric `cover_i` via `coverUrl()`—never ISBN/LCCN/OCLC URLs. Google jacket URLs must be normalized to the allowed Google host. Covers render with plain `<img>`, not `next/image`.
- `getDb()` and `getAuth()` are lazy. Never construct a database client or touch the database at module scope; `next build` runs with placeholder credentials.
- `log` is a diary entry, not a rating: rereads are separate rows, and rating/review are independently nullable. Better Auth-owned columns and the schema's cascade/restrict rules are deliberate; read the schema and relevant skill before changing them.
- Auth is Google-only and invite-gated by `enforceInvite`; `MARGINALIA_OWNER_EMAIL` controls who may mint codes (unset means nobody). Preserve CSPRNG code generation, the single atomic claim update, and Better Auth's `transaction: false` adapter setting (Neon HTTP cannot hold transactions).
- Server actions must derive the reader from the session, not a form-supplied user ID, and validate boundary input with the shared Zod schema. Client components must not import Zod, Drizzle, the database, Better Auth, or Neon; put shared client constants in `src/lib/client-safe.ts` (`client-imports.test.ts` enforces the import graph).

## Tests, database, and environments

- Book-data unit tests use `tests/fixtures`, never live APIs. DB-backed `*.integration.test.ts` tests skip without a real, non-placeholder `DATABASE_URL`; they run serially, write/delete rows, and must use a dedicated Neon branch. Migrate that branch before running them.
- Playwright tests live in `e2e/`; most visual/state tests use `/dev/*` fixture harnesses and the seeded `dev-reader` (`pnpm seed:dev`). Those routes 404 in production. Playwright starts `pnpm dev` unless `E2E_BASE_URL` is set.
- For schema changes, edit `src/db/schema.ts`, run `pnpm db:generate`, read the generated SQL, migrate a Neon branch first, and commit the schema plus migration. Never use `pnpm db:push` on production. Destructive changes need an expand/contract split across deploys; `vercel.json` runs `pnpm db:migrate` before every build.
- `.env*` is ignored except `.env.example`; do not read, print, or commit real env files. `GOOGLE_BOOKS_API_KEY` is optional (Open Library remains the fallback), while database/auth variables are required for their features. For preview/production DB work, get the connection string from Neon—Vercel's `DATABASE_URL` secret cannot be read back—and verify the branch before using `.env.preview` or `.env.production`.

## UI and Git

- UI work goes through the Impeccable workflow, not ad-hoc design changes; use `PRODUCT.md`/`DESIGN.md` and run the installed Impeccable `detect --json <changed-targets>` pass after changed UI (the CLI is not vendored in this repository).
- `main` is production and `develop` is the persistent Vercel preview; deployment is Git integration, not a deploy workflow. Branches are `feature/MRG-###-slug` from `develop` into `develop` (squash), or `hotfix/slug` from `main` into `main` followed by a real back-merge into `develop`. Releases are `develop` → `main` and must be merged, never squashed. Do not commit directly to the protected trunks.

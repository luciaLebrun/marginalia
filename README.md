# Marginalia

A reading diary. Log a book, rate it, review it — Letterboxd's model applied to
books.

A closed proof of concept for a handful of readers, running entirely on free
infrastructure.

## Status

In use at https://marginalia.dpdns.org: search, book pages, diary, reviews,
profiles and invite-only sign-up.

## Getting started

Use the Node version in `.nvmrc` (`nvm use`); pnpm refuses any other.

```bash
pnpm install
cp .env.example .env.local     # then fill it in
pnpm db:migrate                # apply migrations to your Postgres
pnpm dev
```

You need a Postgres database and a Google OAuth client. See
`.env.example` for what each variable is and where to get it.

## Commands

| | |
|---|---|
| `pnpm dev` | Development server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `next typegen` then `tsc --noEmit` |
| `pnpm test` | Vitest, against fixtures |
| `pnpm test:coverage` | Vitest with coverage for Sonar |
| `pnpm test:integration` | Suites that need a real `DATABASE_URL` |
| `pnpm e2e` | Playwright, desktop and mobile |
| `pnpm build` | Production build |
| `pnpm smoke:books` | Live check against the real Open Library API |
| `pnpm db:generate` | Write a migration from `src/db/schema.ts` |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:studio` | Browse the database |
| `pnpm seed:dev` | One local reader, real books, three invite codes |
| `pnpm shot /dev/shelf` | Screenshot a route at 360/768/1440 (needs `pnpm dev`) |

## Stack

Next.js 16 (App Router, RSC) · TypeScript · Tailwind v4 · Drizzle ORM ·
PostgreSQL · Better Auth · Zod · Vitest.

Book data from [Open Library](https://openlibrary.org), enriched by Google
Books. Self-hosted on a free Google Cloud VM with Docker Compose, deployed by
hand with `deploy/deploy.sh <tag>`. CI on GitHub Actions with SonarQube Cloud.
Images are built to GHCR and scanned with Trivy. The Security tab lists only
findings that have a fix, and a fixable CRITICAL fails the build.

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — how it fits together
- [`docs/adr/`](docs/adr) — why it is built this way
- [`CLAUDE.md`](CLAUDE.md) — conventions and invariants

## Contributing

Git flow without release branches: `feature/MRG-###-slug` → `develop` → `main`.
See `.claude/skills/gitflow/SKILL.md`.

`pnpm install` sets up git hooks (husky): staged files are linted on commit and
messages must be `type(scope): subject (MRG-###)`. Skip with `--no-verify`.

## Acknowledgements

Book metadata and cover images courtesy of
[Open Library](https://openlibrary.org), a project of the Internet Archive.

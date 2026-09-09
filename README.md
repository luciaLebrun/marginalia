# Marginalia

A reading diary. Log a book, rate it, review it — Letterboxd's model applied to
books.

A closed proof of concept for a handful of readers, running entirely on free
infrastructure.

## Status

Phase 1–2 (foundation and data layer). No UI yet.

## Getting started

```bash
pnpm install
cp .env.example .env.local     # then fill it in
pnpm db:migrate                # apply migrations to your Neon branch
pnpm dev
```

You need a [Neon](https://neon.com) project and a Google OAuth client. See
`.env.example` for what each variable is and where to get it.

## Commands

| | |
|---|---|
| `pnpm dev` | Development server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `next typegen` then `tsc --noEmit` |
| `pnpm test` | Vitest, against fixtures |
| `pnpm test:coverage` | Vitest with coverage for Sonar |
| `pnpm build` | Production build |
| `pnpm smoke:books` | Live check against the real Open Library API |
| `pnpm db:generate` | Write a migration from `src/db/schema.ts` |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:studio` | Browse the database |

## Stack

Next.js 16 (App Router, RSC) · TypeScript · Tailwind v4 · Drizzle ORM ·
PostgreSQL on Neon · Better Auth · Zod · Vitest.

Book data from [Open Library](https://openlibrary.org), enriched by Google
Books. Hosted on Vercel. CI on GitHub Actions with SonarQube Cloud.

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — how it fits together
- [`docs/adr/`](docs/adr) — why it is built this way
- [`CLAUDE.md`](CLAUDE.md) — conventions and invariants

## Contributing

Git flow without release branches: `feature/MRG-###-slug` → `develop` → `main`.
See `.claude/skills/gitflow/SKILL.md`.

## Acknowledgements

Book metadata and cover images courtesy of
[Open Library](https://openlibrary.org), a project of the Internet Archive.

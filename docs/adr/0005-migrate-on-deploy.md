# ADR 0005 — Each Vercel environment migrates its own database on deploy

**Status:** accepted · 2026-09-10

## Context

Vercel holds a separate `DATABASE_URL` per environment, so production and
preview point at different Neon branches. Nothing applied migrations to either.

This had already bitten twice. CI failed with `column "last_seen_at" does not
exist` because its Neon branch had drifted behind the schema, and production
drifted the same way without anyone noticing: `0000` was applied while local
pointed at the original branch, while `0001` and `0002` were applied after it
was switched to the develop branch. Production would have 500'd on its first
real visitor, and the failure would have looked like broken code rather than a
missing step.

The pattern is the problem, not the instances. A schema change that needs a
human to remember one manual step, in one place, per environment, will be
forgotten — and the forgetting surfaces as a runtime error far from its cause.

## Decision

`vercel.json` sets the build command to `pnpm db:migrate && pnpm build`.

Each Vercel deployment migrates the database its own environment points at,
using its own `DATABASE_URL`, before building. Production migrates production;
preview migrates the develop branch. CI already does the same for its branch.

## Rationale

There is no separate release phase on Vercel, so the build command is where
this has to live. drizzle-kit is idempotent — it reads the migrations table and
skips what is applied — so repeated deployments cost one query.

A build that cannot reach its database now fails instead of deploying code
whose schema is not there. That is the right direction to fail in: a failed
deploy is visible and reversible, a 500 on a reader's first visit is neither.

`vercel.json` rather than the dashboard's build-command field, so the decision
is in the repository, reviewable in a diff, and the same for everyone.

## Consequences

- Migrations run *before* the new code is live, so during a deploy the old code
  briefly runs against the new schema. Additive migrations are safe; a
  destructive one must therefore be split across two deploys — expand first,
  then contract once nothing reads the old shape.
- `pnpm build` in CI keeps its placeholder `DATABASE_URL` and does not migrate;
  only Vercel uses this build command.
- The production Neon branch still needs its first catch-up migration, which
  this deploy performs.
- **Every deploy log carries a warning that does not apply to us**, and it is
  recorded here so nobody chases it twice:

  > `'@neondatabase/serverless' can only connect to remote Neon/Vercel
  > Postgres/Supabase instances through a websocket`

  `drizzle.config.ts` names no `driver`, so drizzle-kit picks one by looking at
  what is installed. It finds `@neondatabase/serverless`, chooses
  `drizzle-orm/neon-serverless` — the WebSocket `Pool` driver — and prints this
  note to say that driver cannot reach a plain local Postgres over TCP. Our
  database is remote Neon, so the constraint never binds. It is informational,
  not a failure: `drizzle-kit migrate` exits 0 and reports "migrations applied
  successfully" alongside it.

  There is also no way to silence it from config — drizzle-kit's `driver` field
  selects `aws-data-api`, `pglite`, `d1-http` and the like, not which Postgres
  client to use.

  A genuine migration failure looks nothing like this. `buildCommand` is
  `pnpm db:migrate && pnpm build`, so a non-zero exit from migrate means
  `next build` never runs and the deployment fails outright. A build that
  completed is a build whose migrations applied.
- **Migrations and the app deliberately use different drivers.** drizzle-kit
  migrates over `neon-serverless` (WebSocket), while `src/db/index.ts` runs the
  app on `neon-http`. That is the right split: HTTP suits one-shot serverless
  queries, and the WebSocket session is what lets a migration run inside a
  transaction. It is also why `transaction: false` is required on the Better
  Auth adapter but *not* on migrations — the constraint belongs to neon-http
  alone.

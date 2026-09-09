# ADR 0002 — Neon rather than Supabase for Postgres

**Status:** accepted · 2026-09-09

## Context

We need free Postgres. Supabase was the default candidate (it is what a previous
project of the author's uses, and it bundles auth and realtime).

## Decision

Neon Free.

## Rationale

**Supabase Free pauses a project after 7 consecutive days of inactivity, and
restoring it requires a manual click in their dashboard.** Marginalia is used by
a handful of people who open it every week or two. Under Supabase, the site
would be *down* for most visits until someone noticed and went to fix it — a
POC that is offline whenever a friend tries it has failed at its only job.

Neon suspends compute after roughly 5 minutes idle and **wakes automatically on
the next query**. The first query after a sleep pays a few hundred milliseconds
of cold start; nobody has to do anything.

Neon Free also gives 0.5 GB (book rows are tiny) and 10 database branches, which
we use to rehearse migrations.

## Consequences

- No bundled auth — see ADR 0003.
- No bundled realtime. Not in scope.
- Migrations are rehearsed on a Neon branch before touching production.

# ADR 0001 — TypeScript and Next.js for the whole stack

**Status:** accepted · 2026-09-09

## Context

The stack was chosen for performance, maintainability and production-readiness,
with a hard constraint that everything must stay free, and a single developer
building it. A Go or Rust API behind a separate SPA was the main alternative.

## Decision

One TypeScript application: Next.js 16 App Router with React Server Components,
deployed to Vercel Hobby.

## Rationale

The bottleneck is not CPU. A request spends its time on the Open Library
round-trip and on Postgres; a Go handler and a Node handler wait the same amount
of time for both.

Free hosting punishes containers. Fly.io and Render no longer offer a
comfortable always-free container tier, while Vercel Hobby genuinely does for
serverless. A separate Go API would mean a second host, a second deploy
pipeline, a second CI configuration and a second Sonar project — real ongoing
cost, against a zero-cost constraint.

Server Components let a book page render server-side straight from Postgres with
no client-side fetch waterfall, which is where the *perceived* speed of a
cover-heavy page is actually won.

## Consequences

- One language, one repo, one pipeline, one quality gate.
- Vercel Hobby is non-commercial; monetising would require a paid plan.
- If a genuinely CPU-bound need appears later, it can be extracted as a separate
  service without rewriting the app.

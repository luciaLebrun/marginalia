# ADR 0003 — Better Auth with Google OAuth, gated by invite codes

**Status:** accepted · 2026-09-09

## Context

Having chosen Neon (ADR 0002), auth is not bundled. This is a closed POC, so
signup needs a gate. Candidates: Better Auth, Auth.js, Clerk.

## Decision

Better Auth, self-hosted in our own database, with Google as the only OAuth
provider and an `invite_code` table gating account creation.

## Rationale

Better Auth has no MAU ceiling, a first-class Drizzle + Postgres adapter, and is
built for the Next.js App Router. The user tables live in our database, so there
is no vendor to migrate off later and an auth check is a local query rather than
a network hop.

Clerk's free tier would also work but puts the user store in someone else's
service and adds roughly 60ms to every auth check. Auth.js is lighter but leaves
more to build by hand.

Google OAuth means no passwords to store and no transactional email provider to
configure — magic links would have required both, plus SPF/DKIM on a domain we
do not yet own. Invite codes keep the circle closed without any of that.

## Consequences

- We own the auth surface and must keep Better Auth patched.
- Anyone without a Google account cannot join. Acceptable for this circle.
- New user fields must be declared both in `src/db/schema.ts` and as
  `additionalFields` in the Better Auth config, or they are not writable.

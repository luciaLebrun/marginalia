# ADR 0010 — Self-host on a free Google Cloud VM

**Status:** accepted · 2026-10-01

## Context

Marginalia began as a learning project, and running the whole thing ourselves is
part of what there is to learn. It also matters that the readers' data sits
somewhere we control and can back up, rather than behind two free tiers that can
change their terms. The constraint has not moved: it must cost nothing.

Production ran on Vercel Hobby with Neon Free (ADRs 0002 and 0005).

## Decision

Production runs on a Google Cloud free-tier e2-micro VM (project
`marginalia-508219`, `us-east1-b`) under Docker Compose: Postgres 18, a one-shot
migrate-and-backfill job (the tools image), the Next.js standalone app, and a
Cloudflare named tunnel `marginalia` serving https://marginalia.dpdns.org (a free
DigitalPlat domain, DNS on Cloudflare).

CI (`.github/workflows/image.yml`) builds and pushes `marginalia` and
`marginalia-tools` to GHCR, public. `deploy/deploy.sh <tag>` pulls them on the VM
over IAP SSH; there are no public inbound ports. Nightly `deploy/backup.sh` runs
`pg_dump`, keeps 14 locally and uploads to `gs://marginalia-508219-backups` (30-day
lifecycle, write-only service account).

## Alternatives weighed

- **Synology DS218j.** Too weak: a 32-bit CPU, 500 MB of RAM, and no Docker.
- **The MacBook.** A laptop sleeps, travels and loses its network.
- **Oracle Always Free.** Larger, but idle instances are reclaimed, which is the
  Supabase failure of ADR 0002 again.
- **Staying on Vercel and Neon.** It works, and costs nothing, but teaches the
  least and leaves the data on someone else's free tier.

## Consequences

- Free-tier limits are now ours to respect: e2-micro, `us-east1`, 30 GB
  pd-standard, 1 GB egress a month. A €1 budget alert is the tripwire.
- One VM means no high availability. A host failure is an outage until restored
  from a backup.
- Deploys are manual for now (`deploy/deploy.sh <tag>`); automating them from CI
  is undecided.
- Migrations run in the compose migrate job on every deploy, replacing
  `vercel.json`'s build command. ADR 0005's reasoning (migrate before the new
  code is live, expand then contract) still holds.
- Cloudflare sits in the request path.
- The app talks to Postgres through postgres-js; Better Auth keeps
  `transaction: false`.
- Neon is kept untouched as a rollback, and `deploy/import-from-neon.sh` did the
  one-time copy. `marginalia-roan.vercel.app` becomes a permanent redirect to the
  new domain.
- Supersedes the Vercel parts of ADR 0002 (hosting Postgres on Neon) and ADR 0005
  (migrating in Vercel's build).

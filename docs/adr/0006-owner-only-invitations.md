# ADR 0006 — Only the owner mints invitations, and the owner is an env var

**Status:** accepted · 2026-09-10

## Context

ADR 0003 put an `invite_code` table in front of account creation, but nothing
in the product could create a code — `createInviteCodes()` existed with no
caller. Building the account surface (MRG-033) forced the question of who may
mint one.

Invite codes are the only thing standing between a stranger with a Google
account and an account here. Whoever can mint is, in effect, who can open the
door, so this is an access-control decision rather than a feature decision.

The user chose owner-only over every-member and over a per-member quota. The
schema had no notion of an owner.

## Decision

Minting is restricted to addresses listed in the `MARGINALIA_OWNER_EMAIL`
environment variable — one address or several, comma separated. `isOwner()` in
`src/lib/owner.ts` is the only reader. It is enforced in `mintInviteAction`,
not only in the page that renders the control.

The door additionally checks whether a code is usable *before* handing the
visitor to Google.

## Rationale

An env var rather than a `user.is_owner` column, for three reasons. It needs no
migration and no free-tier storage, which matters under this project's
zero-cost constraint. It is set in the same place as every other secret, so
provisioning is one list. And it cannot be escalated by anything that reaches
the database: an attacker with write access to `user` still cannot make
themselves the owner, because the answer is not stored there.

Unset means nobody can mint. A deployment that forgets to configure an owner
closes the door rather than opening it to every member — the same fail-closed
direction `enforceInvite()` already takes.

The pre-check is a deliberate, accepted oracle: someone holding a code can
learn that it is spent. The alternative is worse in practice. Without it, a
friend who mistypes their code is sent through the whole Google round-trip,
has sign-up aborted by the `user.create.before` hook, and lands back on the
door with a burned session and no explanation. With 29^8 possible codes and
single figures of them live at any time, mistyping is the threat model here;
guessing is not. Vercel Hobby offers no rate limiting to lean on either way.

## Consequences

- `MARGINALIA_OWNER_EMAIL` joins the four variables MRG-008 provisions. Miss it
  and the invite section renders for nobody, which is the intended failure.
- Growing the circle is a manual step through the owner. If that becomes a
  bottleneck, the per-member quota the user declined is the next design, and it
  needs a real column.
- The oracle is documented rather than hidden. If this app ever opens up, the
  pre-check is the first thing to remove.
- Deleting the owner's account cascades their codes away, by the schema's
  existing `created_by` rule. An issuer who no longer exists leaves no live
  doors behind.

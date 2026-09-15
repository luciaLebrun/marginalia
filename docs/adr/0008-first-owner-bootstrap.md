# ADR 0008 — The first account is the one that cannot be invited

**Status:** accepted · 2026-09-10

## Context

The invite gate (ADR 0003) and the schema deadlock each other.

No account can be created without consuming an invite code, and no invite code
can be created without an account: `invite_code.created_by` is `NOT NULL` and
references `user.id`. `createInviteCodes()` additionally requires a session,
and ADR 0006 narrows minting to the owner.

The consequence was found the hard way, on the first real sign-in attempt
against a deployed environment:

```
ERROR [Better Auth]: Unable to create OAuth user
Error: An invite code is required to create an account.
```

That error is the gate behaving exactly as designed. The problem is that there
is no state of the world in which it stops firing. A freshly deployed
Marginalia could not be entered by anybody — including its author — without
editing the database by hand to insert a user row that Better Auth had not
created, purely so that row could issue a code to somebody else.

A deadlock reachable only on first use is the worst kind: it survives every
test, every review and every deploy, and surfaces at the exact moment the
product is first shown to someone.

## Decision

Exactly one door is left open, and only while the building is empty. The
address in `MARGINALIA_OWNER_EMAIL` may create an account when **no accounts
exist at all**. The moment one does, the exception closes permanently.

The policy is `bootstrapAllowed()` in `src/lib/bootstrap.ts`, pure and separate
from the query that feeds it. `enforceInvite()` consults it first, so the
owner's own account never spends a code.

## Rationale

The alternatives were worse.

*Seed a code by hand on every deployment* keeps the gate absolute, but makes
first use a manual database step that has to be remembered per environment —
the precise failure mode ADR 0005 was written to eliminate.

*Insert a placeholder user to own the first codes* leaves a row that Better
Auth did not create, has no OAuth account attached, and would show up in any
future query over readers.

*Let the first arrival in* is the common shape of this exception and is wrong
here: it hands the app to whoever finds the URL first.

What makes the chosen rule narrow is that it is gated on identity as well as
emptiness, and the identity is verified. By the time the `user.create.before`
hook runs, Google has already proved the visitor controls that address; the
email is not a claim from a form. `isOwner()` fails closed on a missing
variable, so an unconfigured deployment stays shut rather than standing open.
And the window is not reusable: one account closes it, after which the owner
needs a code like everybody else.

Two owners racing an empty table both pass the check, and the unique index on
`user.email` refuses the second — one row is created either way.

## Consequences

- A fresh deployment is entered by its owner signing in normally. No seeding,
  no manual SQL, no per-environment ritual.
- **Deleting every account reopens the window** for the configured owner. That
  follows from the rule rather than contradicting it: an empty deployment has
  to be enterable, or it is bricked. Worth remembering when testing the delete
  fence against a single-account environment.
- `MARGINALIA_OWNER_EMAIL` is now load-bearing twice: it decides who may mint
  codes, and who may open a fresh deployment. Setting it wrong no longer fails
  quietly with a hidden invite section — it locks the deployment.
- The policy is unit-tested exhaustively without a database; the occupancy
  question is integration-tested against a real one.

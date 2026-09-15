# ADR 0007 — A handle can be changed, and the old one dies

**Status:** accepted · 2026-09-10 · supersedes the permanence rule in MRG-012

## Context

MRG-012 shipped the username claim as a one-way door: `claimUsername()` matches
`WHERE username IS NULL`, and the form told the reader their handle "cannot be
changed later". A handle is the public address of a diary (`/@name`), so the
promise was made to keep those links stable.

Building the account surface (MRG-033) put the question to the user directly,
with three options: keep permanence, allow renaming with the old address dying,
or allow renaming with the old address redirecting. They chose the middle one.

## Decision

`updateAccount()` renames a handle. The old name is freed immediately: a link
to it 404s, and anyone may take it. There is no handle-history table and no
redirect.

The claim form's copy was rewritten to say so, and the first claim remains a
separate operation from a rename.

## Rationale

Redirecting is the kindest option and the most expensive one. It needs a
handle-history table, a rule for when an abandoned name becomes takeable again,
and a resolution order at every route that reads a handle — permanently, for
every future feature that addresses a reader. For a closed diary of under a
dozen people who can tell each other they have moved, that is a structure
carried forever to solve a problem that arises a handful of times.

Freeing the name immediately is also the honest behaviour. A name held in
reserve by an invisible history table is a name the next person is told is
"taken" with no way to see by whom.

Both operations let the unique index decide rather than checking first: two
readers racing for the same handle both pass a prior `SELECT`, and only one
survives 23505. `claimUsername()` keeps its `WHERE username IS NULL` clause so
a double-claim from two tabs still matches no row.

## Consequences

- A shared `/@name` link breaks when its owner renames. Accepted, and stated in
  the interface at the point of renaming rather than buried in help text.
- A freed handle can be taken by someone else, including deliberately. In a
  circle this size that is a social problem, not a technical one; if the app
  ever opens up, this ADR is the one to revisit first.
- `revalidatePath` must be called for both the old and the new handle on a
  rename, or the old address serves a cached page after it has stopped
  resolving.
- The rename shares one `UPDATE` with name and bio, so a taken handle fails the
  whole account save. That coupling is deliberate — see the account-sheet note
  in CLAUDE.md.

---
name: db-change
description: The safe workflow for changing the database schema with Drizzle and Neon. Use whenever editing src/db/schema.ts, adding a table or column, or generating and applying a migration.
---

# Changing the database

## The loop

1. Edit `src/db/schema.ts`. Nothing else defines the schema.
2. `pnpm db:generate` — writes a SQL migration into `src/db/migrations/`.
3. **Read the generated SQL before applying it.** drizzle-kit will happily emit
   a `DROP COLUMN` when it thinks you renamed something. It cannot tell a rename
   from a drop-and-add.
4. Apply it to a **Neon branch first**, never straight to production:
   ```bash
   # Neon dashboard → Branches → New branch from main
   DATABASE_URL="<branch-url>" pnpm db:migrate
   ```
   The free plan gives 10 branches; this is what they are for.
5. Verify with `pnpm db:studio` against the branch.
6. Commit the schema change **and** the generated migration in the same commit.
   A schema edit without its migration is the main source of drift.
7. Once merged to `main`, run `pnpm db:migrate` against production.

Never use `pnpm db:push` on production. It skips the migration file and puts the
schema out of sync with the repo.

## Rules for this schema

- **`getDb()` is lazy on purpose.** `next build` runs with a placeholder
  `DATABASE_URL`; a module-scope `drizzle(...)` call breaks CI.
- **Index anything you filter or sort by.** Already present:
  `log(userId, readAt DESC)` for the profile, `log(bookId)` for the book page,
  unique `book(olWorkKey)` for the cache lookup. Adding a query pattern means
  adding an index in the same PR.
- **Cascades are deliberate.** `session`/`account`/`log` cascade from `user`
  (deleting an account removes its data). `log → book` is `restrict`: a book
  someone reviewed must not be deletable out from under the review.
- **`log` has no unique constraint on `(userId, bookId)`.** Rereads are separate
  rows. Do not "fix" this.
- Better Auth owns the shape of `user`, `session`, `account`, `verification`.
  Do not rename their columns. New user fields must be added to the schema *and*
  declared as `additionalFields` in `src/lib/auth.ts`, or they will not be
  writable.

## Free-tier limits worth remembering

Neon Free: 0.5 GB storage, 10 branches, compute auto-suspends after ~5 minutes
idle and auto-wakes on the next query. The first query after a sleep pays a
cold-start of a few hundred ms — that is expected, not a bug.

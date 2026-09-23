-- Hand-edited (MRG-072). Rows that exist before this migration are marked
-- '?' — "not looked up yet" — by the temporary default, which is then dropped
-- so every row opened from now on starts null or with its real category.
-- scripts/backfill-categories.mts replaces each '?' in the same Vercel build,
-- straight after this migration; a row it cannot reach keeps '?' and is
-- retried on the next build.
ALTER TABLE "book" ADD COLUMN "category" text DEFAULT '?';--> statement-breakpoint
ALTER TABLE "book" ALTER COLUMN "category" DROP DEFAULT;

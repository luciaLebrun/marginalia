-- MRG-063: Google Books becomes the primary source, Open Library the fallback.
--
-- `ol_work_key` no longer holds only Open Library work keys, so it is renamed
-- rather than replaced: every existing row is a real Open Library book and
-- keeps its bare key ("OL45804W"), which is still how those books are opened.
-- Google rows arrive tagged ("gb:B1hSG45JCX4C").
ALTER TABLE "book" RENAME COLUMN "ol_work_key" TO "source_key";--> statement-breakpoint
ALTER INDEX "book_ol_work_key_idx" RENAME TO "book_source_key_idx";--> statement-breakpoint

-- Google addresses covers by URL; Open Library addresses them by CoverID.
-- A row carries whichever its source gave, and null in both means no jacket.
ALTER TABLE "book" ADD COLUMN "cover_url" text;

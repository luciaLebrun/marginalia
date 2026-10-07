CREATE TABLE "passage" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"book_id" text NOT NULL,
	"words" text NOT NULL,
	"page" integer,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "passage_page_positive" CHECK ("passage"."page" > 0)
);
--> statement-breakpoint
ALTER TABLE "passage" ADD CONSTRAINT "passage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passage" ADD CONSTRAINT "passage_book_id_book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."book"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "passage_user_created_at_idx" ON "passage" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "passage_user_book_idx" ON "passage" USING btree ("user_id","book_id");
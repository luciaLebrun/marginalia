CREATE TABLE "to_read" (
	"user_id" text NOT NULL,
	"book_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "to_read_user_id_book_id_pk" PRIMARY KEY("user_id","book_id")
);
--> statement-breakpoint
ALTER TABLE "to_read" ADD CONSTRAINT "to_read_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "to_read" ADD CONSTRAINT "to_read_book_id_book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."book"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "to_read_user_created_at_idx" ON "to_read" USING btree ("user_id","created_at" DESC NULLS LAST);
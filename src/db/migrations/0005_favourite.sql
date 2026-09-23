CREATE TABLE "favourite" (
	"user_id" text NOT NULL,
	"book_id" text NOT NULL,
	"position" smallint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "favourite_user_id_book_id_pk" PRIMARY KEY("user_id","book_id"),
	-- Hand-edited: DEFERRABLE is not expressible in Drizzle's schema. Checked at
	-- the end of each statement, so one UPDATE can swap two positions.
	CONSTRAINT "favourite_user_position_unique" UNIQUE("user_id","position") DEFERRABLE INITIALLY IMMEDIATE,
	CONSTRAINT "favourite_position_range" CHECK ("favourite"."position" BETWEEN 0 AND 3)
);
--> statement-breakpoint
ALTER TABLE "favourite" ADD CONSTRAINT "favourite_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favourite" ADD CONSTRAINT "favourite_book_id_book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."book"("id") ON DELETE restrict ON UPDATE no action;
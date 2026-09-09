import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/* Better Auth tables                                                          */
/*                                                                             */
/* These four table shapes are dictated by Better Auth. Do not rename columns. */
/* `username` and `bio` are our additionalFields — they must also be declared  */
/* in the Better Auth config in src/lib/auth.ts or they will not be writable.  */
/* -------------------------------------------------------------------------- */

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),

    // Our additions.
    username: text("username"),
    bio: text("bio"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_username_idx").on(t.username)],
);

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/* Marginalia tables                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Signup gate. This is a closed POC: an account can only be created by
 * consuming an unused, unexpired code.
 */
export const inviteCode = pgTable(
  "invite_code",
  {
    code: text("code").primaryKey(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    usedBy: text("used_by").references(() => user.id, { onDelete: "set null" }),
    usedAt: timestamp("used_at"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("invite_code_created_by_idx").on(t.createdBy)],
);

/**
 * Our local copy of a book. This table is the record, not Open Library.
 *
 * A row is written the first time anyone opens a book page, and never read
 * from an external API again. That is what keeps diaries and reviews working
 * when openlibrary.org is slow or down.
 */
export const book = pgTable(
  "book",
  {
    id: text("id").primaryKey(),

    /** Open Library work key, stored bare: "OL45804W", not "/works/OL45804W". */
    olWorkKey: text("ol_work_key").notNull(),
    /** Optional edition key ("OL7353617M") when we resolved a specific one. */
    olEditionKey: text("ol_edition_key"),

    title: text("title").notNull(),
    subtitle: text("subtitle"),
    authors: text("authors").array().notNull().default([]),
    firstPublishYear: integer("first_publish_year"),

    /**
     * Open Library numeric CoverID. Cover URLs MUST be built from this, never
     * from an ISBN — ISBN-addressed covers are rate limited to 100 requests
     * per IP per 5 minutes and will 403 on a busy grid. See src/lib/books/covers.ts.
     */
    coverId: integer("cover_id"),

    isbn13: text("isbn13"),
    pageCount: integer("page_count"),
    description: text("description"),

    /** Which source filled this row: "openlibrary" or "openlibrary+google". */
    source: text("source").notNull().default("openlibrary"),
    cachedAt: timestamp("cached_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("book_ol_work_key_idx").on(t.olWorkKey)],
);

/**
 * A diary entry. Deliberately not unique on (userId, bookId): rereads are
 * separate entries, exactly like a Letterboxd film log.
 *
 * `rating` and `reviewText` are both nullable so that "I read this, no
 * opinion" and "4 stars, no words" are each expressible.
 */
export const log = pgTable(
  "log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    bookId: text("book_id")
      .notNull()
      .references(() => book.id, { onDelete: "restrict" }),

    /** 0.5 to 5.0 in half steps. Validated by Zod before it reaches here. */
    rating: numeric("rating", { precision: 2, scale: 1 }),
    reviewText: text("review_text"),
    containsSpoilers: boolean("contains_spoilers").notNull().default(false),

    /** Null means "read at some point, date unknown". */
    readAt: date("read_at"),
    isReread: boolean("is_reread").notNull().default(false),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    // The profile / diary query.
    index("log_user_read_at_idx").on(t.userId, t.readAt.desc()),
    // The book page query.
    index("log_book_id_idx").on(t.bookId),
  ],
);

export type User = typeof user.$inferSelect;
export type Book = typeof book.$inferSelect;
export type NewBook = typeof book.$inferInsert;
export type Log = typeof log.$inferSelect;
export type NewLog = typeof log.$inferInsert;
export type InviteCode = typeof inviteCode.$inferSelect;

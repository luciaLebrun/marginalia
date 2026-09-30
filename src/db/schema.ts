import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
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

    /**
     * When this reader last opened their diary. Entries created after it are
     * new to them, which is what makes the ink-in animation mean something.
     * Held here rather than in browser storage so a second device, a private
     * window or a cleared store all agree.
     */
    lastSeenAt: timestamp("last_seen_at"),

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
/** `book.category` on a row the MRG-072 backfill has not reached yet. */
export const CATEGORY_PENDING = "?";

export const book = pgTable(
  "book",
  {
    id: text("id").primaryKey(),

    /**
     * The book's key at its source, and its URL segment. Google Books volumes
     * are tagged ("gb:B1hSG45JCX4C"); Open Library work keys stay bare
     * ("OL45804W", never "/works/OL45804W") so every link made before Google
     * became the primary source still opens. See src/lib/books/index.ts.
     */
    sourceKey: text("source_key").notNull(),
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

    /**
     * An absolute jacket URL, for a source that addresses covers by URL rather
     * than by id — Google Books. Exclusive with coverId in practice: a row has
     * whichever its source gave. Null on both means the book has no jacket.
     */
    coverUrl: text("cover_url"),

    /**
     * Band colour derived from the cover art once, at upsert, and stored.
     * Null means the cover was monochrome, absent or undecodable — the UI then
     * falls back to a stable category colour. Never computed at render time.
     */
    coverColor: text("cover_color"),

    isbn13: text("isbn13"),
    pageCount: integer("page_count"),
    description: text("description"),

    /**
     * One shelf category, e.g. "Science Fiction" (MRG-072), from the source at
     * first open. Null means none was found, and the shelf files the book
     * under "Uncategorised". `CATEGORY_PENDING` marks a row opened before
     * MRG-072 that scripts/backfill-categories.mts has not reached yet —
     * migration 0006 sets it. See src/lib/books/category.ts.
     */
    category: text("category"),

    /** Which source filled this row: "google", "openlibrary" or "openlibrary+google". */
    source: text("source").notNull().default("openlibrary"),
    cachedAt: timestamp("cached_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("book_source_key_idx").on(t.sourceKey)],
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

/**
 * A reader's to-read list (MRG-059): books they mean to read, private to them.
 *
 * One row per reader and book — a book is on the list or it is not — so the
 * primary key is the pair, and saving twice is decided by that key rather
 * than by a lookup first. Logging a read of the book removes its row.
 * Deleting an account removes the list with it; a book on someone's list is
 * not deletable out from under it, as with `log`.
 */
export const toRead = pgTable(
  "to_read",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    bookId: text("book_id")
      .notNull()
      .references(() => book.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.bookId] }),
    // The list page: one reader's list, newest saved first.
    index("to_read_user_created_at_idx").on(t.userId, t.createdAt.desc()),
  ],
);

/**
 * A reader's favourite books (MRG-071): at most four, in an order the reader
 * sets, shown as a band on their diary and profile.
 *
 * The database holds both rules, so no code path can break them:
 * - **At most four** is `position` between 0 and 3 and unique per reader. A
 *   fifth insert has no free position and fails the check.
 * - **The order** is `position`. The unique constraint is DEFERRABLE, added by
 *   hand in migration 0005 because Drizzle cannot express it, so a swap of two
 *   positions is one UPDATE checked at the end of the statement. The neon-http
 *   driver cannot hold a transaction open, so one statement is the only atomic
 *   unit there is.
 *
 * Only a book the reader has logged may be a favourite; that is checked in the
 * same INSERT (`src/lib/favourites.ts`), and removing a book's last read takes
 * it off (`removeRead`).
 */
export const favourite = pgTable(
  "favourite",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    bookId: text("book_id")
      .notNull()
      .references(() => book.id, { onDelete: "restrict" }),
    position: smallint("position").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.bookId] }),
    unique("favourite_user_position_unique").on(t.userId, t.position),
    check("favourite_position_range", sql`${t.position} BETWEEN 0 AND 3`),
  ],
);

export type User = typeof user.$inferSelect;
export type Book = typeof book.$inferSelect;
export type NewBook = typeof book.$inferInsert;
export type Log = typeof log.$inferSelect;
export type NewLog = typeof log.$inferInsert;
export type InviteCode = typeof inviteCode.$inferSelect;
export type ToRead = typeof toRead.$inferSelect;
export type Favourite = typeof favourite.$inferSelect;

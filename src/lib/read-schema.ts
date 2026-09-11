import { z } from "zod";

/**
 * The log sheet's shape, shared by the form and the server action.
 *
 * Deliberately free of any database import, so the client component can read
 * its limits without pulling the driver into the browser bundle. A server
 * action is a public endpoint, so whatever the form enforces, the action
 * enforces again through this same schema.
 */

/** Room for a considered paragraph or three; not a place to paste a book. */
export const REVIEW_MAX = 5000;

export type LogReadField = "readAt" | "rating" | "review";

export function isLogReadField(value: string): value is LogReadField {
  return value === "readAt" || value === "rating" || value === "review";
}

/**
 * The latest calendar date a read may carry: tomorrow, in UTC.
 *
 * "Today" belongs to the reader, and the server does not know their zone. The
 * furthest zone ahead of UTC is fourteen hours, which is never more than one
 * calendar day, so tomorrow-in-UTC admits every reader's real today and still
 * refuses a date that has not happened anywhere.
 */
export function latestReadDate(now: Date = new Date()): string {
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  return tomorrow.toISOString().slice(0, 10);
}

/** A real YYYY-MM-DD date — so "2026-02-30" is refused, not rolled into March. */
function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** 0.5 to 5.0 in half steps — what `log.rating`, numeric(2,1), is for. */
function isHalfStep(value: string): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0.5 && n <= 5 && Number.isInteger(n * 2);
}

export const readSchema = z.object({
  bookId: z.string().trim().min(1, "Open the book again and log it from there."),

  /** Empty means Undated, which is a real answer rather than a missing one. */
  readAt: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || isCalendarDate(value),
      "That isn’t a date. Pick one, or leave it Undated.",
    )
    .refine(
      (value) => value === "" || value <= latestReadDate(),
      "That date hasn’t happened yet.",
    )
    .transform((value) => (value === "" ? null : value)),

  /** The range input sends "0" while untouched, which means unrated. */
  rating: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || value === "0" || isHalfStep(value),
      "A rating runs from half a mark to five, in halves.",
    )
    .transform((value) => (value === "" || value === "0" ? null : Number(value))),

  review: z
    .string()
    .trim()
    .max(REVIEW_MAX, `A review here is at most ${REVIEW_MAX} characters.`)
    .transform((value) => (value.length === 0 ? null : value)),

  isReread: z.boolean(),
});

export type ReadInput = z.infer<typeof readSchema>;

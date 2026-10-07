import { z } from "zod";

import { PASSAGE_MAX, PASSAGE_NOTE_MAX } from "./client-safe";

/**
 * A kept passage's shape, shared by the form and the server action.
 *
 * Free of any database import, like read-schema. The page and note arrive as
 * form strings: empty means "none", which is an answer rather than a gap.
 */

export { PASSAGE_MAX, PASSAGE_NOTE_MAX };

export const PAGE_MAX = 99999;

export const passageSchema = z.object({
  bookId: z.string().trim().min(1, "Open the book again and keep the passage from there."),

  words: z
    .string()
    .trim()
    .min(1, "Put the passage in, in the author’s words.")
    .max(PASSAGE_MAX, `A passage here is at most ${PASSAGE_MAX} characters.`),

  page: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" || (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= PAGE_MAX),
      "A page is a whole number, like 214.",
    )
    .transform((value) => (value === "" ? null : Number(value))),

  note: z
    .string()
    .trim()
    .max(PASSAGE_NOTE_MAX, `A note here is at most ${PASSAGE_NOTE_MAX} characters.`)
    .transform((value) => (value.length === 0 ? null : value)),
});

export type PassageInput = z.infer<typeof passageSchema>;

import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "@/db";
import { MAX_LENGTH as USERNAME_MAX, usernameError } from "./username";

/** Long enough for a real name, short enough to set at display scale in the masthead. */
export const NAME_MAX = 60;

/**
 * A few lines under a handle on the public diary — about three on a laptop and
 * five on a phone at the limit. Not a place to write an essay.
 */
export const BIO_MAX = 240;

/**
 * The account form's shape, shared by the client form and the server action.
 *
 * A server action is a public endpoint: whatever the form enforces, the action
 * must enforce again. Keeping one schema is what makes "again" free.
 *
 * The username is validated here for shape only. Whether it is *available* is
 * a database question, and one that cannot be answered honestly ahead of the
 * write — see updateAccount.
 */
export const accountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Your diary needs a name on it.")
    .max(NAME_MAX, `Names are at most ${NAME_MAX} characters.`),

  username: z
    .string()
    .trim()
    .max(USERNAME_MAX + 1, `Usernames are at most ${USERNAME_MAX} characters.`)
    // usernameError already says why in words a person can act on, so the
    // rules live in one place rather than being restated as Zod refinements.
    .refine((value) => usernameError(value) === null, {
      error: (issue) => usernameError(String(issue.input)) ?? "That username will not work.",
    }),

  /**
   * Empty and absent are the same thing: a reader who clears their bio has
   * removed it, not written an empty one. Normalized to null before it is
   * stored so `bio` has one representation of "nothing".
   */
  bio: z
    .string()
    .trim()
    .max(BIO_MAX, `Bios are at most ${BIO_MAX} characters.`)
    .transform((value) => (value.length === 0 ? null : value)),
});

export type AccountInput = z.infer<typeof accountSchema>;

/**
 * Erase a reader and everything they wrote.
 *
 * One DELETE is enough because the schema does the rest: `session`, `account`
 * and `log` all cascade from `user.id`, and invite codes this reader *used*
 * have their `used_by` set to null rather than being deleted, so a spent code
 * stays spent. Codes they *created* cascade away with them, which is correct —
 * an issuer who no longer exists should not leave live doors behind.
 *
 * There is no soft delete and no grace period. For a closed diary of a dozen
 * people, a delete that does not actually delete is the dishonest option.
 */
export async function deleteAccount(userId: string): Promise<void> {
  await getDb().delete(schema.user).where(eq(schema.user.id, userId));
}

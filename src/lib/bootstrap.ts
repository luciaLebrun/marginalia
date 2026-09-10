import { isOwner } from "./owner";

/**
 * Whether this signup is the one that cannot be invited: the first one.
 *
 * Pure, and separated from the query that feeds it, because this is the policy
 * — the part worth reading, arguing with, and testing exhaustively without a
 * database in the way.
 *
 * The gate and the schema deadlock each other otherwise. No account can be
 * created without a code, and no code can be created without an account:
 * `invite_code.created_by` is NOT NULL and references `user.id`. Shipped as it
 * stood, this app could not be entered by anybody, including its author,
 * without editing the database by hand.
 *
 * So exactly one door is left open, and only while the building is empty: the
 * address in `MARGINALIA_OWNER_EMAIL` may create an account when no accounts
 * exist. The moment one does, this returns false forever after.
 *
 * Narrow on every axis that matters:
 *
 *   - Not "the first person to arrive", which would hand the app to whoever
 *     found it first. The email must match the configured owner, and by the
 *     time this runs Google has already proved the visitor owns that address.
 *   - Not "no owner configured means anyone". `isOwner()` fails closed on a
 *     missing variable, so an unconfigured deployment stays shut.
 *   - Not a way to skip the gate later. One existing account closes it, and
 *     the owner then needs a code like everybody else.
 *
 * Two owners racing an empty table both pass this, and the unique index on
 * `user.email` refuses the second — one row is created either way.
 */
export function bootstrapAllowed(
  email: string | null | undefined,
  anyUserExists: boolean,
): boolean {
  if (anyUserExists) return false;
  return isOwner(email);
}

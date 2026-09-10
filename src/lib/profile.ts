import { and, eq, isNull } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { normalizeUsername } from "./username";

export type ClaimResult =
  | { ok: true; username: string }
  | { ok: false; reason: "invalid" | "taken" | "already-claimed" };

/** Postgres unique_violation. */
const UNIQUE_VIOLATION = "23505";

/**
 * Claim a username, once and permanently.
 *
 * Two races have to be lost safely, and both are handled by the database
 * rather than by checking first and writing after:
 *
 *   - two people claiming the same name — the unique index on `username`
 *     rejects the second, surfacing as 23505
 *   - one person claiming twice from two tabs — `WHERE username IS NULL`
 *     means the second UPDATE matches no row
 *
 * A read-then-write would let both slip through the gap between the two.
 */
export async function claimUsername(
  userId: string,
  input: string,
): Promise<ClaimResult> {
  const username = normalizeUsername(input);
  if (!username) return { ok: false, reason: "invalid" };

  try {
    const claimed = await getDb()
      .update(schema.user)
      .set({ username, updatedAt: new Date() })
      .where(and(eq(schema.user.id, userId), isNull(schema.user.username)))
      .returning({ username: schema.user.username });

    if (claimed.length === 0) return { ok: false, reason: "already-claimed" };
    return { ok: true, username };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, reason: "taken" };
    throw error;
  }
}

/**
 * Walk the cause chain looking for 23505.
 *
 * Drizzle wraps the driver error, so the SQLSTATE sits on `.cause`, not on the
 * error it throws — checking one level finds nothing and the violation escapes
 * as a 500 instead of becoming "that name is taken". Verified against
 * neon-http: `cause.code === "23505"`, `cause.constraint_name` is
 * `user_username_idx`. Walking the chain rather than reaching for `.cause`
 * once keeps this working if another layer wraps it later.
 */
function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;

  for (let depth = 0; current && depth < 5; depth++) {
    if (typeof current !== "object") return false;
    if ((current as { code?: unknown }).code === UNIQUE_VIOLATION) return true;
    current = (current as { cause?: unknown }).cause;
  }

  return false;
}

/** Is this name still free? Advisory only — the claim is what decides. */
export async function isUsernameAvailable(input: string): Promise<boolean> {
  const username = normalizeUsername(input);
  if (!username) return false;

  const rows = await getDb()
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.username, username))
    .limit(1);

  return rows.length === 0;
}

export interface PublicProfile {
  id: string;
  name: string;
  username: string;
  bio: string | null;
}

/** Look up a reader by their claimed username. */
export async function findByUsername(
  input: string,
): Promise<PublicProfile | null> {
  const username = normalizeUsername(input);
  if (!username) return null;

  const [row] = await getDb()
    .select({
      id: schema.user.id,
      name: schema.user.name,
      username: schema.user.username,
      bio: schema.user.bio,
    })
    .from(schema.user)
    .where(eq(schema.user.username, username))
    .limit(1);

  if (!row?.username) return null;
  return { id: row.id, name: row.name, username: row.username, bio: row.bio };
}

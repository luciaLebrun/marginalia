import { and, eq, gt, isNull, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";

import {
  type InviteRow,
  generateInviteCode,
  inviteState,
  normalizeInviteCode,
} from "./invite-code";

export * from "./invite-code";

/** Read-only check, for giving feedback before sending someone to Google. */
export async function isInviteCodeUsable(code: string): Promise<boolean> {
  const normalized = normalizeInviteCode(code);
  if (!normalized) return false;

  const rows = await getDb()
    .select({ code: schema.inviteCode.code })
    .from(schema.inviteCode)
    .where(
      and(
        eq(schema.inviteCode.code, normalized),
        isNull(schema.inviteCode.usedBy),
        isNull(schema.inviteCode.usedAt),
        gt(schema.inviteCode.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return rows.length === 1;
}

/**
 * Atomically claim a code, so two people racing the same invite cannot both
 * get in. The UPDATE ... WHERE used_at IS NULL is the lock: exactly one
 * statement can flip it, and RETURNING tells us whether we were the one.
 *
 * This deliberately does not run inside a transaction with the user insert —
 * the neon-http driver does not support them. The consequence is that a code
 * is burned if user creation then fails. For a closed POC that is the safer
 * direction to fail in: a wasted code is an annoyance, a double-used one is a
 * hole in the gate.
 */
export async function claimInviteCode(code: string): Promise<boolean> {
  const normalized = normalizeInviteCode(code);
  if (!normalized) return false;

  const claimed = await getDb()
    .update(schema.inviteCode)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(schema.inviteCode.code, normalized),
        isNull(schema.inviteCode.usedAt),
        gt(schema.inviteCode.expiresAt, new Date()),
      ),
    )
    .returning({ code: schema.inviteCode.code });

  return claimed.length === 1;
}

/** Record who ended up using a claimed code, once the user row exists. */
export async function attributeInviteCode(
  code: string,
  userId: string,
): Promise<void> {
  const normalized = normalizeInviteCode(code);
  if (!normalized) return;

  await getDb()
    .update(schema.inviteCode)
    .set({ usedBy: userId })
    .where(
      and(eq(schema.inviteCode.code, normalized), isNull(schema.inviteCode.usedBy)),
    );
}

/**
 * The signup gate itself, extracted from the Better Auth hook so it can be
 * tested without a Google round-trip. Throws to abort account creation.
 *
 * This is the only thing between a stranger with a Google account and an
 * account here, so it fails closed: no code, unknown code, expired code and
 * already-used code all reject.
 */
export async function enforceInvite(code: string | undefined): Promise<void> {
  if (!code) {
    throw new Error("An invite code is required to create an account.");
  }
  if (!(await claimInviteCode(code))) {
    throw new Error("That invite code is not valid or has already been used.");
  }
}

/** Hand a code back if the signup it was claimed for did not complete. */
export async function releaseInviteCode(code: string): Promise<void> {
  const normalized = normalizeInviteCode(code);
  if (!normalized) return;

  await getDb()
    .update(schema.inviteCode)
    .set({ usedAt: null })
    .where(
      and(eq(schema.inviteCode.code, normalized), isNull(schema.inviteCode.usedBy)),
    );
}

/** Issue a batch of codes. Retries on the astronomically unlikely collision. */
export async function createInviteCodes(
  createdBy: string,
  count = 1,
  ttlDays = 30,
): Promise<string[]> {
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateInviteCode();
      const inserted = await getDb()
        .insert(schema.inviteCode)
        .values({ code, createdBy, expiresAt })
        .onConflictDoNothing({ target: schema.inviteCode.code })
        .returning({ code: schema.inviteCode.code });

      if (inserted.length === 1) {
        codes.push(code);
        break;
      }
    }
  }

  return codes;
}


/**
 * The invite run for one issuer, newest first, each row carrying its state and
 * the name of whoever walked through it.
 *
 * A left join, not an inner one: `used_by` is set to null when that reader
 * deletes their account, and the code must still appear as spent rather than
 * silently dropping out of the run.
 */
export async function listInvitesWithState(
  createdBy: string,
  now: Date = new Date(),
): Promise<InviteRow[]> {
  const rows = await getDb()
    .select({
      code: schema.inviteCode.code,
      usedAt: schema.inviteCode.usedAt,
      expiresAt: schema.inviteCode.expiresAt,
      createdAt: schema.inviteCode.createdAt,
      usedByName: schema.user.name,
    })
    .from(schema.inviteCode)
    .leftJoin(schema.user, eq(schema.inviteCode.usedBy, schema.user.id))
    .where(eq(schema.inviteCode.createdBy, createdBy))
    .orderBy(sql`${schema.inviteCode.createdAt} desc`);

  return rows.map((row) => ({
    code: row.code,
    state: inviteState(row, now),
    usedByName: row.usedByName,
    usedAt: row.usedAt,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  }));
}

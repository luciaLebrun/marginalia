import { and, eq, gt, isNull, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";

/**
 * The cookie that carries a validated invite code across the Google OAuth
 * round-trip. Google gives us no way to attach a form field to the callback,
 * so the code is validated and stashed before the redirect, then claimed in
 * Better Auth's user-create hook when we come back.
 */
export const INVITE_COOKIE = "marginalia.invite";

/** Ten minutes is plenty to complete an OAuth round-trip and not much else. */
export const INVITE_COOKIE_MAX_AGE = 60 * 10;

/**
 * Excludes characters that are easy to confuse when a code is read aloud or
 * copied by hand: O/0, I/1/L, U/V. Invite codes get sent over chat apps and
 * typed by people, so this matters more than alphabet size.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTWXYZ23456789";
const GROUP = 4;
const GROUPS = 2;

/**
 * A uniform integer in [0, max) from the platform CSPRNG.
 *
 * Invite codes are the only thing gating access to this app, so `Math.random()`
 * is not acceptable here: V8 implements it with xorshift128+, whose internal
 * state can be recovered from a handful of observed outputs. Someone who was
 * legitimately sent two or three codes could then predict the next ones.
 *
 * Uses rejection sampling rather than `% max`. The alphabet has 29 characters
 * and 256 is not a multiple of 29, so plain modulo would make the first few
 * letters measurably likelier and shrink the real keyspace.
 */
export function secureRandomInt(max: number): number {
  if (!Number.isInteger(max) || max < 1 || max > 256) {
    throw new RangeError(`secureRandomInt supports 1..256, got ${max}`);
  }

  // Largest multiple of `max` that fits in a byte; anything above is rejected.
  const limit = Math.floor(256 / max) * max;
  const buf = new Uint8Array(1);

  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
}

/**
 * Codes look like "K7QM-3XPT". Case-insensitive, dashes optional on input.
 *
 * `randomInt` is injectable so tests can be deterministic. Production must use
 * the default — see secureRandomInt.
 */
export function generateInviteCode(
  randomInt: (max: number) => number = secureRandomInt,
): string {
  const groups: string[] = [];
  for (let g = 0; g < GROUPS; g++) {
    let out = "";
    for (let i = 0; i < GROUP; i++) out += ALPHABET[randomInt(ALPHABET.length)];
    groups.push(out);
  }
  return groups.join("-");
}

/**
 * Accept what a human is likely to type: lowercase, spaces, missing or extra
 * dashes. Returns null when the result cannot be a code, so callers never
 * query with junk.
 */
export function normalizeInviteCode(input: string): string | null {
  const stripped = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (stripped.length !== GROUP * GROUPS) return null;
  if ([...stripped].some((c) => !ALPHABET.includes(c))) return null;
  return `${stripped.slice(0, GROUP)}-${stripped.slice(GROUP)}`;
}

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

/** Codes this user issued, newest first, with their current state. */
export async function listInviteCodes(createdBy: string) {
  return getDb()
    .select({
      code: schema.inviteCode.code,
      usedBy: schema.inviteCode.usedBy,
      usedAt: schema.inviteCode.usedAt,
      expiresAt: schema.inviteCode.expiresAt,
      createdAt: schema.inviteCode.createdAt,
    })
    .from(schema.inviteCode)
    .where(eq(schema.inviteCode.createdBy, createdBy))
    .orderBy(sql`${schema.inviteCode.createdAt} desc`);
}

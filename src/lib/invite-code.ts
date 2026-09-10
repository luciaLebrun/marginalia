/**
 * Invite codes: the alphabet, the generator, and the shape rules. Pure — no
 * I/O, no database.
 *
 * Split out from invite.ts so that anything needing only the code itself — the
 * door's cell mask in the browser, the development seed running under bare
 * node — can have it without dragging a database driver along.
 */

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
export const ALPHABET = "ABCDEFGHJKMNPQRSTWXYZ23456789";
export const GROUP = 4;
const GROUPS = 2;

/** Characters in a code, ignoring the dash — the number of cells to draw. */
export const CODE_LENGTH = GROUP * GROUPS;

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


/**
 * What a code is, right now. Three states, and every one of them is said in a
 * word on the surface rather than only drawn as a tone — colour is never the
 * sole signal for a state a reader has to act on.
 */
export type InviteState = "live" | "spent" | "expired";

export interface InviteRow {
  code: string;
  state: InviteState;
  /** The reader who used it, when we still have them. Null once they delete their account. */
  usedByName: string | null;
  usedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Pure so it can be tested without a database, and so the UI and the tests
 * agree on the boundary cases by construction.
 *
 * Spent beats expired: a code that was used and has since passed its expiry is
 * still a code somebody walked through, and saying "expired" would misdescribe
 * what happened to it.
 */
export function inviteState(
  row: { usedAt: Date | null; expiresAt: Date },
  now: Date = new Date(),
): InviteState {
  if (row.usedAt) return "spent";
  return row.expiresAt.getTime() <= now.getTime() ? "expired" : "live";
}

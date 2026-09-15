/**
 * Username rules and handle parsing. Pure — no I/O.
 *
 * A username becomes a public URL, so the rules are deliberately strict: a
 * handle someone has to spell aloud, or that could be mistaken for one of our
 * own routes, is worse than a rejected one.
 *
 * It can be changed from the account sheet, and changing it frees the old one
 * immediately — there is no handle history, so a link to the old address 404s
 * and anybody may take the name. That is the trade this project chose over
 * carrying a redirect table forever.
 */

/** 3–20 characters, so it fits a masthead and is still typeable. */
export const MIN_LENGTH = 3;
export const MAX_LENGTH = 20;

/**
 * Names we will not hand out.
 *
 * `/@name` and `/name` share one dynamic segment, so a username matching a
 * real or likely route is a collision waiting to happen — and the generic
 * account words are the ones an impersonator reaches for first.
 */
export const RESERVED = new Set([
  "about",
  "account",
  "admin",
  "api",
  "app",
  "auth",
  "book",
  "books",
  "claim",
  "dev",
  "help",
  "home",
  "log",
  "login",
  "logout",
  "marginalia",
  "me",
  "new",
  "null",
  "privacy",
  "profile",
  "public",
  "root",
  "search",
  "settings",
  "signin",
  "signout",
  "signup",
  "static",
  "support",
  "system",
  "terms",
  "undefined",
  "user",
  "users",
  "you",
]);

const SHAPE = /^[a-z][a-z0-9_]*$/;

/**
 * Fold a typed username into its canonical form, or null if it cannot be one.
 *
 * Case and surrounding space are forgiven because people type handles from
 * memory; everything else is not, so that one stored username has exactly one
 * spelling.
 */
export function normalizeUsername(input: string): string | null {
  const candidate = input.trim().replace(/^@/, "").toLowerCase();

  if (candidate.length < MIN_LENGTH || candidate.length > MAX_LENGTH) return null;
  if (!SHAPE.test(candidate)) return null;
  // Doubled and trailing underscores make a handle hard to read back.
  if (candidate.includes("__") || candidate.endsWith("_")) return null;
  if (RESERVED.has(candidate)) return null;

  return candidate;
}

/** What the claim form shows when a name gives nothing usable. */
export const FALLBACK_SUGGESTION = "your_name";

/**
 * A username built from the reader's own name, for the claim form's
 * placeholder — "Hélène Martin" becomes "helene_martin".
 *
 * Only a hint, never a claim: the reader still types their own. Accents are
 * folded away rather than dropped, anything else becomes one underscore, and
 * the result is cut to the limit and held to the same rules as a real claim.
 * A name that cannot make a valid handle (all digits, too short, reserved)
 * falls back to a neutral example.
 */
export function suggestUsername(name: string | null | undefined): string {
  const slug = (name ?? "")
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "_")
    .replace(/^[^a-z]+/, "")
    .slice(0, MAX_LENGTH)
    .replace(/_+$/, "");

  return normalizeUsername(slug) ?? FALLBACK_SUGGESTION;
}

/**
 * Why this username was refused, in words a person can act on.
 *
 * Separate from normalizeUsername because the form needs a reason and every
 * other caller only needs a yes or no.
 */
export function usernameError(input: string): string | null {
  const candidate = input.trim().replace(/^@/, "").toLowerCase();

  if (candidate.length === 0) return "Pick a username.";
  if (candidate.length < MIN_LENGTH) {
    return `Usernames are at least ${MIN_LENGTH} characters.`;
  }
  if (candidate.length > MAX_LENGTH) {
    return `Usernames are at most ${MAX_LENGTH} characters.`;
  }
  if (/^[0-9_]/.test(candidate)) return "Start with a letter.";
  if (!/^[a-z0-9_]+$/.test(candidate)) {
    return "Letters, numbers and underscores only.";
  }
  if (candidate.includes("__")) return "One underscore at a time.";
  if (candidate.endsWith("_")) return "Cannot end with an underscore.";
  if (RESERVED.has(candidate)) return "That one is reserved.";

  return null;
}

/**
 * Read a username out of a `/@name` path segment.
 *
 * Next hands the segment over still percent-encoded, so `/@lucia` arrives as
 * `%40lucia` rather than `@lucia`. Decoding is therefore mandatory, not
 * defensive — and a malformed escape must not throw a route into a 500.
 *
 * Returns null for anything that is not an @-prefixed valid username, which
 * the route turns into a 404.
 */
export function parseHandle(segment: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    return null;
  }

  if (!decoded.startsWith("@")) return null;
  return normalizeUsername(decoded);
}

/** The canonical path for a username. */
export function handlePath(username: string): string {
  return `/@${username}`;
}

/**
 * Who may mint invite codes. Pure — no I/O.
 *
 * Invite codes are the only thing gating this app, so the power to create them
 * is deliberately not given to every member: a compromised or careless account
 * would otherwise be able to open the door indefinitely.
 *
 * The owner is named by environment variable rather than by a column, for two
 * reasons. It costs no migration and no free-tier storage, and — more usefully
 * — it cannot be escalated by anything that reaches the database. Someone with
 * write access to `user` still cannot make themselves the owner.
 *
 * `MARGINALIA_OWNER_EMAIL` holds one address or several, comma separated.
 * Unset means nobody can mint, which is the correct way for this to fail:
 * a misconfigured deployment closes the door rather than opening it.
 */

/** Emails are compared case-insensitively; the local part's case is not ours to judge. */
function parseOwners(raw: string | undefined): readonly string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

/**
 * Read at call time, never at module scope: `next build` runs without the real
 * environment, and a value captured at import would be baked into the bundle.
 */
export function isOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  return parseOwners(process.env.MARGINALIA_OWNER_EMAIL).includes(
    email.trim().toLowerCase(),
  );
}

/** True when no owner is configured at all, which is worth saying out loud in the UI. */
export function ownerIsConfigured(): boolean {
  return parseOwners(process.env.MARGINALIA_OWNER_EMAIL).length > 0;
}

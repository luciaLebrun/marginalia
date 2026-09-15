/**
 * Which origins Better Auth will forward an OAuth result to. Pure — no I/O.
 *
 * Google matches redirect URIs exactly and allows no wildcards, so a preview
 * deployment whose URL carries the branch name can never have its own callback
 * registered. The `oAuthProxy` plugin works around that: Google is sent to the
 * one registered origin, which forwards the result to whichever deployment
 * started the flow. That last hop is guarded by an origin check, so the preview
 * origin has to be trusted here or the sign-in dies on the doorstep.
 */

/**
 * Deployments of this project, under this account, over TLS. Nothing else.
 *
 * `https://*.vercel.app` would trust every deployment on Vercel belonging to
 * anyone, and hand a stranger a session-forwarding target. This is anchored at
 * both ends: Better Auth compiles the pattern to `^…$` and matches it against
 * the *origin* alone, so neither a path nor a longer suffix can be smuggled
 * past it, and `*` cannot cross a `/`. What remains inside the wildcard is the
 * branch or deployment id, which only Vercel can issue for this account.
 */
export const PREVIEW_ORIGIN_PATTERN =
  "https://marginalia-*-lucialebruns-projects.vercel.app";

/**
 * Production trusts nothing extra.
 *
 * The proxy is already inert there — the plugin skips when the request arrives
 * at the production URL — but a production session must not be forwardable to a
 * preview origin under any circumstances, so the trust is withdrawn as well as
 * unused. `VERCEL_ENV` is set by Vercel itself and is `production`, `preview`
 * or `development`; anything else, including undefined, is local development.
 */
export function trustedOrigins(): string[] {
  return process.env.VERCEL_ENV === "production" ? [] : [PREVIEW_ORIGIN_PATTERN];
}

/**
 * Which origin the OAuth proxy treats as "the deployment that started this".
 *
 * Sign-in starts in a server action, where the plugin has no request to read
 * a host from, so by default it falls back to `VERCEL_URL` — the per-deployment
 * hash URL, which nobody browses. The result was forwarded there, the account
 * created there, and the invite cookie the door set on the real host never
 * arrived: every invited sign-up failed with "An invite code is required".
 *
 * - Production: `BETTER_AUTH_URL` itself. Equal to the proxy's production URL,
 *   so the plugin skips entirely, as it was always meant to.
 * - Preview: the branch URL (`VERCEL_BRANCH_URL`) — the host a branch preview
 *   is actually opened on, and so the host holding the cookie.
 * - Local: undefined, the plugin's own default.
 */
export function proxyCurrentURL(): string | undefined {
  if (process.env.VERCEL_ENV === "production") return process.env.BETTER_AUTH_URL;
  const branch = process.env.VERCEL_BRANCH_URL;
  return branch ? `https://${branch}` : undefined;
}

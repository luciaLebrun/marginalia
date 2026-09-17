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
 * The origin the reader is actually on, taken from the request.
 *
 * Sign-in starts in a server action, where Better Auth is handed no request and
 * the OAuth proxy has no host to read. Left to guess, it names a host from the
 * environment — `VERCEL_URL`, or `BETTER_AUTH_URL` — and a Vercel deployment
 * answers to several: the branch alias, and a per-deployment one. Pick the
 * wrong one and the flow ends on a host the reader never opened, where the
 * state cookie, the invite cookie and the session all fail to meet.
 *
 * So it comes from the request or not at all: `undefined` leaves the plugin its
 * own default, which is what a call with no forwarding headers deserves.
 */
export function requestOrigin(headers: Headers): string | undefined {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const protocol = headers.get("x-forwarded-proto");
  return host && protocol ? `${protocol}://${host}` : undefined;
}

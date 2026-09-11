/**
 * The link at the right edge of the masthead's record band.
 *
 * On a reader's own diary it is the way into their account. On a profile it
 * depends on who is looking, because the page is the same for everyone but the
 * next step is not:
 *
 *   - the owner, looking at their own `/@handle`, keeps their account
 *   - a signed-in friend is offered the way back to their own diary
 *   - a signed-out visitor is offered nothing — the app is invite-only, and a
 *     link into an account they cannot have is not a next step
 *
 * Pure, so the choice is testable without a session or a browser.
 */
export interface MastheadLink {
  href: string;
  label: string;
}

export const ACCOUNT_LINK: MastheadLink = { href: "/settings", label: "Your account" };
export const DIARY_LINK: MastheadLink = { href: "/", label: "Your diary" };

export function profileMastheadLink(
  viewerId: string | null,
  profileId: string,
): MastheadLink | null {
  if (viewerId === null) return null;
  return viewerId === profileId ? ACCOUNT_LINK : DIARY_LINK;
}

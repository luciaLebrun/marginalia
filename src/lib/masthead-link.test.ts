import { describe, expect, it } from "vitest";

import { ACCOUNT_LINK, DIARY_LINK, profileMastheadLink } from "./masthead-link";

describe("profileMastheadLink", () => {
  it("keeps the account link for the owner looking at their own profile", () => {
    expect(profileMastheadLink("reader-1", "reader-1")).toEqual({
      href: "/settings",
      label: "Your account",
    });
  });

  it("sends a signed-in friend back to their own diary", () => {
    expect(profileMastheadLink("friend-2", "reader-1")).toEqual({
      href: "/",
      label: "Your diary",
    });
  });

  /*
   * The app is invite-only: a link into an account a visitor cannot have is
   * not a next step, so the band carries the tally alone.
   */
  it("offers a signed-out visitor nothing", () => {
    expect(profileMastheadLink(null, "reader-1")).toBeNull();
  });

  it("never mistakes an empty id for the owner", () => {
    expect(profileMastheadLink("", "reader-1")).toBe(DIARY_LINK);
    expect(profileMastheadLink("reader-1", "reader-1")).toBe(ACCOUNT_LINK);
  });
});

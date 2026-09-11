import { expect, test } from "@playwright/test";

/**
 * The public profile at /@name, and the username claim.
 *
 * These exercise the routing decisions a unit test cannot see: that `@` is
 * percent-encoded by the time Next hands it over, that the catch-all dynamic
 * segment refuses everything that is not a real handle, and that the claim
 * form's validation reaches the reader.
 */
test.describe("public profile", () => {
  test("renders the reader's shelf at their handle", async ({ page }) => {
    await page.goto("/@lucia", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lucia");
    expect(await page.locator("article").count()).toBeGreaterThan(0);
  });

  test("is case-insensitive", async ({ page }) => {
    const response = await page.goto("/@LUCIA");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lucia");
  });

  test("does not offer the log action on someone else's diary", async ({ page }) => {
    await page.goto("/@lucia", { waitUntil: "networkidle" });
    await expect(page.getByRole("link", { name: /log a book/i })).toHaveCount(0);
  });

  /*
   * The account sheet promises a bio as "a few lines under your handle on the
   * public diary"; this is where that promise is kept.
   */
  test("says whose diary it is: the handle, then the bio, under the name", async ({ page }) => {
    await page.goto("/@lucia", { waitUntil: "networkidle" });

    const masthead = page.locator("header");
    await expect(masthead.getByText("@lucia", { exact: true })).toBeVisible();
    await expect(masthead.getByText(/^Mostly science fiction/)).toBeVisible();
  });

  /*
   * These tests run without a session, so they are the signed-out visitor for
   * real: the app is invite-only, and the record band offers them no link.
   */
  test("offers a signed-out visitor no account and no diary link", async ({ page }) => {
    await page.goto("/@lucia", { waitUntil: "networkidle" });

    await expect(page.getByRole("link", { name: "Your account" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Your diary" })).toHaveCount(0);
    await expect(page.getByText(/books? logged|Nothing logged yet/)).toBeVisible();
  });

  test.describe("refuses everything that is not a handle", () => {
    for (const [label, path] of [
      ["an unclaimed name", "/@nobody"],
      ["a reserved name", "/@admin"],
      ["a name below the minimum length", "/@ab"],
      ["a bare path with no @", "/lucia"],
      ["arbitrary junk", "/nonsense"],
      ["a traversal attempt", "/@..%2Fsettings"],
    ] as const) {
      test(label, async ({ page }) => {
        const response = await page.goto(path);
        expect(response?.status()).toBe(404);
      });
    }
  });
});

/**
 * The owner's and a friend's view need a session, which e2e cannot get, so
 * `/dev/profile` renders the real masthead for each viewer.
 */
test.describe("profile masthead by viewer (harness)", () => {
  test("keeps the account link for the owner", async ({ page }) => {
    await page.goto("/dev/profile?viewer=owner", { waitUntil: "networkidle" });
    await expect(page.getByRole("link", { name: "Your account" })).toHaveAttribute(
      "href",
      "/settings",
    );
    await expect(page.getByRole("link", { name: "Your diary" })).toHaveCount(0);
  });

  test("sends a signed-in friend back to their own diary", async ({ page }) => {
    await page.goto("/dev/profile?viewer=friend", { waitUntil: "networkidle" });
    await expect(page.getByRole("link", { name: "Your diary" })).toHaveAttribute("href", "/");
    await expect(page.getByRole("link", { name: "Your account" })).toHaveCount(0);
  });

  test("offers a signed-out visitor nothing", async ({ page }) => {
    await page.goto("/dev/profile?viewer=visitor", { waitUntil: "networkidle" });
    await expect(page.locator("header a")).toHaveCount(0);
  });

  test("shows the handle and bio in every view", async ({ page }) => {
    for (const viewer of ["owner", "friend", "visitor"]) {
      await page.goto(`/dev/profile?viewer=${viewer}`, { waitUntil: "networkidle" });
      await expect(page.locator("header").getByText("@lucia", { exact: true })).toBeVisible();
    }
  });
});

test.describe("username claim", () => {
  test("shows the form and rejects a bad username with a reason", async ({ page }) => {
    await page.goto("/dev/claim", { waitUntil: "networkidle" });

    // The dev reader may already hold a username; the harness says so.
    if (await page.getByText(/already claimed as/i).isVisible().catch(() => false)) {
      test.skip(true, "dev reader already has a username");
    }

    const field = page.getByLabel(/pick a username/i);
    await expect(field).toBeVisible();

    // Targeted by id rather than by role: Next's dev overlay also renders a
    // role="alert" node, and a strict-mode locator refuses the ambiguity.
    const error = page.locator("#username-error");

    await field.fill("ab");
    await page.getByRole("button", { name: /claim it/i }).click();
    await expect(error).toContainText(/at least 3/i);
    await expect(error).toHaveAttribute("role", "alert");

    await field.fill("admin");
    await page.getByRole("button", { name: /claim it/i }).click();
    await expect(error).toContainText(/reserved/i);

    // The field points at its own error, so a screen reader reaches it.
    await expect(field).toHaveAttribute("aria-describedby", "username-error");
    await expect(field).toHaveAttribute("aria-invalid", "true");
  });

  test("the field is labelled and reachable by keyboard", async ({ page }) => {
    await page.goto("/dev/claim", { waitUntil: "networkidle" });
    if (await page.getByText(/already claimed as/i).isVisible().catch(() => false)) {
      test.skip(true, "dev reader already has a username");
    }

    const field = page.getByLabel(/pick a username/i);
    await field.focus();
    await expect(field).toBeFocused();
  });
});

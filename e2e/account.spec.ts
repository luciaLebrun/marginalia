import { expect, test } from "@playwright/test";

/**
 * The door and the account sheet, in a real browser at both device classes.
 *
 * These assert behaviour that only exists once the browser has built the DOM:
 * a mask made of one input and eight drawn cells, a commit band that counts
 * what is pending, and a destructive control that stays disarmed until it is
 * told to arm.
 */
test.describe("the door", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
  });

  test("says it is closed and offers the way in", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/reading diary/i);
    await expect(page.getByText(/invitation only/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /continue with google/i }),
    ).toBeVisible();
  });

  /*
   * The mask has to be one field. Eight inputs would pass a screenshot and
   * fail a paste, a password manager and every phone keyboard.
   */
  test("takes the whole code into a single field", async ({ page }) => {
    const field = page.getByLabel(/invite code/i);
    await expect(field).toHaveCount(1);

    await field.click();
    await page.keyboard.type("k7qm3xpt");
    await expect(field).toHaveValue("K7QM3XPT");
  });

  test("drops characters the alphabet does not contain", async ({ page }) => {
    const field = page.getByLabel(/invite code/i);
    await field.click();
    // O, I and U are excluded as confusable; the dash is drawn, never stored.
    await page.keyboard.type("k7-oi u9");
    await expect(field).toHaveValue("K79");
  });

  test("refuses a code that is not real, without leaving the page", async ({ page }) => {
    await page.getByLabel(/invite code/i).click();
    await page.keyboard.type("K7QM3XPT");
    await page.getByRole("button", { name: /continue with google/i }).click();

    // Scoped to the form's own error: Next's route announcer is also role=alert.
    await expect(page.locator("#code-error")).toContainText(/not valid|already used/i);
    await expect(page).toHaveURL(/localhost:3000\/$/);
  });
});

test.describe("the account sheet", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dev/settings", { waitUntil: "networkidle" });
  });

  test("shows no commit band while nothing is pending", async ({ page }) => {
    await expect(page.getByRole("button", { name: /^save/i })).toHaveCount(0);
  });

  /*
   * The count is the whole promise of this arrangement: the page never holds
   * unsaved work silently.
   */
  test("counts what is pending, and stops counting when it is put back", async ({
    page,
  }) => {
    await page.fill("#name", "Lucia Lebrun");
    await expect(page.getByText(/1 change pending/i)).toBeVisible();

    await page.fill("#username", "luciareads");
    await expect(page.getByText(/2 changes pending/i)).toBeVisible();

    await page.fill("#name", "Lucia");
    await expect(page.getByText(/1 change pending/i)).toBeVisible();

    await page.fill("#username", "lucia");
    await expect(page.getByRole("button", { name: /^save/i })).toHaveCount(0);
  });

  test("warns before a handle move that breaks the old address", async ({ page }) => {
    await page.fill("#username", "luciareads");
    await expect(page.getByText(/old address stops working/i)).toBeVisible();
  });

  test("shows every invitation with its state said in a word", async ({ page }) => {
    const invitations = page.getByRole("region", { name: /invitations/i });
    await expect(invitations.getByText("Unused", { exact: true })).toBeVisible();
    await expect(invitations.getByText(/^Used/)).toBeVisible();
    await expect(invitations.getByText("Expired", { exact: true })).toBeVisible();
  });

  /*
   * A code is drawn in eight cells but must be *read* as one string — the
   * cells are aria-hidden and an sr-only copy carries the value.
   */
  test("reads a code as one string rather than eight characters", async ({ page }) => {
    const invitations = page.getByRole("region", { name: /invitations/i });
    const first = invitations.locator("li").first();
    await expect(first).toContainText(/[A-Z0-9]{4}-[A-Z0-9]{4}/);
  });
});

test.describe("deleting an account", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dev/settings", { waitUntil: "networkidle" });
  });

  test("stays disarmed until the handle is typed back", async ({ page }) => {
    const button = page.getByRole("button", { name: /delete this account/i });
    await expect(button).toBeDisabled();

    await page.fill("#confirm", "luci");
    await expect(button).toBeDisabled();

    await page.fill("#confirm", "lucia");
    await expect(button).toBeEnabled();
  });

  test("disarms again when the confirmation stops matching", async ({ page }) => {
    const button = page.getByRole("button", { name: /delete this account/i });
    await page.fill("#confirm", "lucia");
    await expect(button).toBeEnabled();

    await page.fill("#confirm", "lucia2");
    await expect(button).toBeDisabled();
  });
});

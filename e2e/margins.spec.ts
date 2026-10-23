import { expect, test } from "@playwright/test";

/*
 * Margins (MRG-110) through its harness, which renders the real view for the
 * seeded dev reader (`pnpm seed:dev` keeps three passages, Dune's newest).
 */
test.describe("margins", () => {
  test("leads with the latest passage, words first, then where it came from", async ({ page }) => {
    await page.goto("/dev/margins");
    const latest = page.getByRole("region", { name: /The passage you kept last, from Dune/ });
    await expect(latest.locator("blockquote")).toContainText("Fear is the mind-killer.");
    // On a laptop the band and the jacket both open the book; on a phone the stamp does.
    for (const link of await latest.getByRole("link", { name: /Dune/ }).all()) {
      await expect(link).toHaveAttribute("href", /\/book\//);
    }
    await expect(latest).toContainText("p. 8");
  });

  test("follows with every earlier passage in one column, newest first", async ({ page }) => {
    await page.goto("/dev/margins");
    await expect(page.locator("main ol > li")).toHaveCount(2);
  });

  test("says where passages come from when nothing is kept, and invents none", async ({ page }) => {
    await page.goto("/dev/margins?state=empty");
    await expect(page.getByRole("heading", { level: 1, name: "Nothing kept yet" })).toBeVisible();
    await expect(page.locator("blockquote")).toHaveCount(0);
  });

  test("never scrolls sideways, whatever the reader pasted", async ({ page }) => {
    await page.goto("/dev/margins?state=long");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("is a place in the phone's bar, in the slot Search held", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "the bar is phone-only (MRG-108)");
    await page.goto("/dev/margins");
    const places = page.getByRole("navigation", { name: "Places" });
    await expect(places.getByRole("link")).toHaveText(["Diary", "Margins", "Log", "To read", "Account"]);
    await expect(places.getByRole("link", { name: "Margins" })).toHaveAttribute("aria-current", "page");
  });

  test("keeps a passage from the book page, in place", async ({ page }) => {
    await page.goto("/dev/book?state=shelf");
    await page.locator("summary", { hasText: "Keep a passage" }).click();
    await expect(page.getByLabel("The passage")).toBeVisible();
    await expect(page.getByLabel("Page")).toBeVisible();
    await expect(page.getByLabel("Your note")).toBeVisible();
    // Nothing to keep yet, so the commit is not offered.
    await expect(page.getByRole("button", { name: "Keep it" })).toBeDisabled();
  });
});

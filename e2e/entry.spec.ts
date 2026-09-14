import { expect, test } from "@playwright/test";

/**
 * A review's permalink, in a real browser at both device classes.
 *
 * The route is public, so the real page is exercised directly: `/dev/entry/latest`
 * hands over a seeded entry's real address. `/dev/entry` covers the states the
 * seed does not happen to hold.
 */
const PERMALINK = /\/@[a-z][a-z0-9_]*\/log\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

test.describe("review permalink", () => {
  test.describe("the card", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/dev/entry", { waitUntil: "networkidle" });
    });

    /*
     * The handle is set twice on purpose — signing the message and naming the
     * diary on the record band — so these are scoped rather than page-wide.
     */
    test("carries the book, the words and the signature", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1, name: "Dune" })).toBeVisible();
      await expect(page.getByText(/^Stranger the second time/)).toBeVisible();

      const signature = page.locator("article > div:nth-child(2) > div:nth-child(2)");
      await expect(signature.getByRole("link", { name: "Lucia" })).toHaveAttribute(
        "href",
        "/@lucia",
      );
      await expect(signature.getByText("@lucia", { exact: true })).toBeVisible();
    });

    /* The date is on the postmark and again under the signature. */
    test("postmarks the read with its date, rating and reread", async ({ page }) => {
      const postmark = page.locator("article .bg-ink").first();
      await expect(postmark.getByText("14 Aug 2026")).toBeVisible();
      await expect(postmark.getByRole("img", { name: "4.5 out of 5" })).toBeVisible();
      await expect(postmark.getByText("Reread", { exact: true })).toBeVisible();
    });

    test("wears the book's own colour on its first band", async ({ page }) => {
      const band = page.locator("article > div").first();
      // Dune's extracted jacket colour, the same the shelf shows.
      await expect(band).toHaveCSS("background-color", "rgb(112, 99, 31)");
      await expect(band).toContainText("Frank Herbert");
    });

    test("offers the way back to your own diary only when signed in", async ({ page }) => {
      const record = page.locator("article > div").last();
      await expect(record.getByRole("link", { name: "Your diary" })).toHaveCount(0);

      await page.goto("/dev/entry?signedin=1", { waitUntil: "networkidle" });
      await expect(record.getByRole("link", { name: "Your diary" })).toHaveAttribute("href", "/");
    });

    /*
     * The book page is signed-in only, so a visitor is not offered a door that
     * will not open.
     */
    test("links the title only for a signed-in reader", async ({ page }) => {
      await expect(page.getByRole("link", { name: "Dune" })).toHaveCount(0);

      await page.goto("/dev/entry?signedin=1", { waitUntil: "networkidle" });
      await expect(page.getByRole("link", { name: "Dune" })).toHaveAttribute(
        "href",
        "/book/OL893414W",
      );
    });

    test("says so when the read has no words", async ({ page }) => {
      await page.goto("/dev/entry?state=bare", { waitUntil: "networkidle" });

      await expect(page.getByText(/No review — Lucia logged this read/)).toBeVisible();
      await expect(page.getByText("Undated")).toBeVisible();
      await expect(page.getByText("Unrated")).toBeVisible();
      // The signature says it in words rather than printing "Undated" twice.
      await expect(page.getByText("Read at some point")).toBeVisible();
    });

    test("gives a coverless book the type-only jacket", async ({ page }) => {
      await page.goto("/dev/entry?state=nocover", { waitUntil: "networkidle" });

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("article img")).toHaveCount(0);
    });

    /*
     * The roll's stated risk for a postcard: a long review breaking the card.
     * The stamp block holds its size and the message column grows instead.
     */
    test("holds a review at the limit without scrolling sideways", async ({ page }) => {
      await page.goto("/dev/entry?state=long", { waitUntil: "networkidle" });

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      await expect(page.getByRole("heading", { level: 1, name: "Dune" })).toBeVisible();
    });
  });

  test.describe("the real route", () => {
    /*
     * Whose entry it is belongs to the seed, not to this test: a local database
     * also holds whatever its owner has logged. What must hold is that the
     * address, the book and the signature all agree.
     */
    test("opens a seeded entry at its reader's own address", async ({ page }) => {
      await page.goto("/dev/entry/latest", { waitUntil: "networkidle" });

      expect(page.url()).toMatch(PERMALINK);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      const handle = new URL(page.url()).pathname.split("/")[1];
      const signature = page.locator("article > div:nth-child(2) > div:nth-child(2)");
      await expect(signature.getByRole("link").first()).toHaveAttribute("href", `/${handle}`);
      await expect(
        signature.getByText(`@${handle.replace("@", "")}`, { exact: true }),
      ).toBeVisible();
    });

    test("is public: no session, no redirect to the door", async ({ page }) => {
      const response = await page.goto("/dev/entry/latest", { waitUntil: "networkidle" });
      expect(response?.status()).toBe(200);
      expect(page.url()).toMatch(PERMALINK);
    });

    test("refuses an id that is not one of ours, and one that does not exist", async ({ page }) => {
      const malformed = await page.goto("/@lucia/log/not-a-uuid");
      expect(malformed?.status()).toBe(404);

      const unknown = await page.goto("/@lucia/log/3f2c9a4e-8b1d-4c7e-9a2f-6d5e4b3a2c1d");
      expect(unknown?.status()).toBe(404);
    });
  });
});

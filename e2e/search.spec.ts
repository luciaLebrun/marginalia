import { expect, test } from "@playwright/test";

/**
 * The search surface, in a real browser at both device classes.
 *
 * Runs against `/dev/search`, which renders the real components with the
 * recorded Dune response — never live Open Library — so an upstream outage
 * cannot turn this suite red. `?source=` switches the harness into its other
 * states.
 */
const INK = "rgb(22, 19, 15)";

test.describe("search", () => {
  test("a blank search waits in the field", async ({ page }) => {
    await page.goto("/dev/search", { waitUntil: "networkidle" });

    await expect(page.getByRole("searchbox", { name: "Search" })).toBeFocused();
    await expect(page.getByText("A title, an author, or both")).toBeVisible();
    await expect(page.locator("ol.shelf-grid")).toHaveCount(0);
  });

  test("submitting puts the query in the address and keeps it in the field", async ({ page }) => {
    await page.goto("/dev/search", { waitUntil: "networkidle" });

    await page.getByRole("searchbox", { name: "Search" }).fill("dune");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/[?&]q=dune(&|$)/);
    // The harness's own parameter survives the submit.
    await expect(page).toHaveURL(/[?&]source=fixture(&|$)/);
    await expect(page.locator("ol.shelf-grid > li").first()).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Search" })).toHaveValue("dune");
  });

  test.describe("with results", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/dev/search?q=dune", { waitUntil: "networkidle" });
    });

    test("counts them in the record band", async ({ page }) => {
      await expect(page.getByRole("status")).toHaveText(/^\d+ books?$/i);
    });

    test("each result links to its book page by bare work key", async ({ page }) => {
      const hrefs = await page
        .locator("ol.shelf-grid > li > a")
        .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs) {
        expect(href).toMatch(/^\/book\/OL\d+W$/);
      }
    });

    /*
     * Colour on the shelf means "a book you read". A result has not earned it.
     */
    test("carries no colour: every result's band is ink", async ({ page }) => {
      const bands = await page
        .locator("ol.shelf-grid > li > a > div:first-child")
        .evaluateAll((nodes) => nodes.map((n) => getComputedStyle(n).backgroundColor));
      expect(bands.length).toBeGreaterThan(0);
      for (const bg of bands) {
        expect(bg).toBe(INK);
      }
    });

    test("a book without a cover gets a typographic jacket, not a broken image", async ({ page }) => {
      const results = await page.locator("ol.shelf-grid > li").count();
      const images = await page.locator("ol.shelf-grid img").count();
      // The Dune fixture holds books with and without a cover_i.
      expect(images).toBeGreaterThan(0);
      expect(images).toBeLessThan(results);
    });

    test("never addresses a cover by ISBN", async ({ page }) => {
      const sources = await page
        .locator("ol.shelf-grid img")
        .evaluateAll((imgs) => imgs.map((i) => i.getAttribute("src") ?? ""));
      for (const src of sources) {
        expect(src).toContain("/b/id/");
        expect(src).not.toContain("/b/isbn/");
      }
    });

    test("each result has one accessible sentence", async ({ page }) => {
      const first = page.locator("ol.shelf-grid > li > a").first();
      await expect(first).toHaveAccessibleName(/.+, by .+/);
    });

    test("results are reachable and visibly focused by keyboard", async ({ page }) => {
      const first = page.locator("ol.shelf-grid > li > a").first();
      await first.focus();
      await expect(first).toBeFocused();
      const outline = await first.evaluate((el) => getComputedStyle(el).outlineStyle);
      expect(outline).not.toBe("none");
    });

    test("does not take focus, so a phone keyboard stays closed over results", async ({ page }) => {
      await expect(page.getByRole("searchbox", { name: "Search" })).not.toBeFocused();
    });

    test("the page does not scroll sideways", async ({ page }) => {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });

    test("offers the way back to the diary", async ({ page }) => {
      await expect(page.getByRole("link", { name: "Your diary" })).toBeVisible();
    });
  });

  test("no matches says so and says how to recover", async ({ page }) => {
    await page.goto("/dev/search?q=zzqx&source=empty", { waitUntil: "networkidle" });

    await expect(page.getByRole("status")).toHaveText("No matches");
    await expect(page.getByText(/nothing on open library matches “zzqx”/i)).toBeVisible();
  });

  /*
   * The distinction the surface exists to keep: an outage is not "no such
   * book", or a reader goes looking for a typo that is not there.
   */
  test("an outage reads as unavailable, never as no matches", async ({ page }) => {
    await page.goto("/dev/search?q=dune&source=down", { waitUntil: "networkidle" });

    await expect(page.getByRole("status")).toHaveText("Search unavailable");
    await expect(page.getByText(/open library isn’t answering/i)).toBeVisible();
    await expect(page.getByText("No matches")).toHaveCount(0);
    await expect(page.getByRole("searchbox", { name: "Search" })).toHaveValue("dune");
  });
});

test("the real route sends a signed-out visitor to the door", async ({ page }) => {
  await page.goto("/search?q=dune");
  await expect(page).toHaveURL(/localhost:3000\/$/);
});

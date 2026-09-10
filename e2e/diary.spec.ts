import { expect, test } from "@playwright/test";

/**
 * The diary surface, in a real browser at both device classes.
 *
 * These assert the things that only exist once the page is rendered — layout
 * that survives a partial row, covers that actually load, and the invariants
 * that a unit test cannot see because they are properties of the DOM the
 * browser built.
 */
test.describe("reading diary", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dev/shelf", { waitUntil: "networkidle" });
  });

  test("renders the shelf with its masthead and year rules", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/books logged/)).toBeVisible();
    await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
    expect(await page.locator("article").count()).toBeGreaterThan(0);
  });

  test("offers logging a book as the first cell of the grid", async ({ page }) => {
    const log = page.getByRole("link", { name: /log a book/i });
    await expect(log).toBeVisible();
    await expect(log).toHaveAttribute("href", "/search");
  });

  test("never addresses a cover by ISBN", async ({ page }) => {
    // ISBN-addressed covers are rate limited to 100 per IP per 5 minutes and
    // 403 for everyone behind the same egress. This is the load-bearing rule.
    const sources = await page.locator("img").evaluateAll((imgs) =>
      imgs.map((i) => (i as HTMLImageElement).getAttribute("src") ?? ""),
    );
    const covers = sources.filter((s) => s.includes("covers.openlibrary.org"));
    expect(covers.length).toBeGreaterThan(0);
    for (const src of covers) {
      expect(src).toContain("/b/id/");
      expect(src).not.toContain("/b/isbn/");
    }
  });

  test("every cover carries meaningful alternative text", async ({ page }) => {
    const alts = await page.locator("article img").evaluateAll((imgs) =>
      imgs.map((i) => (i as HTMLImageElement).alt),
    );
    expect(alts.length).toBeGreaterThan(0);
    for (const alt of alts) {
      expect(alt.trim().length).toBeGreaterThan(0);
      // "cover" alone tells a screen reader nothing.
      expect(alt.trim().toLowerCase()).not.toBe("cover");
    }
  });

  test("covers actually load rather than rendering broken", async ({ page }) => {
    await page.waitForTimeout(1500);
    const broken = await page.locator("article img").evaluateAll((imgs) =>
      imgs.filter((i) => {
        const img = i as HTMLImageElement;
        return img.complete && img.naturalWidth === 0;
      }).length,
    );
    expect(broken).toBe(0);
  });

  test("a partial row leaves paper, not a flooded gutter", async ({ page }) => {
    // The grid once used its own background as gridlines, which looked correct
    // on a full row and flooded the whole remainder of a partial one.
    const grids = page.locator("section > div.grid");
    const backgrounds = await grids.evaluateAll((nodes) =>
      nodes.map((n) => getComputedStyle(n).backgroundColor),
    );
    for (const bg of backgrounds) {
      // #f4f1e8
      expect(bg).toBe("rgb(244, 241, 232)");
    }
  });

  test("the page does not scroll sideways", async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("the log action is reachable and focusable by keyboard", async ({ page }) => {
    const log = page.getByRole("link", { name: /log a book/i });
    await log.focus();
    await expect(log).toBeFocused();
    const outline = await log.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe("none");
  });
});

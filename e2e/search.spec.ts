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

    await expect(page.getByRole("searchbox", { name: "Title" })).toHaveValue("");
    await expect(page.getByRole("searchbox", { name: "Author" })).toHaveValue("");
    // The rule governing both lines is on the form, above the submit — not in
    // the record band below it, where it arrived after the control it governs.
    await expect(page.getByText("A title, an author, or both.")).toBeVisible();
    await expect(page.getByRole("status")).toHaveText("No search yet");
    await expect(page.locator("ol.shelf-grid")).toHaveCount(0);
  });

  /* Both fields land in the address, so Back and a shared link both work. */
  test("submitting puts both fields in the address and keeps them filled", async ({ page }) => {
    await page.goto("/dev/search", { waitUntil: "networkidle" });

    await page.getByRole("searchbox", { name: "Title" }).fill("dune");
    await page.getByRole("searchbox", { name: "Author" }).fill("herbert");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/[?&]title=dune(&|$)/);
    await expect(page).toHaveURL(/[?&]author=herbert(&|$)/);
    // The harness's own parameter survives the submit.
    await expect(page).toHaveURL(/[?&]source=fixture(&|$)/);
    await expect(page.locator("ol.shelf-grid > li").first()).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Title" })).toHaveValue("dune");
    await expect(page.getByRole("searchbox", { name: "Author" })).toHaveValue("herbert");
  });

  /* Either line alone is a search: a reader who only knows the author still
     gets a shelf back. */
  test("an author alone is a search", async ({ page }) => {
    await page.goto("/dev/search", { waitUntil: "networkidle" });

    await page.getByRole("searchbox", { name: "Author" }).fill("herbert");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/[?&]author=herbert(&|$)/);
    await expect(page.locator("ol.shelf-grid > li").first()).toBeVisible();
  });

  test.describe("with results", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/dev/search?title=dune&author=herbert", { waitUntil: "networkidle" });
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

    test("the page does not scroll sideways", async ({ page }) => {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });

    test("offers the way back to the diary", async ({ page }) => {
      await expect(page.getByRole("link", { name: "Your diary" })).toBeVisible();
    });

    /* Guidance, not a caption: the reader has demonstrably followed it, and
       repeating it spends first-viewport height that results want. */
    test("drops the guidance once a line is filled", async ({ page }) => {
      await expect(page.getByText("A title, an author, or both.")).toHaveCount(0);
    });
  });

  test("no matches says so and says how to recover", async ({ page }) => {
    await page.goto("/dev/search?title=zzqx&author=nobody&source=empty", {
      waitUntil: "networkidle",
    });

    await expect(page.getByRole("status")).toHaveText("No matches");
    await expect(page.getByText(/nothing matches “zzqx” by “nobody”/i)).toBeVisible();

    /*
     * The one exit that can rescue a scoped miss is dropping the title, and it
     * is a control rather than an instruction — clearing a field by hand on a
     * phone is the most expensive thing to ask at the worst moment to ask it.
     * It keeps the harness's own source, so it lands somewhere real.
     */
    const widen = page.getByRole("link", { name: /search “nobody” alone/i });
    await expect(widen).toBeVisible();
    await widen.click();
    await expect(page).toHaveURL(/[?&]author=nobody(&|$)/);
    await expect(page).toHaveURL(/[?&]source=empty(&|$)/);
    await expect(page.getByRole("searchbox", { name: "Title" })).toHaveValue("");
  });

  /*
   * The distinction the surface exists to keep: an outage is not "no such
   * book", or a reader goes looking for a typo that is not there.
   */
  test("an outage reads as unavailable, never as no matches", async ({ page }) => {
    await page.goto("/dev/search?title=dune&source=down", { waitUntil: "networkidle" });

    await expect(page.getByRole("status")).toHaveText("Search unavailable");
    await expect(page.getByText(/neither source is answering/i)).toBeVisible();
    await expect(page.getByText("No matches")).toHaveCount(0);
    await expect(page.getByRole("searchbox", { name: "Title" })).toHaveValue("dune");
  });
});

test("the real route sends a signed-out visitor to the door", async ({ page }) => {
  await page.goto("/search?title=dune");
  await expect(page).toHaveURL(/localhost:3000\/$/);
});

/*
 * Both sources AND the title and the author together, so an exit that adds a
 * term to an already-empty search is no exit at all — it lands the reader back
 * on this same page.
 */
test("a one-line miss is never told to add the other line", async ({ page }) => {
  await page.goto("/dev/search?title=zzqx&source=empty", { waitUntil: "networkidle" });

  await expect(page.getByText(/nothing matches “zzqx”/i)).toBeVisible();
  await expect(page.getByText(/add the author/i)).toHaveCount(0);
  await expect(page.getByText(/try fewer words/i)).toBeVisible();
});

/*
 * MRG-073. `source=full` answers as many as asked for, from the recorded books
 * repeated under distinct keys, so there is always a next page to show.
 */
test.describe("show more", () => {
  const cells = (page: import("@playwright/test").Page) => page.locator("ol.shelf-grid > li");
  const more = (page: import("@playwright/test").Page) =>
    page.getByRole("link", { name: "Show 20 more" });

  test("adds twenty under the grid, up to sixty, without moving what was there", async ({
    page,
  }) => {
    await page.goto("/dev/search?title=dune&source=full", { waitUntil: "networkidle" });
    await expect(cells(page)).toHaveCount(20);
    const firstKey = await cells(page).first().locator("a").getAttribute("href");

    await more(page).scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => window.scrollY);
    await more(page).click();

    await expect(cells(page)).toHaveCount(40);
    await expect(page).toHaveURL(/[?&]shown=40(&|$)/);
    await expect(page).toHaveURL(/[?&]source=full(&|$)/);
    // The reader stays where they were; the new books are below them.
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
    expect(await cells(page).first().locator("a").getAttribute("href")).toBe(firstKey);
    await expect(page.getByRole("status")).toHaveText(/^First 40/);

    await more(page).click();
    await expect(cells(page)).toHaveCount(60);
    await expect(page.getByRole("status")).toHaveText(/^First 60/);
    // Ruled through and explained, never removed.
    await expect(more(page)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Show 20 more" })).toBeDisabled();
    await expect(page.getByText(/^Sixty is the most a search shows/)).toBeVisible();
  });

  /* A keyboard reader is taken to the first new book, not left behind it. */
  test("hands keyboard focus to the first new result", async ({ page }) => {
    await page.goto("/dev/search?title=dune&source=full", { waitUntil: "networkidle" });
    await more(page).focus();
    await page.keyboard.press("Enter");
    await expect(cells(page)).toHaveCount(40);
    await expect(cells(page).nth(20).locator("a")).toBeFocused();

    await more(page).focus();
    await page.keyboard.press("Enter");
    await expect(cells(page)).toHaveCount(60);
    await expect(cells(page).nth(40).locator("a")).toBeFocused();
  });

  /* After a step, a short page means the sources are spent. */
  test("says when the sources ran out", async ({ page }) => {
    await page.goto("/dev/search?title=dune&author=herbert&shown=40", {
      waitUntil: "networkidle",
    });
    await expect(page.getByRole("button", { name: "Show 20 more" })).toBeDisabled();
    await expect(page.getByText("That is every book the search found.")).toBeVisible();
  });

  /* A short page means the sources are spent: nothing to offer. */
  test("is not offered under a short page", async ({ page }) => {
    await page.goto("/dev/search?title=dune", { waitUntil: "networkidle" });
    await expect(cells(page).first()).toBeVisible();
    await expect(more(page)).toHaveCount(0);
  });

  test("ignores a hand-edited count it cannot honour", async ({ page }) => {
    await page.goto("/dev/search?title=dune&source=full&shown=abc", {
      waitUntil: "networkidle",
    });
    await expect(cells(page)).toHaveCount(20);
  });
});

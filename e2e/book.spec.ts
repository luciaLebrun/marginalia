import { expect, test, type Page } from "@playwright/test";

/**
 * The book page, in a real browser at both device classes.
 *
 * Runs against `/dev/book`, which renders the real components from the
 * recorded Dune fixtures — never live Open Library and never the database.
 * `?state=` switches the harness between the page's states.
 */
const INK = "rgb(22, 19, 15)";
const PAPER = "rgb(244, 241, 232)";

const slip = (page: Page) => page.getByRole("region", { name: "Your reads" });
const authorBand = (page: Page) => page.locator("article > div").first();

test.describe("book page", () => {
  test.describe("a book not on the shelf", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/dev/book", { waitUntil: "networkidle" });
    });

    test("opens on its title page: the title at display scale beside the jacket", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1, name: "Dune" })).toBeVisible();
      await expect(page.getByRole("img", { name: /^Dune by Frank Herbert$/ })).toBeVisible();
    });

    /*
     * Colour on the author band means "a book you read". It is withheld here,
     * exactly as it is on a search result.
     */
    test("wears ink, not colour, on the author band", async ({ page }) => {
      await expect(authorBand(page)).toHaveCSS("background-color", INK);
      await expect(authorBand(page)).toHaveCSS("color", PAPER);
      await expect(authorBand(page)).toContainText("Frank Herbert");
    });

    test("prints the imprint it knows and links to Open Library", async ({ page }) => {
      const imprint = page.locator("dl");
      await expect(imprint).toContainText("First published");
      await expect(imprint).toContainText("1965");
      // Named for a reader; the work key lives in the address, not the text.
      await expect(page.getByRole("link", { name: "Open Library" })).toHaveAttribute(
        "href",
        /^https:\/\/openlibrary\.org\/works\/OL\d+W$/,
      );
    });

    test("shows the description without Open Library's editorial furniture", async ({ page }) => {
      await expect(page.getByText(/^Set on the desert planet Arrakis/)).toBeVisible();
      await expect(page.getByText("Contains: Dune")).toHaveCount(0);
    });

    test("says it is not on the shelf, with an empty slip", async ({ page }) => {
      await expect(slip(page)).toContainText("Not on your shelf");
      await expect(slip(page).getByRole("listitem")).toHaveCount(0);
    });

    test("never scrolls sideways", async ({ page }) => {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });

  test.describe("a book on the shelf", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/dev/book?state=shelf", { waitUntil: "networkidle" });
    });

    test("wears a colour on the author band once it has been read", async ({ page }) => {
      const background = await authorBand(page).evaluate(
        (node) => getComputedStyle(node).backgroundColor,
      );
      expect(background).not.toBe(INK);
    });

    test("lists the reads newest first, with the reread marked", async ({ page }) => {
      await expect(slip(page)).toContainText("Read twice");

      const lines = slip(page).getByRole("listitem");
      await expect(lines).toHaveCount(2);
      await expect(lines.nth(0)).toContainText("14 Aug 2026");
      await expect(lines.nth(0)).toContainText("Reread");
      await expect(lines.nth(0).getByRole("img", { name: "4.5 out of 5" })).toBeVisible();
      await expect(lines.nth(1)).toContainText("2 May 2019");
    });

    test("wears the jacket colour extracted when it was logged", async ({ page }) => {
      await expect(authorBand(page)).toHaveCSS("background-color", "rgb(112, 99, 31)");
    });

    /*
     * A fallback band can be the wordmark's own orange. Over a hairline the two
     * read as one block, so a coloured author band sits under a 2px ink rule.
     */
    test("rules a coloured author band off from the wordmark band", async ({ page }) => {
      await page.goto("/dev/book?state=fallback", { waitUntil: "networkidle" });
      await expect(authorBand(page)).toHaveCSS("background-color", "rgb(232, 80, 27)");
      await expect(authorBand(page)).toHaveCSS("border-top-width", "2px");
      await expect(authorBand(page)).toHaveCSS("border-top-color", INK);
    });

    test("puts a machine-readable date on each dated read", async ({ page }) => {
      await expect(slip(page).locator("time").first()).toHaveAttribute("datetime", "2026-08-14");
    });
  });

  test("says Undated and Unrated rather than inventing either", async ({ page }) => {
    await page.goto("/dev/book?state=undated", { waitUntil: "networkidle" });

    const line = slip(page).getByRole("listitem");
    await expect(line).toContainText("Undated");
    await expect(line).toContainText("Unrated");
    await expect(line.locator("time")).toHaveCount(0);
  });

  test("gives a coverless book a type-only jacket, not a broken image", async ({ page }) => {
    await page.goto("/dev/book?state=nocover", { waitUntil: "networkidle" });

    const title = (await page.getByRole("heading", { level: 1 }).textContent()) ?? "";
    expect(title.length).toBeGreaterThan(0);
    await expect(page.locator("article img")).toHaveCount(0);

    // The jacket sets the title too, but hidden from assistive tech, so a
    // screen reader hears it once — from the heading.
    const jacket = page.locator('article [aria-hidden="true"]').first();
    await expect(jacket).toContainText(title);
  });

  test("sets a subtitle under the title, in the supporting voice", async ({ page }) => {
    await page.goto("/dev/book?state=subtitle", { waitUntil: "networkidle" });

    const subtitle = page.locator("h1 + p");
    await expect(subtitle).toBeVisible();
    await expect(subtitle).not.toBeEmpty();
  });

  test("names three authors in the band as one sentence, without overflow", async ({ page }) => {
    await page.goto("/dev/book?state=authors", { waitUntil: "networkidle" });

    await expect(authorBand(page).locator("p")).toHaveText(/^[^,]+, [^,]+ and [^,]+$/);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("while opening, says so over an empty ruled frame", async ({ page }) => {
    await page.goto("/dev/book?state=opening", { waitUntil: "networkidle" });

    await expect(page.getByRole("status")).toHaveText("Opening this book…");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
  });

  /*
   * "Unavailable" and "not found" are different answers, and each must never
   * be mistaken for the other.
   */
  test("when Open Library is down, says unavailable — never not found", async ({ page }) => {
    await page.goto("/dev/book?state=down", { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { level: 1, name: "Book unavailable" })).toBeVisible();
    await expect(page.getByText(/Open Library isn’t answering/)).toBeVisible();
    await expect(page.getByText(/not found/i)).toHaveCount(0);
  });

  test("when the book does not exist, says so and offers search", async ({ page }) => {
    await page.goto("/dev/book?state=missing", { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { level: 1, name: "Book not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Search for a book" })).toHaveAttribute(
      "href",
      "/search",
    );
    await expect(page.getByText(/isn’t answering/)).toHaveCount(0);
  });

  test("keeps the way back to the diary on every state", async ({ page }) => {
    for (const state of ["new", "shelf", "opening", "down", "missing"]) {
      await page.goto(`/dev/book?state=${state}`, { waitUntil: "networkidle" });
      await expect(page.getByRole("link", { name: "Your diary" })).toHaveAttribute(
        "href",
        "/dev/shelf",
      );
    }
  });
});

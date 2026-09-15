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

    /* Each line is the way to that read's own page. */
    test("links every read to its permalink", async ({ page }) => {
      const hrefs = await slip(page)
        .locator("li a")
        .evaluateAll((links) => links.map((a) => a.getAttribute("href")));

      expect(hrefs).toHaveLength(2);
      for (const href of hrefs) {
        expect(href).toMatch(
          /^\/@[a-z][a-z0-9_]*\/log\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        );
      }
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

  test.describe("the log sheet", () => {
    const openSheet = async (page: Page, state = "new") => {
      await page.goto(`/dev/book?state=${state}`, { waitUntil: "networkidle" });
      await page.locator("summary", { hasText: "Log a read" }).click();
    };

    test("opens in place from the slip's blank line, dated today", async ({ page }) => {
      await openSheet(page);

      const today = await page.evaluate(() => {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        return `${now.getFullYear()}-${month}-${day}`;
      });
      await expect(page.getByLabel("Finished")).toHaveValue(today);
      // In place: no navigation, no dialog.
      await expect(page).toHaveURL(/\/dev\/book\?state=new$/);
      await expect(page.getByRole("dialog")).toHaveCount(0);
    });

    /*
     * The native field prints in the browser's order (09/11 or 11/09), so the
     * sheet says in words what the slip will print.
     */
    test("says in the slip's own words which day it will log", async ({ page }) => {
      await openSheet(page);
      // Wait for the sheet to date itself, so this tests the wording rather
      // than racing the asynchronous toggle event.
      await expect(page.getByText(/^Logs as /)).toBeVisible();

      await page.getByLabel("Finished").fill("2026-08-14");
      await expect(page.getByText("Logs as 14 Aug 2026")).toBeVisible();
    });

    test("clears the date to Undated, and says so", async ({ page }) => {
      await openSheet(page);

      await page.getByRole("button", { name: "Undated" }).click();
      await expect(page.getByLabel("Finished")).toHaveValue("");
      await expect(page.getByText("Logs as Undated")).toBeVisible();
      // An empty field's "mm/dd/yyyy" is set in soft ink, so it never reads as
      // a date — the slip prints Undated the same way.
      await expect(page.getByLabel("Finished")).toHaveCSS("color", "rgb(93, 86, 76)");

      // Unavailable is ruled through, never only greyed.
      const undated = page.getByRole("button", { name: "Undated" });
      await expect(undated).toBeDisabled();
      await expect(undated).toHaveCSS("text-decoration-line", "line-through");
    });

    /*
     * One real range input under drawn marks, so the keyboard and a screen
     * reader get a rating control, not five decorative stars.
     */
    test("takes a half-step rating from the keyboard, and clears it", async ({ page }) => {
      await openSheet(page);

      const rating = page.getByLabel("Rating");
      await expect(rating).toHaveAttribute("aria-valuetext", "Unrated");

      await rating.focus();
      for (let step = 0; step < 9; step++) await page.keyboard.press("ArrowRight");
      await expect(rating).toHaveAttribute("aria-valuetext", "4.5 out of 5");
      await expect(rating).toHaveValue("4.5");

      await page.getByRole("button", { name: "Clear" }).click();
      await expect(rating).toHaveAttribute("aria-valuetext", "Unrated");
    });

    test("ticks Reread in advance only when the slip already has a read", async ({ page }) => {
      // Exact: a slip line's own label also ends in "reread". Scoped to the
      // log sheet: each line's closed edit sheet carries a Reread box too.
      const logSheet = page.locator("details", { has: page.locator("summary", { hasText: "Log a read" }) });
      await openSheet(page, "new");
      await expect(logSheet.getByLabel("Reread", { exact: true })).not.toBeChecked();

      await openSheet(page, "shelf");
      await expect(logSheet.getByLabel("Reread", { exact: true })).toBeChecked();
    });

    /*
     * The harness has no session, and the action must refuse without one —
     * whatever the form sends. The typing survives the refusal.
     */
    test("refuses to save without a signed-in reader, keeping what was typed", async ({ page }) => {
      await openSheet(page);
      await page.getByLabel("Review").fill("A first go.");

      await page.getByRole("button", { name: "Save this read" }).click();

      // Says nothing was saved, and offers the way back in.
      await expect(page.locator("form [role=alert]")).toContainText("Not saved");
      await expect(page.getByRole("link", { name: "Sign in again" })).toHaveAttribute("href", "/");
      await expect(page.getByLabel("Review")).toHaveValue("A first go.");
    });

    test("closes back to the blank line", async ({ page }) => {
      await openSheet(page);
      await expect(page.getByLabel("Finished")).toBeVisible();
      // Open, the disclosure keeps its name; only its drawn mark and visible
      // word change.
      await expect(page.locator("summary")).toHaveAccessibleName("Log a read");

      await page.locator("summary", { hasText: "Close" }).click();
      await expect(page.getByLabel("Finished")).toBeHidden();
      await expect(page.locator("summary", { hasText: "Log a read" })).toBeVisible();
    });

    test("never scrolls sideways with the sheet open", async ({ page }) => {
      await openSheet(page, "shelf");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });

  /*
   * MRG-054: correct or remove a read from its own line. The harness has no
   * session, so a commit is refused — which is itself the check that the
   * actions never trust the form.
   */
  test.describe("editing a read", () => {
    const line = (page: Page) => slip(page).locator("li").first();
    const openEdit = async (page: Page) => {
      await page.goto("/dev/book?state=shelf", { waitUntil: "networkidle" });
      await line(page).locator("summary", { hasText: "Edit" }).click();
    };

    test("opens under its line, holding the read as it stands", async ({ page }) => {
      await openEdit(page);
      const sheet = line(page);

      await expect(sheet.getByLabel("Finished")).toHaveValue("2026-08-14");
      await expect(sheet.getByLabel("Rating")).toHaveAttribute("aria-valuetext", "4.5 out of 5");
      await expect(sheet.getByLabel("Review")).toHaveValue("Better the second time.");
      await expect(sheet.getByLabel("Reread", { exact: true })).toBeChecked();
      await expect(sheet.getByRole("button", { name: "Save changes" })).toBeVisible();

      // In place, under the line it corrects, which stays in view above it.
      await expect(page).toHaveURL(/\/dev\/book\?state=shelf$/);
      await expect(sheet.locator("a").first()).toBeVisible();
    });

    test("keeps the line one link to its permalink, with Edit outside it", async ({ page }) => {
      await page.goto("/dev/book?state=shelf", { waitUntil: "networkidle" });
      await expect(line(page).locator("a summary")).toHaveCount(0);
      await expect(line(page).locator("summary")).toHaveAccessibleName("Edit");
      await expect(line(page).locator("a")).toHaveAttribute("href", /\/log\//);
    });

    test("an undated, unrated read opens as Undated and Unrated", async ({ page }) => {
      await page.goto("/dev/book?state=undated", { waitUntil: "networkidle" });
      await line(page).locator("summary", { hasText: "Edit" }).click();
      await expect(line(page).getByLabel("Finished")).toHaveValue("");
      await expect(line(page).getByLabel("Rating")).toHaveAttribute("aria-valuetext", "Unrated");
    });

    test("arms removal into a sentence in alarm, and Keep it stands it down", async ({ page }) => {
      await openEdit(page);
      const sheet = line(page);

      await sheet.getByRole("button", { name: "Remove this read" }).click();
      const warning = sheet.getByText("Remove this read for good? Its page goes too.");
      await expect(warning).toBeVisible();
      await expect(warning).toHaveCSS("color", "rgb(149, 29, 16)");
      // Focus lands on the way out, never on the irreversible control.
      await expect(sheet.getByRole("button", { name: "Keep it" })).toBeFocused();
      await expect(sheet.getByRole("button", { name: "Remove", exact: true })).toHaveCSS(
        "border-color",
        "rgb(149, 29, 16)",
      );

      await sheet.getByRole("button", { name: "Keep it" }).click();
      await expect(warning).toBeHidden();
      await expect(sheet.getByRole("button", { name: "Remove this read" })).toBeFocused();
    });

    test("refuses to save or remove without a signed-in reader", async ({ page }) => {
      await openEdit(page);
      const sheet = line(page);

      await sheet.getByLabel("Review").fill("Changed my mind.");
      await sheet.getByRole("button", { name: "Save changes" }).click();
      await expect(sheet.locator("form [role=alert]").first()).toContainText("Not saved");
      await expect(sheet.getByLabel("Review")).toHaveValue("Changed my mind.");

      await sheet.getByRole("button", { name: "Remove this read" }).click();
      await sheet.getByRole("button", { name: "Remove", exact: true }).click();
      await expect(sheet.getByText(/Not removed: you’re signed out/)).toBeVisible();
      // Refused, so the read is still on the slip.
      await expect(slip(page).locator("li")).toHaveCount(2);
    });

    test("draws the open line's rule in ink, as the log line does", async ({ page }) => {
      await page.goto("/dev/book?state=shelf", { waitUntil: "networkidle" });
      const link = line(page).locator("a");
      await expect(link).toHaveCSS("border-bottom-color", "rgba(0, 0, 0, 0)");
      await line(page).locator("summary", { hasText: "Edit" }).click();
      await expect(link).toHaveCSS("border-bottom-color", INK);
    });

    test("gives Edit a tap target the height of its line", async ({ page }) => {
      await page.goto("/dev/book?state=shelf", { waitUntil: "networkidle" });
      const box = await line(page).locator("summary").boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    });

    test("keeps a refused removal on its own read, until it is stood down", async ({ page }) => {
      await openEdit(page);
      const first = line(page);
      await first.getByRole("button", { name: "Remove this read" }).click();
      await first.getByRole("button", { name: "Remove", exact: true }).click();
      const refusal = first.getByText(/Not removed: you’re signed out/);
      await expect(refusal).toBeVisible();
      // It replaces the question rather than stacking under it.
      await expect(first.getByText("Remove this read for good?")).toHaveCount(0);

      const second = slip(page).locator("li").nth(1);
      await second.locator("summary", { hasText: "Edit" }).click();
      await second.getByRole("button", { name: "Remove this read" }).click();
      await expect(second.getByText("Remove this read for good? Its page goes too.")).toBeVisible();
      await expect(second.getByText(/Not removed/)).toHaveCount(0);

      await first.getByRole("button", { name: "Keep it" }).click();
      await first.getByRole("button", { name: "Remove this read" }).click();
      await expect(first.getByText("Remove this read for good? Its page goes too.")).toBeVisible();
      await expect(first.getByText(/Not removed/)).toHaveCount(0);
    });

    test("closes back to the line", async ({ page }) => {
      await openEdit(page);
      await line(page).locator("summary", { hasText: "Close" }).click();
      await expect(line(page).getByLabel("Finished")).toBeHidden();
    });

    test("never scrolls sideways with an edit open", async ({ page }) => {
      await openEdit(page);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
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

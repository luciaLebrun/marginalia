import { expect, test } from "@playwright/test";
import { must } from "../tests/must";

/**
 * The to-read list (MRG-059) in a real browser at both device classes.
 *
 * `/to-read` and the book page are signed-in only, so these run against their
 * harnesses, which render the real components from recorded fixtures with no
 * session — so every write is refused, which is itself the check that the
 * actions never trust the form.
 */
test.describe("the bedside stack", () => {
  // The spine's words are its link; its jacket is a second, hidden way there.
  const spines = (page: import("@playwright/test").Page) => page.locator("ol > li > div > a:not([aria-hidden])");

  test("lays each saved book as a spine that opens its book page, newest first", async ({ page }) => {
    await page.goto("/dev/to-read");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("To read");
    await expect(page.getByText("5 books")).toBeVisible();
    await expect(spines(page)).toHaveCount(5);
    await expect(spines(page).first()).toHaveAttribute("href", /^\/book\/OL\d+W$/);
    await expect(page.getByRole("list", { name: /newest saved first/ })).toBeVisible();
  });

  test("shows no filter on a short list", async ({ page }) => {
    await page.goto("/dev/to-read");
    await expect(page.getByRole("searchbox")).toHaveCount(0);
  });

  test("filters a long pile, folded, and clearing a no-match returns focus to the field", async ({ page }) => {
    await page.goto("/dev/to-read?state=long");
    const field = page.getByRole("searchbox", { name: "Find in your list" });
    await expect(spines(page)).toHaveCount(10);
    await field.fill("FREAKONOMICS");
    await expect(spines(page)).toHaveCount(2);
    await field.fill("zzzz");
    await expect(spines(page)).toHaveCount(0);
    await expect(page.getByText("Nothing on your list matches “zzzz”.").first()).toBeVisible();
    await page.getByRole("button", { name: "Clear the filter" }).click();
    await expect(field).toBeFocused();
    await expect(field).toHaveValue("");
    await expect(spines(page)).toHaveCount(10);
  });

  test("sets a thick book thicker in the pile than a thin one", async ({ page }) => {
    await page.goto("/dev/to-read");
    // 256 pages against 604. Matched on the whole title: "Dune" alone is in
    // three of these titles.
    const height = async (title: string) =>
      (await page.locator("ol > li > div").filter({ has: page.getByText(title, { exact: true }) }).boundingBox())
        ?.height ?? 0;
    expect(await height("Dune Messiah")).toBeLessThan(await height("Dune"));
  });

  test("never wears a jacket colour: a waiting book has not earned one", async ({ page }, testInfo) => {
    await page.goto("/dev/to-read");
    // MRG-108: on a phone ink chips become the raised night surface (#232327),
    // one neutral for every spine; still no jacket colour.
    const spine = testInfo.project.name === "mobile" ? "rgb(35, 35, 39)" : "rgb(22, 19, 15)";
    for (const li of await page.locator("ol > li > div").all()) {
      await expect(li).toHaveCSS("background-color", spine);
    }
  });

  test("keeps Take it off outside the spine's link, named for its book", async ({ page }) => {
    await page.goto("/dev/to-read");
    await expect(page.locator("ol > li a button")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Take it off, Dune", exact: true })).toBeVisible();
  });

  test("refuses to take a book off without a signed-in reader", async ({ page }) => {
    await page.goto("/dev/to-read");
    await page.getByRole("button", { name: "Take it off, Dune", exact: true }).click();
    // Under its own spine, in its own words. Filtered: Next's dev overlay
    // renders a role="alert" node of its own.
    const refusal = page.locator("ol > li", { hasText: /^Dune/ }).getByRole("alert");
    await expect(refusal).toContainText("Not taken off: you’re signed out.");
    await expect(page.getByRole("link", { name: "Sign in again" })).toHaveAttribute("href", "/");
    await expect(spines(page)).toHaveCount(5);
  });

  /* Pending, the button keeps focus; once the spine is gone focus goes to the
     next spine's control, the previous one's if it was last, else the heading
     (MRG-079). */
  test("keeps focus while taking a book off, then hands it to a neighbour or the heading", async ({ page }) => {
    await page.goto("/dev/to-read?stub=1");
    const buttons = page.locator("[data-take-off]");
    // evaluateAll's callback runs in the browser, where must() does not exist:
    // read the raw attributes there, narrow them here.
    const labels = async () =>
      (await buttons.evaluateAll((n) => n.map((b) => b.getAttribute("aria-label")))).map((label) =>
        must(label, "aria-label"),
      );
    const press = async (at: number) => {
      await buttons.nth(at).focus();
      await page.keyboard.press("Enter");
    };

    // A middle spine: the button keeps focus through the wait, then focus
    // goes to the spine that was below it.
    const before = await labels();
    await press(2);
    await expect(buttons.nth(2)).toHaveAttribute("aria-disabled", "true");
    await expect(buttons.nth(2)).toBeFocused();
    await expect(buttons).toHaveCount(4);
    await expect(page.getByRole("button", { name: before[3] })).toBeFocused();
    // The live region names the book, so the next take-off reads differently.
    const taken = must(before[2]).replace(/^Take it off, /, "");
    await expect(page.locator("output")).toHaveText(`${taken} taken off your to-read list.`);

    // The last spine: focus goes to the one above it.
    const now = await labels();
    await press(3);
    await expect(buttons).toHaveCount(3);
    await expect(page.getByRole("button", { name: now[2] })).toBeFocused();

    // Down to the only spine, whose removal leaves the heading.
    await press(0);
    await expect(buttons).toHaveCount(2);
    await press(0);
    await expect(buttons).toHaveCount(1);
    await press(0);
    await expect(page.getByText("Nothing waiting")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  });

  test("still announces a filter's count after a book has been taken off", async ({ page }) => {
    await page.goto("/dev/to-read?state=long&stub=1");
    const buttons = page.locator("[data-take-off]");
    await buttons.nth(0).focus();
    await page.keyboard.press("Enter");
    await expect(buttons).toHaveCount(9);
    await page.getByRole("searchbox", { name: "Find in your list" }).fill("zzzz");
    await expect(page.locator("output")).toHaveText("Nothing on your list matches “zzzz”.");
    await page.getByRole("button", { name: "Clear the filter" }).click();
    await page.getByRole("searchbox", { name: "Find in your list" }).fill("dune");
    await expect(page.locator("output")).toHaveText(/^\d+ of 9 books match$/);
  });

  test("hands focus to the heading when clearing leaves a list too short for the field", async ({ page }) => {
    await page.goto("/dev/to-read?state=eight&stub=1");
    const field = page.getByRole("searchbox", { name: "Find in your list" });
    const title = must(await page.locator("ol > li > div > a:not([aria-hidden]) span").first().textContent());
    await field.fill(title);
    const buttons = page.locator("[data-take-off]");
    await buttons.nth(0).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("ol > li")).toHaveCount(1);
    await field.fill("zzzz");
    await page.getByRole("button", { name: "Clear the filter" }).click();
    await expect(field).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  });

  test("leaves focus alone when the reader has moved on while a spine is taken off", async ({ page }) => {
    await page.goto("/dev/to-read?stub=1");
    const buttons = page.locator("[data-take-off]");
    await buttons.nth(0).focus();
    await page.keyboard.press("Enter");
    const elsewhere = buttons.nth(2);
    const label = await elsewhere.getAttribute("aria-label");
    await elsewhere.focus();
    await expect(buttons).toHaveCount(4);
    await expect(page.getByRole("button", { name: must(label) })).toBeFocused();
  });

  test("says nothing is waiting, and how to put a book here", async ({ page }) => {
    await page.goto("/dev/to-read?state=empty");
    await expect(page.getByText("Nothing waiting")).toBeVisible();
    await expect(page.getByRole("link", { name: "Search for a book" })).toHaveAttribute("href", "/search");
  });

  test("sets the whole spine off true, not just its left edge", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "phone layout (MRG-108): spines are full width and square, the pile is not offset");
    await page.goto("/dev/to-read");
    const rights = await page
      .locator("ol > li > div")
      .evaluateAll((nodes) => nodes.map((n) => Math.round(n.getBoundingClientRect().right)));
    expect(new Set(rights).size).toBeGreaterThan(1);
  });

  test("leaves a book with no cover without an empty jacket well", async ({ page }) => {
    await page.goto("/dev/to-read");
    const spine = page.locator("ol > li > div").filter({ has: page.getByText("Children of Dune", { exact: true }) });
    await expect(spine.locator("a[aria-hidden]")).toHaveCount(0);
  });

  test("never scrolls sideways", async ({ page }) => {
    await page.goto("/dev/to-read");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("Want to read on the book page", () => {
  test("offers Want to read on a book not on the list", async ({ page }) => {
    await page.goto("/dev/book?state=new");
    await expect(page.getByRole("button", { name: "Want to read" })).toBeVisible();
  });

  test("prints a saved book as on the list, with the way to it and the way off", async ({ page }) => {
    await page.goto("/dev/book?state=saved");
    await expect(page.getByText("On your to-read list")).toBeVisible();
    await expect(page.getByRole("link", { name: "Your list" })).toHaveAttribute("href", "/to-read");
    await expect(page.getByRole("button", { name: "Take it off" })).toBeVisible();
  });

  /* Pending, the pressed control keeps focus at its width; after, focus goes to
     the replacement, not the page (MRG-074). */
  test("keeps keyboard focus while it runs, then hands it on", async ({ page }) => {
    await page.goto("/dev/book?state=saved");
    const off = page.getByRole("button", { name: "Take it off" });
    const offWidth = (await off.boundingBox())?.width;
    await off.focus();
    await page.keyboard.press("Enter");
    const taking = page.getByRole("button", { name: /Taking it off/ });
    await expect(taking).toBeFocused();
    expect((await taking.boundingBox())?.width).toBe(offWidth);
    const want = page.getByRole("button", { name: "Want to read" });
    await expect(want).toBeFocused();

    const width = (await want.boundingBox())?.width;
    await page.keyboard.press("Enter");
    const saving = page.getByRole("button", { name: /Saving/ });
    await expect(saving).toBeFocused();
    expect((await saving.boundingBox())?.width).toBe(width);
    await expect(page.getByRole("link", { name: "Your list" })).toBeFocused();
  });

  test("refuses to save without a signed-in reader", async ({ page }) => {
    await page.goto("/dev/book?state=new");
    await page.getByRole("button", { name: "Want to read" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "signed out" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Want to read" })).toBeVisible();
  });
});

test("the diary's masthead leads to the to-read list, then the account", async ({ page }, testInfo) => {
  await page.goto("/dev/shelf");
  if (testInfo.project.name === "mobile") {
    // MRG-108: the masthead's nav is hidden on a phone; the bar carries the
    // same two places, in the same order (To read, then Account).
    const places = page.getByRole("navigation", { name: "Places" });
    await expect(places.getByRole("link", { name: "To read" })).toHaveAttribute("href", "/to-read");
    await expect(places.getByRole("link", { name: "Account" })).toHaveAttribute("href", "/settings");
    const order = await places.getByRole("link").allTextContents();
    expect(order.indexOf("To read")).toBeLessThan(order.indexOf("Account"));
    return;
  }
  const nav = page.getByRole("navigation", { name: "Your pages" });
  await expect(nav.getByRole("link")).toHaveText(["To read", "Margins", "Your account"]);
  await expect(nav.getByRole("link", { name: "To read" })).toHaveAttribute("href", "/to-read");
});

import { expect, test } from "@playwright/test";

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
    await page.goto("/dev/to-read", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("To read");
    await expect(page.getByText("5 books")).toBeVisible();
    await expect(spines(page)).toHaveCount(5);
    await expect(spines(page).first()).toHaveAttribute("href", /^\/book\/OL\d+W$/);
    await expect(page.getByRole("list", { name: /newest saved first/ })).toBeVisible();
  });

  test("sets a thick book thicker in the pile than a thin one", async ({ page }) => {
    await page.goto("/dev/to-read", { waitUntil: "networkidle" });
    // 256 pages against 604. Matched on the whole title: "Dune" alone is in
    // three of these titles.
    const height = async (title: string) =>
      (await page.locator("ol > li > div").filter({ has: page.getByText(title, { exact: true }) }).boundingBox())
        ?.height ?? 0;
    expect(await height("Dune Messiah")).toBeLessThan(await height("Dune"));
  });

  test("never wears a jacket colour: a waiting book has not earned one", async ({ page }) => {
    await page.goto("/dev/to-read", { waitUntil: "networkidle" });
    await expect(page.locator("ol > li > div").first()).toHaveCSS("background-color", "rgb(22, 19, 15)");
  });

  test("keeps Take it off outside the spine's link, named for its book", async ({ page }) => {
    await page.goto("/dev/to-read", { waitUntil: "networkidle" });
    await expect(page.locator("ol > li a button")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Take Dune off your list" })).toBeVisible();
  });

  test("refuses to take a book off without a signed-in reader", async ({ page }) => {
    await page.goto("/dev/to-read", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Take Dune off your list" }).click();
    // Under its own spine, in its own words. Filtered: Next's dev overlay
    // renders a role="alert" node of its own.
    const refusal = page.locator("ol > li", { hasText: /^Dune/ }).getByRole("alert");
    await expect(refusal).toContainText("Not taken off: you’re signed out.");
    await expect(page.getByRole("link", { name: "Sign in again" })).toHaveAttribute("href", "/");
    await expect(spines(page)).toHaveCount(5);
  });

  test("says nothing is waiting, and how to put a book here", async ({ page }) => {
    await page.goto("/dev/to-read?state=empty", { waitUntil: "networkidle" });
    await expect(page.getByText("Nothing waiting")).toBeVisible();
    await expect(page.getByRole("link", { name: "Search for a book" })).toHaveAttribute("href", "/search");
  });

  test("sets the whole spine off true, not just its left edge", async ({ page }) => {
    await page.goto("/dev/to-read", { waitUntil: "networkidle" });
    const rights = await page
      .locator("ol > li > div")
      .evaluateAll((nodes) => nodes.map((n) => Math.round(n.getBoundingClientRect().right)));
    expect(new Set(rights).size).toBeGreaterThan(1);
  });

  test("leaves a book with no cover without an empty jacket well", async ({ page }) => {
    await page.goto("/dev/to-read", { waitUntil: "networkidle" });
    const spine = page.locator("ol > li > div").filter({ has: page.getByText("Children of Dune", { exact: true }) });
    await expect(spine.locator("a[aria-hidden]")).toHaveCount(0);
  });

  test("never scrolls sideways", async ({ page }) => {
    await page.goto("/dev/to-read", { waitUntil: "networkidle" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("Want to read on the book page", () => {
  test("offers Want to read on a book not on the list", async ({ page }) => {
    await page.goto("/dev/book?state=new", { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Want to read" })).toBeVisible();
  });

  test("prints a saved book as on the list, with the way to it and the way off", async ({ page }) => {
    await page.goto("/dev/book?state=saved", { waitUntil: "networkidle" });
    await expect(page.getByText("On your to-read list")).toBeVisible();
    await expect(page.getByRole("link", { name: "Your list" })).toHaveAttribute("href", "/to-read");
    await expect(page.getByRole("button", { name: "Take it off" })).toBeVisible();
  });

  /* Pending, the pressed control keeps focus at its width; after, focus goes to
     the replacement, not the page (MRG-074). */
  test("keeps keyboard focus while it runs, then hands it on", async ({ page }) => {
    await page.goto("/dev/book?state=saved", { waitUntil: "networkidle" });
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
    await page.goto("/dev/book?state=new", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Want to read" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "signed out" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Want to read" })).toBeVisible();
  });
});

test("the diary's masthead leads to the to-read list, then the account", async ({ page }) => {
  await page.goto("/dev/shelf", { waitUntil: "networkidle" });
  const nav = page.getByRole("navigation", { name: "Your pages" });
  await expect(nav.getByRole("link")).toHaveText(["To read", "Your account"]);
  await expect(nav.getByRole("link", { name: "To read" })).toHaveAttribute("href", "/to-read");
});

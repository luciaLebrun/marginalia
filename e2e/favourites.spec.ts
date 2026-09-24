import { expect, test, type Page } from "@playwright/test";

/**
 * Favourites (MRG-071), in a real browser at both device classes, against the
 * dev harnesses and the seeded reader (`pnpm seed:dev`: three favourites).
 */
const band = (page: Page) => page.getByRole("region", { name: "Favourites" });
const cells = (page: Page) => band(page).locator("ol > li:not([aria-hidden])");

test.describe("the favourites band", () => {
  test("sits between the masthead and the shelf, ruled to four", async ({ page }) => {
    await page.goto("/dev/shelf", { waitUntil: "networkidle" });
    await expect(band(page)).toBeVisible();
    await expect(band(page).getByText("3 of 4")).toBeVisible();
    await expect(cells(page)).toHaveCount(3);

    // Room for another is drawn, not left blank.
    await expect(band(page).locator("ol > li[aria-hidden]")).toHaveCount(1);

    // Above the first year of the shelf.
    const bandBox = await band(page).boundingBox();
    const yearBox = await page.locator("main h2").nth(1).boundingBox();
    expect(bandBox!.y).toBeLessThan(yearBox!.y);
  });

  test("says how to arrange them, and names no buttons for it", async ({ page }) => {
    await page.goto("/dev/shelf", { waitUntil: "networkidle" });
    await expect(band(page).getByRole("button")).toHaveCount(0);
    await expect(band(page).locator("#favourites-arrange-hint")).toBeVisible();
    await expect(cells(page).first().getByRole("link")).toHaveAttribute(
      "aria-describedby",
      "favourites-arrange-hint",
    );
  });

  /*
   * These write the shared dev reader's order, so they run on one project only
   * and put the order back.
   */
  test("drags a favourite onto another position, the rest closing up", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "mutates the shared dev reader");
    await page.goto("/dev/shelf", { waitUntil: "networkidle" });
    const titles = () => cells(page).locator("h3").allTextContents();
    const before = await titles();

    const drag = async (from: number, to: number) => {
      const a = (await cells(page).nth(from).boundingBox())!;
      const b = (await cells(page).nth(to).boundingBox())!;
      await page.mouse.move(a.x + a.width / 2, a.y + a.height / 3);
      await page.mouse.down();
      await page.mouse.move(a.x + a.width / 2 + 20, a.y + a.height / 3, { steps: 4 });
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 3, { steps: 8 });
      await page.mouse.up();
    };

    await drag(0, 2);
    await expect.poll(titles).toEqual([before[1], before[2], before[0]]);
    // A drag is not a click: the book page did not open.
    await expect(page).toHaveURL(/\/dev\/shelf/);
    await expect(page.getByText(`${before[0]} moved to 3 of 3.`)).toBeAttached();

    await drag(2, 0);
    await expect.poll(titles).toEqual(before);

    // Carried away and brought back: its own position means "put it back".
    const a = (await cells(page).nth(0).boundingBox())!;
    const b = (await cells(page).nth(2).boundingBox())!;
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 3);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 3, { steps: 8 });
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 3, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(800);
    expect(await titles()).toEqual(before);
  });

  test("moves a favourite with Alt and an arrow key, keeping focus on it", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "mutates the shared dev reader");
    await page.goto("/dev/shelf", { waitUntil: "networkidle" });
    const titles = () => cells(page).locator("h3").allTextContents();
    const before = await titles();

    await cells(page).first().getByRole("link").focus();
    await page.keyboard.press("Alt+ArrowRight");
    await expect.poll(titles).toEqual([before[1], before[0], before[2]]);
    await expect(cells(page).nth(1).getByRole("link")).toBeFocused();

    await page.keyboard.press("Alt+ArrowLeft");
    await expect.poll(titles).toEqual(before);
    await expect(cells(page).first().getByRole("link")).toBeFocused();
    // Already first: nowhere to go, nothing moves.
    await page.keyboard.press("Alt+ArrowLeft");
    await expect.poll(titles).toEqual(before);
  });

  test("a plain click still opens the book", async ({ page }) => {
    await page.goto("/dev/shelf", { waitUntil: "networkidle" });
    const link = cells(page).first().getByRole("link");
    const href = (await link.getAttribute("href"))!;
    // The real book route sends a signed-out harness on to the door, so what
    // is asserted is that the click set off for the book at all.
    const request = page.waitForRequest((r) => new URL(r.url()).pathname === href);
    await link.click();
    await request;
  });

  test("shows on the public profile in the owner's order, with nothing to arrange", async ({
    page,
  }) => {
    await page.goto("/dev/profile?viewer=visitor", { waitUntil: "networkidle" });
    await expect(cells(page)).toHaveCount(3);
    await expect(band(page).getByText("3 books")).toBeVisible();
    await expect(band(page).getByRole("button")).toHaveCount(0);
    // A visitor's cells are inert, as the shelf's are.
    await expect(band(page).getByRole("link")).toHaveCount(0);
  });

  test("links a signed-in viewer's cells to the book page", async ({ page }) => {
    await page.goto("/dev/profile?viewer=friend", { waitUntil: "networkidle" });
    await expect(band(page).getByRole("link")).toHaveCount(3);
  });
});

test.describe("the favourite control on a book page", () => {
  test("is not offered before a book is read", async ({ page }) => {
    await page.goto("/dev/book?state=new", { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Add to favourites" })).toHaveCount(0);
  });

  test("is an Outline Button once the book is read", async ({ page }) => {
    await page.goto("/dev/book?state=shelf", { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Add to favourites" })).toBeEnabled();
  });

  test("prints the line once it is a favourite", async ({ page }) => {
    await page.goto("/dev/book?state=favourite", { waitUntil: "networkidle" });
    await expect(page.getByText("One of your favourites")).toBeVisible();
    await expect(page.getByRole("button", { name: "Take it off" })).toBeVisible();
  });

  /* WCAG 2.5.7: the band is arranged by dragging, so taps must do it too. */
  test("offers Earlier and Later on a favourite, ruled through at an end", async ({ page }) => {
    await page.goto("/dev/book?state=favourite", { waitUntil: "networkidle" });
    await expect(page.getByText("· 2 of 3")).toBeVisible();
    await expect(page.getByRole("button", { name: /earlier/i })).toBeEnabled();
    await expect(page.getByRole("button", { name: /later/i })).toBeEnabled();

    await page.goto("/dev/book?state=favourite-first", { waitUntil: "networkidle" });
    await expect(page.getByText("· 1 of 3")).toBeVisible();
    await expect(page.getByRole("button", { name: /earlier/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /later/i })).toBeEnabled();
  });

  test("at four, stays ruled through beside its reason", async ({ page }) => {
    await page.goto("/dev/book?state=full", { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Add to favourites" })).toBeDisabled();
    await expect(page.getByText(/You have four already/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Your favourites" })).toBeVisible();
  });

  /* The control pressed is replaced; focus goes to its replacement, not the page. */
  test("hands keyboard focus on after adding and after taking off", async ({ page }) => {
    // Want to Read and this control are siblings keyed on the read count; a
    // clash between their keys shows only as a console error (MRG-074).
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto("/dev/book?state=shelf", { waitUntil: "networkidle" });
    const add = page.getByRole("button", { name: "Add to favourites" });
    await add.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: /Adding/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Your favourites" })).toBeFocused();

    await page.keyboard.press("Tab");
    const off = page.getByRole("button", { name: "Take it off" });
    await expect(off).toBeFocused();
    const offWidth = (await off.boundingBox())?.width;
    await page.keyboard.press("Enter");
    // Pending, it keeps focus and its width rather than going natively
    // disabled (MRG-074).
    const taking = page.getByRole("button", { name: /Taking it off/ });
    await expect(taking).toBeFocused();
    expect((await taking.boundingBox())?.width).toBe(offWidth);
    await expect(page.getByRole("button", { name: "Add to favourites" })).toBeFocused();
    expect(errors).toEqual([]);
  });
});

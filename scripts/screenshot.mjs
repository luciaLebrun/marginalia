/**
 * Screenshot a route at the breakpoints this project designs for.
 *
 *   pnpm shot                    the diary, all three widths
 *   pnpm shot /dev/shelf out/    a specific route and output directory
 *
 * Needs `pnpm dev` running. Exists because UI work has to be looked at, and a
 * headless browser is the only way to do that deterministically — a screenshot
 * taken by hand at whatever width the window happened to be is not evidence.
 */
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const route = process.argv[2] ?? "/dev/shelf";
const out = process.argv[3] ?? ".screenshots";
const base = process.env.SHOT_BASE_URL ?? "http://localhost:3000";

/** 360 is the narrow phone floor; 1440 is the laptop the brief also calls primary. */
const WIDTHS = [
  { name: "360", width: 360, height: 780, fullPage: false },
  { name: "768", width: 768, height: 900, fullPage: true },
  { name: "1440", width: 1440, height: 1000, fullPage: true },
];

mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const slug = route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "root";

for (const size of WIDTHS) {
  const page = await browser.newPage({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: 2,
  });

  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  // Covers are lazy; give the ones in view a moment to paint.
  await page.waitForTimeout(900);

  const path = `${out}/${slug}-${size.name}.png`;
  await page.screenshot({ path, fullPage: size.fullPage });

  // A page that logs errors is not passing just because it rendered.
  const note = errors.length ? `  ⚠ ${errors.length} console error(s): ${errors[0]}` : "";
  console.log(`${path}  ${size.width}px${note}`);

  await page.close();
}

await browser.close();

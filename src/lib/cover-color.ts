import jpeg from "jpeg-js";

import { CATEGORY_BANDS, conditionBand, rgbToHex, rgbToHsl } from "./color.ts";

/**
 * Derive a band colour from a book's cover art.
 *
 * Runs once per book, at upsert, and the result is stored on the row — the
 * database is the record, so no page render ever waits on this.
 *
 * Uses a pure-JS JPEG decoder rather than sharp: sharp is a native binary, and
 * Open Library always serves `-L.jpg`, so there is nothing to gain from one.
 */

/** Buckets are coarse on purpose — cover scans are noisy. */
const HUE_BUCKETS = 24;
const SAMPLE_STRIDE = 4;

interface Bucket {
  count: number;
  r: number;
  g: number;
  b: number;
}

/**
 * Pure. Given decoded RGBA pixels, pick the dominant *chromatic* colour.
 *
 * The naive average of a book cover is always mud, because most covers are
 * mostly paper. So near-white, near-black and near-grey pixels are discarded
 * entirely, pixels are bucketed by hue, and the largest bucket's mean wins.
 * Returns null when a cover has no chromatic content at all — a black-and-white
 * jacket should fall back to a category colour rather than be forced into one.
 */
export function dominantColor(
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
): string | null {
  const buckets = new Map<number, Bucket>();
  let considered = 0;

  for (let y = 0; y < height; y += SAMPLE_STRIDE) {
    for (let x = 0; x < width; x += SAMPLE_STRIDE) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 200) continue;

      const { h, s, l } = rgbToHsl({ r, g, b });
      // Paper borders, spine shadows and washed scans contribute nothing.
      if (s < 0.18 || l < 0.12 || l > 0.9) continue;

      considered++;
      const key = Math.floor(h * HUE_BUCKETS) % HUE_BUCKETS;
      const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
      bucket.count++;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      buckets.set(key, bucket);
    }
  }

  // A cover that is essentially monochrome gives no honest band colour.
  if (considered < 40 || buckets.size === 0) return null;

  let best: Bucket | undefined;
  for (const bucket of buckets.values()) {
    if (!best || bucket.count > best.count) best = bucket;
  }
  if (!best) return null;

  return conditionBand(
    rgbToHex({
      r: best.r / best.count,
      g: best.g / best.count,
      b: best.b / best.count,
    }),
  );
}

/**
 * Best-effort. Every failure path returns null so the caller falls back to a
 * category colour — a cover we cannot decode must never block saving a book.
 */
export async function bandColorFromCover(
  coverId: number | null | undefined,
): Promise<string | null> {
  if (coverId == null || coverId <= 0) return null;

  try {
    const res = await fetch(
      `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`,
      { redirect: "follow", next: { revalidate: 60 * 60 * 24 * 30 } },
    );
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    // Open Library serves a 1x1 placeholder for missing covers.
    if (buffer.length < 1024) return null;

    const decoded = jpeg.decode(buffer, { useTArray: true });
    return dominantColor(decoded.data, decoded.width, decoded.height);
  } catch {
    return null;
  }
}

export { CATEGORY_BANDS };

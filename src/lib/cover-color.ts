import { createHash } from "node:crypto";

import jpeg from "jpeg-js";

import { conditionBand, rgbToHex, rgbToHsl } from "./color.ts";

/**
 * Derive a band colour from a book's cover art.
 *
 * Runs once per book, at upsert, and the result is stored on the row — the
 * database is the record, so no page render ever waits on this.
 *
 * Uses a pure-JS JPEG decoder rather than sharp: sharp is a native binary, and
 * both sources serve JPEG — Open Library as `-M.jpg`, Google Books as
 * `books/content?...` — so there is nothing to gain from one.
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
 * sha256 of Google's "image not available" jacket as served at `w=256`, the
 * width `sampleUrl()` asks for. Measured live (MRG-076): the same bytes come
 * back for every volume without a scan, but the bytes change with `w`, so this
 * is only valid for that width. If Google redraws the placeholder this goes
 * stale and the placeholder returns — re-measure and replace it.
 */
const GOOGLE_PLACEHOLDER_SHA256 =
  "343c97d84bc081919c5c0aceec60123513419c1a9f4812097c56508fa93d4d73";

/** Pure. Google's "image not available" jacket, byte for byte. */
export function isPlaceholder(buffer: Buffer): boolean {
  return createHash("sha256").update(buffer).digest("hex") === GOOGLE_PLACEHOLDER_SHA256;
}

/**
 * Pure. Some volumes serve an 800x128 sliver instead of a jacket; no jacket is
 * twice as wide as it is tall. An image either way, so it would beat the
 * coverless type jacket for nothing.
 */
export function isStrip(width: number, height: number): boolean {
  return width > height * 2;
}

export interface CoverInspection {
  color: string | null;
  /** False when the jacket is a placeholder or strip and should not be stored. */
  usable: boolean;
}

/**
 * Best-effort. Every failure path returns no colour and a usable jacket, so
 * the caller falls back to a category colour — a cover we cannot decode must
 * never block saving a book, nor be thrown away on a guess.
 */
export async function inspectCover(
  url: string | null | undefined,
): Promise<CoverInspection> {
  const fallback = { color: null, usable: true };
  if (!url) return fallback;

  try {
    const res = await fetch(url, {
      redirect: "follow",
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!res.ok) return fallback;

    const buffer = Buffer.from(await res.arrayBuffer());
    // The placeholder is a PNG, so it must be caught before the JPEG decode.
    if (isPlaceholder(buffer)) return { color: null, usable: false };

    const decoded = jpeg.decode(buffer, { useTArray: true });
    if (isStrip(decoded.width, decoded.height)) return { color: null, usable: false };
    // Open Library serves a 1x1 placeholder for a missing cover, and Google a
    // "no image" gif; either way, nothing that small carries a band colour.
    if (buffer.length < 1024) return fallback;

    return {
      color: dominantColor(decoded.data, decoded.width, decoded.height),
      usable: true,
    };
  } catch {
    return fallback;
  }
}

export async function bandColorFromCover(
  url: string | null | undefined,
): Promise<string | null> {
  return (await inspectCover(url)).color;
}

export { CATEGORY_BANDS } from "./color.ts";

import { describe, expect, it } from "vitest";

import { dominantColor } from "./cover-color";
import { hexToRgb, rgbToHsl } from "./color";

/** Build an RGBA buffer from a function of (x, y). */
function image(
  width: number,
  height: number,
  at: (x: number, y: number) => [number, number, number, number?],
): Uint8Array {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a = 255] = at(x, y);
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }
  return data;
}

const hueOf = (hex: string) => rgbToHsl(hexToRgb(hex)!).h;

describe("dominantColor", () => {
  it("finds the hue of a solid cover", () => {
    const red = dominantColor(image(64, 64, () => [200, 40, 40]), 64, 64);
    expect(red).not.toBeNull();
    expect(hueOf(red!)).toBeCloseTo(hueOf("#C82828"), 1);
  });

  it("ignores the paper border that dominates most jackets", () => {
    // 80% near-white paper, 20% blue art. The naive average would be pale mud;
    // the answer must be blue.
    const data = image(100, 100, (x, y) =>
      x < 20 && y < 100 ? [30, 90, 200] : [250, 249, 245],
    );
    const hex = dominantColor(data, 100, 100);
    expect(hex).not.toBeNull();
    expect(hueOf(hex!)).toBeCloseTo(hueOf("#1E5AC8"), 1);
  });

  it("ignores a near-black spine", () => {
    const data = image(100, 100, (x) =>
      x < 15 ? [8, 8, 10] : [220, 150, 20],
    );
    const hex = dominantColor(data, 100, 100);
    expect(hueOf(hex!)).toBeCloseTo(hueOf("#DC9614"), 1);
  });

  it("returns null for a monochrome jacket rather than inventing a hue", () => {
    // A black-and-white cover has no honest band colour; the caller falls back
    // to a stable category colour instead.
    expect(dominantColor(image(64, 64, () => [128, 128, 128]), 64, 64)).toBeNull();
    expect(dominantColor(image(64, 64, () => [250, 250, 250]), 64, 64)).toBeNull();
    expect(dominantColor(image(64, 64, () => [5, 5, 5]), 64, 64)).toBeNull();
  });

  it("returns null when there is too little chromatic content to trust", () => {
    // One coloured pixel in a white field is noise, not a cover colour.
    const data = image(100, 100, (x, y) =>
      x === 0 && y === 0 ? [200, 30, 30] : [250, 250, 250],
    );
    expect(dominantColor(data, 100, 100)).toBeNull();
  });

  it("picks the larger of two colour fields", () => {
    const data = image(100, 100, (x) => (x < 70 ? [40, 160, 90] : [200, 60, 30]));
    expect(hueOf(dominantColor(data, 100, 100)!)).toBeCloseTo(hueOf("#28A05A"), 1);
  });

  it("skips transparent pixels", () => {
    const data = image(100, 100, (x) =>
      x < 60 ? [200, 30, 30, 0] : [40, 90, 200, 255],
    );
    expect(hueOf(dominantColor(data, 100, 100)!)).toBeCloseTo(hueOf("#285AC8"), 1);
  });

  it("always returns a conditioned band, never a raw pixel value", () => {
    // A washed-out cover must still yield a usable field.
    const hex = dominantColor(image(64, 64, () => [216, 205, 198]), 64, 64);
    if (hex) {
      const { s, l } = rgbToHsl(hexToRgb(hex)!);
      expect(s).toBeGreaterThanOrEqual(0.34);
      expect(l).toBeLessThanOrEqual(0.63);
    }
  });
});

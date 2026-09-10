import jpeg from "jpeg-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { bandColorFromCover, dominantColor } from "./cover-color";
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

/**
 * A real encoded JPEG, so the decoder is exercised rather than mocked.
 *
 * Deliberately 200px with a little per-pixel noise: a small flat-colour JPEG
 * compresses to ~677 bytes and trips the 1024-byte guard that exists to catch
 * Open Library's 1x1 "no cover" placeholder. A fixture has to be at least as
 * substantial as the real thing it stands in for.
 */
function jpegOf(r: number, g: number, b: number, size = 200): ArrayBuffer {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const noise = ((i * 2654435761) % 7) - 3;
    data[i * 4] = r + noise;
    data[i * 4 + 1] = g + noise;
    data[i * 4 + 2] = b + noise;
    data[i * 4 + 3] = 255;
  }
  const encoded = jpeg.encode({ data, width: size, height: size }, 90).data;
  return encoded.buffer.slice(
    encoded.byteOffset,
    encoded.byteOffset + encoded.byteLength,
  ) as ArrayBuffer;
}

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

describe("bandColorFromCover", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("does not touch the network without a cover id", async () => {
    for (const id of [null, undefined, 0, -1]) {
      await expect(bandColorFromCover(id)).resolves.toBeNull();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requests the medium cover by CoverID, never by ISBN", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      arrayBuffer: async () => jpegOf(200, 40, 40),
    });

    await bandColorFromCover(11481354);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://covers.openlibrary.org/b/id/11481354-M.jpg");
    expect(url).not.toContain("/b/isbn/");
    expect(init.redirect).toBe("follow");
  });

  it("derives a band colour from a real JPEG", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      arrayBuffer: async () => jpegOf(30, 90, 200),
    });

    const hex = await bandColorFromCover(1);
    expect(hex).toMatch(/^#[0-9A-F]{6}$/);
    expect(hueOf(hex!)).toBeCloseTo(hueOf("#1E5AC8"), 1);
  });

  it("returns null for the 1x1 placeholder Open Library serves for missing covers", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(120),
    });
    await expect(bandColorFromCover(1)).resolves.toBeNull();
  });

  it("returns null rather than throwing when the cover cannot be had", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });
    await expect(bandColorFromCover(1)).resolves.toBeNull();

    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    await expect(bandColorFromCover(1)).resolves.toBeNull();
  });

  it("returns null rather than throwing when the bytes are not a JPEG", async () => {
    // A cover we cannot decode must never block saving a book.
    fetchMock.mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new Uint8Array(4096).fill(0x41).buffer,
    });
    await expect(bandColorFromCover(1)).resolves.toBeNull();
  });
});

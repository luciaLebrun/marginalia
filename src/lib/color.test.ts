import { describe, expect, it } from "vitest";

import {
  CATEGORY_BANDS,
  INK,
  PAPER,
  conditionBand,
  contrastRatio,
  fallbackBand,
  hexToRgb,
  hslToRgb,
  meetsAA,
  readableOn,
  rgbToHex,
  rgbToHsl,
} from "./color";

describe("hexToRgb / rgbToHex", () => {
  it("round-trips", () => {
    expect(rgbToHex(hexToRgb("#E8501B")!)).toBe("#E8501B");
  });

  it("accepts a missing hash and mixed case", () => {
    expect(hexToRgb("e8501b")).toEqual({ r: 232, g: 80, b: 27 });
  });

  it("rejects junk rather than guessing", () => {
    for (const bad of ["", "#fff", "#gggggg", "rgb(1,2,3)"]) {
      expect(hexToRgb(bad)).toBeNull();
    }
  });

  it("clamps out-of-range channels", () => {
    expect(rgbToHex({ r: 300, g: -20, b: 128 })).toBe("#FF0080");
  });
});

describe("contrastRatio", () => {
  it("is 21:1 for black on white", () => {
    expect(
      contrastRatio(hexToRgb("#000000")!, hexToRgb("#FFFFFF")!),
    ).toBeCloseTo(21, 1);
  });

  it("is 1:1 for a colour against itself", () => {
    expect(contrastRatio(hexToRgb("#E8501B")!, hexToRgb("#E8501B")!)).toBe(1);
  });

  it("is order-independent", () => {
    const a = hexToRgb("#007A5E")!;
    const b = hexToRgb("#F4F1E8")!;
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10);
  });
});

describe("readableOn", () => {
  it("puts paper on a dark band and ink on a pale one", () => {
    expect(readableOn("#16130F")).toBe(PAPER);
    expect(readableOn("#F0E68C")).toBe(INK);
  });

  it("always returns a pairing that clears AA on the category bands", () => {
    // Band colours come from arbitrary cover art, so this must hold generally,
    // not just for the ones that happen to be in the fixture.
    for (const band of CATEGORY_BANDS) {
      expect(meetsAA(band, readableOn(band), true)).toBe(true);
    }
  });

  it("falls back to ink for an unparseable colour", () => {
    expect(readableOn("nonsense")).toBe(INK);
  });
});

describe("fallbackBand", () => {
  it("is stable for the same key, so a shelf never reshuffles its colours", () => {
    const first = fallbackBand("OL893414W");
    for (let i = 0; i < 20; i++) expect(fallbackBand("OL893414W")).toBe(first);
  });

  it("always returns a category band", () => {
    for (let i = 0; i < 200; i++) {
      expect(CATEGORY_BANDS).toContain(fallbackBand(`OL${i}W`));
    }
  });

  it("spreads across all three bands rather than favouring one", () => {
    const seen = new Set(
      Array.from({ length: 300 }, (_, i) => fallbackBand(`OL${i * 7 + 3}W`)),
    );
    expect(seen.size).toBe(CATEGORY_BANDS.length);
  });
});

describe("conditionBand", () => {
  // Round-tripping through an 8-bit hex string costs about 0.0016 of
  // lightness, so the clamp bounds are asserted with that tolerance rather
  // than exactly. Asserting exactness here tests the hex format, not the clamp.
  const Q = 0.002;

  it("lifts a washed-out scan to a usable field", () => {
    const conditioned = conditionBand("#D9CFC9");
    const { s, l } = rgbToHsl(hexToRgb(conditioned)!);
    expect(s).toBeGreaterThanOrEqual(0.35 - Q);
    expect(l).toBeLessThanOrEqual(0.62 + Q);
  });

  it("pulls a near-black spine up into the band range", () => {
    const { l } = rgbToHsl(hexToRgb(conditionBand("#0B0A09"))!);
    expect(l).toBeGreaterThanOrEqual(0.28 - Q);
  });

  it("pulls a near-white border down into the band range", () => {
    const { l } = rgbToHsl(hexToRgb(conditionBand("#FBFAF6"))!);
    expect(l).toBeLessThanOrEqual(0.62 + Q);
  });

  it("keeps the hue it was given", () => {
    const before = rgbToHsl(hexToRgb("#2E86C1")!).h;
    const after = rgbToHsl(hexToRgb(conditionBand("#2E86C1"))!).h;
    expect(after).toBeCloseTo(before, 2);
  });

  it("produces a band that a readable text colour clears AA against", () => {
    for (const raw of ["#D9CFC9", "#0B0A09", "#FBFAF6", "#2E86C1", "#7A1F2B"]) {
      const band = conditionBand(raw);
      expect(meetsAA(band, readableOn(band), true)).toBe(true);
    }
  });

  it("falls back rather than throwing on junk", () => {
    expect(conditionBand("not-a-colour")).toBe(CATEGORY_BANDS[0]);
  });
});

describe("rgbToHsl / hslToRgb", () => {
  it("round-trips a saturated colour", () => {
    const rgb = hexToRgb("#E8501B")!;
    const back = hslToRgb(rgbToHsl(rgb));
    expect(back.r).toBeCloseTo(rgb.r, 0);
    expect(back.g).toBeCloseTo(rgb.g, 0);
    expect(back.b).toBeCloseTo(rgb.b, 0);
  });

  it("handles greys, where hue is undefined", () => {
    expect(rgbToHsl({ r: 128, g: 128, b: 128 }).s).toBe(0);
    expect(hslToRgb({ h: 0, s: 0, l: 0.5 }).r).toBeCloseTo(127.5, 0);
  });
});

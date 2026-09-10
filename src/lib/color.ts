/**
 * Colour maths for the tri-band system. Pure — no I/O, no image decoding.
 *
 * Every band on the page is a saturated field carrying tracked-out caps, so the
 * one thing that must never be guessed is whether that text is readable. These
 * helpers decide it by contrast ratio rather than by eye.
 */

/** Penguin's category colours, the fallback band set when a cover gives none. */
export const CATEGORY_BANDS = ["#E8501B", "#007A5E", "#00A0C6"] as const;

export const PAPER = "#F4F1E8";
export const INK = "#16130F";

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = Number.parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/** WCAG relative luminance. */
export function luminance({ r, g, b }: Rgb): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio, 1 to 21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Pick ink or paper for text sitting on `background`, whichever is more
 * readable. Band colours come from arbitrary cover art, so this cannot be a
 * fixed choice — a pale yellow jacket and a navy one need opposite answers.
 */
export function readableOn(background: string): typeof INK | typeof PAPER {
  const bg = hexToRgb(background);
  if (!bg) return INK;
  const ink = hexToRgb(INK)!;
  const paper = hexToRgb(PAPER)!;
  return contrastRatio(bg, ink) >= contrastRatio(bg, paper) ? INK : PAPER;
}

/** Does this pairing clear WCAG AA for the given text size? */
export function meetsAA(background: string, foreground: string, large = false): boolean {
  const bg = hexToRgb(background);
  const fg = hexToRgb(foreground);
  if (!bg || !fg) return false;
  return contrastRatio(bg, fg) >= (large ? 3 : 4.5);
}

/**
 * A stable band colour for a book with no usable cover colour.
 *
 * Deterministic on the work key so an entry never changes colour between
 * renders — a shelf that reshuffles its own colours on every visit reads as
 * broken rather than lively.
 */
export function fallbackBand(olWorkKey: string): string {
  let hash = 0;
  for (let i = 0; i < olWorkKey.length; i++) {
    hash = (hash * 31 + (olWorkKey.codePointAt(i) ?? 0)) >>> 0;
  }
  return CATEGORY_BANDS[hash % CATEGORY_BANDS.length];
}

/**
 * Push a colour into the range a band can actually use.
 *
 * Cover art hands us plenty of colours that fail as a field: near-white paper
 * borders, near-black spines, and washed-out scans. Saturation is floored and
 * lightness is pulled into a mid range, so every band reads as a deliberate
 * flat ink rather than as whatever the scanner captured.
 */
export function conditionBand(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return CATEGORY_BANDS[0];

  const { h, s, l } = rgbToHsl(rgb);
  const conditioned = hslToRgb({
    h,
    s: Math.max(s, 0.35),
    l: Math.min(Math.max(l, 0.28), 0.62),
  });
  return rgbToHex(conditioned);
}

export function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) return { h: 0, s: 0, l };

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;

  return { h, s, l };
}

export function hslToRgb({ h, s, l }: { h: number; s: number; l: number }): Rgb {
  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return {
    r: channel(h + 1 / 3) * 255,
    g: channel(h) * 255,
    b: channel(h - 1 / 3) * 255,
  };
}

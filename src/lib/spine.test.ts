import { describe, expect, it } from "vitest";

import { spineHeightRem, spineOffsetStep } from "./spine";

describe("spineHeightRem", () => {
  it("sets a thick book thicker in the pile than a thin one", () => {
    expect(spineHeightRem(900)).toBeGreaterThan(spineHeightRem(200));
  });

  it("clamps a pamphlet and a doorstop to the page", () => {
    expect(spineHeightRem(12)).toBe(3.5);
    expect(spineHeightRem(4000)).toBe(6);
  });

  it("gives a book with no page count a middling spine, not none", () => {
    expect(spineHeightRem(null)).toBe(4.5);
    expect(spineHeightRem(0)).toBe(4.5);
  });

  it("rounds to quarter-rems so similar books match", () => {
    for (const pages of [150, 333, 604, 777]) {
      expect((spineHeightRem(pages) * 4) % 1).toBe(0);
    }
  });
});

describe("spineOffsetStep", () => {
  it("is stable for a book, so the pile never reshuffles", () => {
    const first = spineOffsetStep("OL893414W");
    for (let i = 0; i < 10; i++) expect(spineOffsetStep("OL893414W")).toBe(first);
  });

  it("stays within its four steps and uses all of them", () => {
    const steps = new Set(Array.from({ length: 200 }, (_, i) => spineOffsetStep(`OL${i}W`)));
    expect([...steps].sort()).toEqual([0, 1, 2, 3]);
  });
});

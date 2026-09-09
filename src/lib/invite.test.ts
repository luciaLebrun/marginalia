import { describe, expect, it } from "vitest";

import { generateInviteCode, normalizeInviteCode } from "./invite";

describe("generateInviteCode", () => {
  it("produces the K7QM-3XPT shape", () => {
    expect(generateInviteCode()).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it("never emits characters that are confusable when read aloud or typed", () => {
    // O/0, I/1/L and U/V are the pairs people get wrong copying a code out of
    // a chat message. 200 samples is enough to catch an alphabet regression.
    const banned = /[OIL01UV]/;
    for (let i = 0; i < 200; i++) {
      expect(generateInviteCode()).not.toMatch(banned);
    }
  });

  it("is driven by the injected RNG, so it is deterministic under test", () => {
    expect(generateInviteCode(() => 0)).toBe("AAAA-AAAA");
  });

  it("round-trips through normalize", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateInviteCode();
      expect(normalizeInviteCode(code)).toBe(code);
    }
  });
});

describe("normalizeInviteCode", () => {
  it.each([
    ["exact", "K7QM-3XPT"],
    ["lowercase", "k7qm-3xpt"],
    ["no dash", "K7QM3XPT"],
    ["spaces", " K7QM 3XPT "],
    ["extra dashes", "K-7-Q-M-3-X-P-T"],
    ["mixed case and junk", "k7qm_3xPt"],
  ])("accepts what a human types: %s", (_label, input) => {
    expect(normalizeInviteCode(input)).toBe("K7QM-3XPT");
  });

  it.each([
    ["empty", ""],
    ["too short", "K7QM-3XP"],
    ["too long", "K7QM-3XPTA"],
    ["contains a banned letter O", "K7QM-3XPO"],
    ["contains a banned digit 0", "K7QM-3XP0"],
    ["contains a banned letter I", "K7QM-3XPI"],
    ["all punctuation", "----"],
  ])("rejects %s so we never query with junk", (_label, input) => {
    expect(normalizeInviteCode(input)).toBeNull();
  });

  it("is idempotent", () => {
    const once = normalizeInviteCode("k7qm3xpt");
    expect(once).not.toBeNull();
    expect(normalizeInviteCode(once!)).toBe(once);
  });
});

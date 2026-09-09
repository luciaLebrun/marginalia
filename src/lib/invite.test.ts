import { describe, expect, it, vi } from "vitest";

import {
  generateInviteCode,
  normalizeInviteCode,
  secureRandomInt,
} from "./invite";

describe("secureRandomInt", () => {
  it("stays in range", () => {
    for (let i = 0; i < 500; i++) {
      const n = secureRandomInt(29);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(29);
    }
  });

  it("rejects out-of-range bytes rather than folding them with modulo", () => {
    // 256 is not a multiple of 29, so bytes 232..255 must be discarded. If they
    // were folded with `% 29` instead, 0..23 would be measurably likelier and
    // the real keyspace would shrink.
    const bytes = [255, 240, 232, 231]; // three rejects, then one accept
    let call = 0;
    const spy = vi
      .spyOn(globalThis.crypto, "getRandomValues")
      .mockImplementation(((buf: Uint8Array) => {
        buf[0] = bytes[Math.min(call++, bytes.length - 1)];
        return buf;
      }) as typeof crypto.getRandomValues);

    expect(secureRandomInt(29)).toBe(231 % 29);
    expect(spy).toHaveBeenCalledTimes(4);
    spy.mockRestore();
  });

  it("covers the whole alphabet range given enough draws", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 3000; i++) seen.add(secureRandomInt(29));
    expect(seen.size).toBe(29);
  });

  it("refuses a range it cannot serve from one byte", () => {
    expect(() => secureRandomInt(0)).toThrow(RangeError);
    expect(() => secureRandomInt(257)).toThrow(RangeError);
    expect(() => secureRandomInt(1.5)).toThrow(RangeError);
  });
});

describe("generateInviteCode", () => {
  it("draws from the CSPRNG, never Math.random", () => {
    // Invite codes are the only gate on this app. Math.random is xorshift128+
    // in V8 and its state is recoverable from a few observed outputs, so a
    // regression here is a security regression, not a style one.
    const mathSpy = vi.spyOn(Math, "random");
    const cryptoSpy = vi.spyOn(globalThis.crypto, "getRandomValues");

    generateInviteCode();

    expect(cryptoSpy).toHaveBeenCalled();
    expect(mathSpy).not.toHaveBeenCalled();

    mathSpy.mockRestore();
    cryptoSpy.mockRestore();
  });

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

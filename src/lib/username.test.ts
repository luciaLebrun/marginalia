import { describe, expect, it } from "vitest";

import {
  MAX_LENGTH,
  MIN_LENGTH,
  RESERVED,
  handlePath,
  normalizeUsername,
  parseHandle,
  usernameError,
} from "./username";

describe("normalizeUsername", () => {
  it.each([
    ["plain", "lucia", "lucia"],
    ["uppercase", "LUCIA", "lucia"],
    ["mixed case", "LuCiA", "lucia"],
    ["surrounding space", "  lucia  ", "lucia"],
    ["a leading @", "@lucia", "lucia"],
    ["@ and case together", " @Lucia ", "lucia"],
    ["digits after a letter", "lucia2026", "lucia2026"],
    ["a single underscore", "lucia_reads", "lucia_reads"],
    ["exactly the minimum", "abc", "abc"],
    ["exactly the maximum", "a".repeat(MAX_LENGTH), "a".repeat(MAX_LENGTH)],
  ])("accepts %s", (_label, input, expected) => {
    expect(normalizeUsername(input)).toBe(expected);
  });

  it.each([
    ["empty", ""],
    ["only spaces", "   "],
    ["too short", "ab"],
    ["too long", "a".repeat(MAX_LENGTH + 1)],
    ["starting with a digit", "1lucia"],
    ["starting with an underscore", "_lucia"],
    ["a hyphen", "lucia-reads"],
    ["a dot", "lucia.reads"],
    ["a space inside", "lucia reads"],
    ["an accent", "lucía"],
    ["an emoji", "lucia📚"],
    ["a slash", "lucia/books"],
    ["doubled underscores", "lucia__reads"],
    ["a trailing underscore", "lucia_"],
    ["a second @ inside", "lu@cia"],
  ])("rejects %s", (_label, input) => {
    expect(normalizeUsername(input)).toBeNull();
  });

  it("rejects every reserved name, in any case", () => {
    for (const name of RESERVED) {
      expect(normalizeUsername(name)).toBeNull();
      expect(normalizeUsername(name.toUpperCase())).toBeNull();
      expect(normalizeUsername(`@${name}`)).toBeNull();
    }
  });

  it("is idempotent, so one username has exactly one spelling", () => {
    const once = normalizeUsername("  @LuCiA_Reads ");
    expect(once).toBe("lucia_reads");
    expect(normalizeUsername(once!)).toBe(once);
  });
});

describe("usernameError", () => {
  it("returns null when the username is fine", () => {
    expect(usernameError("lucia")).toBeNull();
    expect(usernameError("@Lucia_Reads")).toBeNull();
  });

  it.each([
    ["", /pick a username/i],
    ["ab", new RegExp(`at least ${MIN_LENGTH}`, "i")],
    ["a".repeat(MAX_LENGTH + 1), new RegExp(`at most ${MAX_LENGTH}`, "i")],
    ["1lucia", /start with a letter/i],
    ["_lucia", /start with a letter/i],
    ["lucia-reads", /letters, numbers and underscores/i],
    ["lucia__reads", /one underscore at a time/i],
    ["lucia_", /cannot end with an underscore/i],
    ["admin", /reserved/i],
  ])("explains why %o is refused", (input, pattern) => {
    expect(usernameError(input)).toMatch(pattern);
  });

  it("agrees with normalizeUsername on every case it is given", () => {
    const samples = [
      "lucia", "@Lucia", "", "ab", "1x", "_x", "lucia-reads", "lucia__x",
      "lucia_", "admin", "a".repeat(MAX_LENGTH + 1), "lucía", "ok_name",
    ];
    for (const s of samples) {
      // An input either normalizes or has a reason. Never both, never neither.
      expect(normalizeUsername(s) === null).toBe(usernameError(s) !== null);
    }
  });
});

describe("parseHandle", () => {
  it("decodes the percent-encoded segment Next actually hands over", () => {
    // /@lucia arrives as "%40lucia", NOT as "@lucia". Verified against a real
    // Next 16 route — decoding here is mandatory, not defensive.
    expect(parseHandle("%40lucia")).toBe("lucia");
  });

  it("accepts an already-decoded handle too", () => {
    expect(parseHandle("@lucia")).toBe("lucia");
  });

  it("normalizes case through the handle", () => {
    expect(parseHandle("%40LuCiA")).toBe("lucia");
  });

  it("rejects a segment with no @, so bare paths do not resolve as profiles", () => {
    expect(parseHandle("lucia")).toBeNull();
    expect(parseHandle("settings")).toBeNull();
  });

  it("rejects an @ followed by an invalid username", () => {
    expect(parseHandle("%40ab")).toBeNull();
    expect(parseHandle("%40admin")).toBeNull();
    expect(parseHandle("%40lucia-reads")).toBeNull();
    expect(parseHandle("@")).toBeNull();
  });

  it("returns null rather than throwing on a malformed escape", () => {
    // A stray % would otherwise turn a bad URL into a 500.
    expect(() => parseHandle("%")).not.toThrow();
    expect(parseHandle("%")).toBeNull();
    expect(parseHandle("%zz")).toBeNull();
    expect(parseHandle("%40lucia%")).toBeNull();
  });

  it("rejects a path traversal attempt", () => {
    expect(parseHandle("%40..%2Fsettings")).toBeNull();
    expect(parseHandle("..")).toBeNull();
  });
});

describe("handlePath", () => {
  it("builds the canonical path", () => {
    expect(handlePath("lucia")).toBe("/@lucia");
  });

  it("round-trips through parseHandle", () => {
    for (const name of ["lucia", "abc", "reader_2026"]) {
      expect(parseHandle(encodeURIComponent(handlePath(name).slice(1)))).toBe(name);
    }
  });
});

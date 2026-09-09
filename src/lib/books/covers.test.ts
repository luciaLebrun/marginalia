import { describe, expect, it } from "vitest";

import { coverUrl } from "./covers";

describe("coverUrl", () => {
  it("builds a CoverID URL, which is the unrestricted path", () => {
    expect(coverUrl(240727, "L")).toBe(
      "https://covers.openlibrary.org/b/id/240727-L.jpg",
    );
  });

  it("defaults to medium", () => {
    expect(coverUrl(240727)).toBe(
      "https://covers.openlibrary.org/b/id/240727-M.jpg",
    );
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["zero", 0],
    ["negative", -1],
    ["non-integer", 12.5],
  ])("returns null for %s so callers must render a placeholder", (_label, input) => {
    expect(coverUrl(input as number | null | undefined)).toBeNull();
  });

  it("never emits an ISBN-addressed URL, which is rate limited to 100/IP/5min", () => {
    for (const size of ["S", "M", "L"] as const) {
      const url = coverUrl(240727, size);
      expect(url).not.toBeNull();
      expect(url).toContain("/b/id/");
      expect(url).not.toContain("/b/isbn/");
    }
  });
});

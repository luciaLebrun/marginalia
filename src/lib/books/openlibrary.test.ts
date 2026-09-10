import { describe, expect, it } from "vitest";

import searchFixture from "../../../tests/fixtures/openlibrary-search-dune.json";
import workFixture from "../../../tests/fixtures/openlibrary-work-dune.json";
import redirectFixture from "../../../tests/fixtures/openlibrary-work-redirect.json";
import {
  normalizeDescription,
  normalizeSearchResponse,
  normalizeWorkResponse,
  pickIsbn13,
  redirectTarget,
  stripWorkPrefix,
} from "./openlibrary";

describe("stripWorkPrefix", () => {
  it("strips the /works/ prefix", () => {
    expect(stripWorkPrefix("/works/OL893415W")).toBe("OL893415W");
  });

  it("is idempotent on an already-bare key", () => {
    expect(stripWorkPrefix("OL893415W")).toBe("OL893415W");
  });
});

describe("pickIsbn13", () => {
  it("picks the 13-digit ISBN out of a mixed array", () => {
    expect(pickIsbn13(["0441013597", "9780441013593"])).toBe("9780441013593");
  });

  it("returns undefined when there is no ISBN-13", () => {
    expect(pickIsbn13(["0441013597"])).toBeUndefined();
  });

  it("tolerates a missing or malformed field", () => {
    expect(pickIsbn13(undefined)).toBeUndefined();
    expect(pickIsbn13("9780441013593")).toBeUndefined();
  });
});

describe("normalizeSearchResponse", () => {
  const results = normalizeSearchResponse(searchFixture);

  it("drops docs missing a key or a title rather than half-rendering them", () => {
    // The fixture has 5 docs; 2 are malformed.
    expect(searchFixture.docs).toHaveLength(5);
    expect(results).toHaveLength(3);
  });

  it("maps a complete doc onto our shape", () => {
    expect(results[0]).toEqual({
      olWorkKey: "OL893415W",
      title: "Dune",
      subtitle: undefined,
      authors: ["Frank Herbert"],
      firstPublishYear: 1965,
      coverId: 240727,
      editionCount: 312,
      isbn13: "9780441013593",
    });
  });

  it("preserves a subtitle when present", () => {
    expect(results[1].subtitle).toBe("Book Two of the Dune Chronicles");
  });

  it("leaves coverId undefined when the work has no cover", () => {
    expect(results[2].coverId).toBeUndefined();
  });

  it("returns [] for a malformed body instead of throwing", () => {
    expect(normalizeSearchResponse(null)).toEqual([]);
    expect(normalizeSearchResponse({})).toEqual([]);
    expect(normalizeSearchResponse({ docs: "nope" })).toEqual([]);
  });
});

describe("normalizeDescription", () => {
  it("unwraps the { type, value } form Open Library often returns", () => {
    expect(normalizeDescription({ type: "/type/text", value: "  hello  " })).toBe(
      "hello",
    );
  });

  it("accepts a bare string", () => {
    expect(normalizeDescription("hello")).toBe("hello");
  });

  it("returns undefined for empty or absent descriptions", () => {
    expect(normalizeDescription("   ")).toBeUndefined();
    expect(normalizeDescription(undefined)).toBeUndefined();
    expect(normalizeDescription({ value: 42 })).toBeUndefined();
  });
});

describe("normalizeWorkResponse", () => {
  const summary = normalizeSearchResponse(searchFixture)[0];

  it("merges the work description onto the search summary", () => {
    const detail = normalizeWorkResponse(summary, workFixture);
    expect(detail.title).toBe("Dune");
    expect(detail.description).toContain("Arrakis");
    expect(detail.source).toBe("openlibrary");
  });

  it("keeps the search coverId when there is one", () => {
    expect(normalizeWorkResponse(summary, workFixture).coverId).toBe(240727);
  });

  it("falls back to the first VALID work cover, skipping the -1 sentinel", () => {
    // Open Library uses -1 in `covers` to mean "no cover here".
    const detail = normalizeWorkResponse(
      { ...summary, coverId: undefined },
      workFixture,
    );
    expect(detail.coverId).toBe(240727);
  });

  it("survives an empty work body", () => {
    const detail = normalizeWorkResponse(summary, {});
    expect(detail.description).toBeUndefined();
    expect(detail.title).toBe("Dune");
  });
});

describe("redirectTarget", () => {
  it("returns the bare target key for a real redirect stub", () => {
    // Open Library leaves these behind whenever it merges duplicate works.
    expect(redirectTarget(redirectFixture)).toBe("OL893414W");
  });

  it("returns null for a real work", () => {
    expect(redirectTarget(workFixture)).toBeNull();
  });

  it("returns null for a redirect with no location", () => {
    expect(redirectTarget({ type: { key: "/type/redirect" } })).toBeNull();
    expect(
      redirectTarget({ type: { key: "/type/redirect" }, location: "" }),
    ).toBeNull();
  });

  it("tolerates junk", () => {
    expect(redirectTarget(null)).toBeNull();
    expect(redirectTarget({})).toBeNull();
    expect(redirectTarget({ type: "redirect", location: "/works/OL1W" })).toBeNull();
  });
});

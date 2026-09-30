import { describe, expect, it } from "vitest";

import { categoryFromBisac, categoryFromSubjects } from "./category";

/** Real `categories` and `subjects` values, probed live 2026-09-24. */

describe("categoryFromBisac", () => {
  it("keeps the second level, where the genre is", () => {
    expect(categoryFromBisac(["Fiction / Science Fiction / General"])).toBe("Science Fiction");
    expect(categoryFromBisac(["Social Science / Anthropology / General"])).toBe("Anthropology");
  });

  it("falls back to the top level when the second is General or absent", () => {
    expect(categoryFromBisac(["Philosophy / General"])).toBe("Philosophy");
    expect(categoryFromBisac(["Fiction"])).toBe("Fiction");
  });

  it("keeps one category: the first with a real second level", () => {
    expect(categoryFromBisac(["Fiction / General", "Fiction / Literary"])).toBe("Literary");
    expect(
      categoryFromBisac(["Fiction / Coming of Age", "Fiction / Literary", "Fiction / Psychological"]),
    ).toBe("Coming of Age");
  });

  it("has nothing to say about a missing or malformed value", () => {
    expect(categoryFromBisac(undefined)).toBeUndefined();
    expect(categoryFromBisac([])).toBeUndefined();
    expect(categoryFromBisac([42, ""])).toBeUndefined();
  });
});

describe("categoryFromSubjects", () => {
  it("finds the genre among Open Library's noise", () => {
    // Dune: the genre is the third subject, after a place name and "Fiction".
    expect(
      categoryFromSubjects(["Dune (Imaginary place)", "Fiction", "Fiction, science fiction, general", "nyt:mass-market-monthly=2021-11-07"]),
    ).toBe("Science Fiction");
    expect(categoryFromSubjects(["sex", "romance", "contemporary", "fiction"])).toBe("Romance");
  });

  it("lets the genre most subjects name win, since Open Library tags both", () => {
    // A Wizard of Earthsea.
    expect(
      categoryFromSubjects(["Fantasy", "Science fiction", "Fantasy fiction", "Fiction, fantasy, general"]),
    ).toBe("Fantasy");
    // The Left Hand of Darkness.
    expect(
      categoryFromSubjects(["Science fiction", "Fiction, science fiction, general", "American Science fiction", "Fantasy"]),
    ).toBe("Science Fiction");
  });

  it("files a novel as Fiction before the non-fiction subjects it is also tagged with", () => {
    // L'étranger.
    expect(categoryFromSubjects(["Philosophical Novels", "Murder", "Fiction", "Social conditions"])).toBe("Fiction");
  });

  it("does not read Non-Fiction as Fiction", () => {
    // Sapiens.
    expect(
      categoryFromSubjects(["Human beings", "Civilization", "World history", "History", "Non-Fiction", "SCIENCE / Life Sciences / General"]),
    ).toBe("History");
  });

  it("has nothing to say when no rule matches", () => {
    expect(categoryFromSubjects(["Dublin (ireland)", "Physicists"])).toBeUndefined();
    expect(categoryFromSubjects(undefined)).toBeUndefined();
  });
});

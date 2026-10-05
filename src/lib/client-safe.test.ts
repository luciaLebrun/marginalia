import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { bookPath, matchesFilter, publishedLabel, showsFilter } from "./client-safe";

describe("bookPath", () => {
  it("addresses the book page by bare work key", () => {
    expect(bookPath("OL893414W")).toBe("/book/OL893414W");
  });
});

describe("publishedLabel", () => {
  /* Open Library dates the work, Google the edition it happens to hold. */
  it("says what the year under it means", () => {
    expect(publishedLabel("OL893414W")).toBe("First published");
    expect(publishedLabel("gb:B1hSG45JCX4C")).toBe("Published");
  });

  /*
   * The imprint, the search cell's spoken label and the share postcard all
   * print this year. The postcard is the one built to be sent to someone.
   */
  it("is what every surface printing a year asks", () => {
    for (const name of ["SearchResult", "ReviewPostcard"]) {
      const source = readFileSync(
        path.join(__dirname, "..", "components", `${name}.tsx`),
        "utf8",
      );
      expect(source).not.toMatch(/First published \{/);
      expect(source).toContain("publishedLabel");
    }
  });
});

describe("matchesFilter", () => {
  const book = { title: "Le Piranèse", authors: ["Susanna Clarke", "Émile Zola"] };

  it("folds case and accents on both sides", () => {
    expect(matchesFilter(book, "PIRANESE")).toBe(true);
    expect(matchesFilter(book, "emile")).toBe(true);
    expect(matchesFilter({ title: "Piranesi", authors: [] }, "Piranèse".slice(0, 6))).toBe(true);
  });

  it("needs every word, found in the title or an author", () => {
    expect(matchesFilter(book, "clarke piranese")).toBe(true);
    expect(matchesFilter(book, "clarke dune")).toBe(false);
  });

  it("matches everything when blank", () => {
    expect(matchesFilter(book, "  ")).toBe(true);
  });
});

describe("showsFilter", () => {
  it("appears from eight books, and never leaves while it holds text", () => {
    expect(showsFilter(7, "")).toBe(false);
    expect(showsFilter(8, "")).toBe(true);
    expect(showsFilter(3, "dune")).toBe(true);
  });
});

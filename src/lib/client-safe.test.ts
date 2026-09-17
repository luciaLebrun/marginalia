import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { bookPath, publishedLabel } from "./client-safe";

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

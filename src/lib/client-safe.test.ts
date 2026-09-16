import { describe, expect, it } from "vitest";

import { bookPath } from "./client-safe";

describe("bookPath", () => {
  it("addresses the book page by bare work key", () => {
    expect(bookPath("OL893414W")).toBe("/book/OL893414W");
  });
});

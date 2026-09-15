import { describe, expect, it } from "vitest";

import { BIO_MAX, NAME_MAX, accountSchema } from "./account";

const valid = { name: "Lucia", username: "lucia", bio: "Mostly science fiction." };

/** The first issue's message, which is what the action surfaces. */
function refusal(input: Record<string, unknown>): string | null {
  const parsed = accountSchema.safeParse(input);
  return parsed.success ? null : parsed.error.issues[0].message;
}

describe("accountSchema", () => {
  it("accepts a filled sheet", () => {
    const parsed = accountSchema.parse(valid);
    expect(parsed).toEqual(valid);
  });

  it("trims every field", () => {
    const parsed = accountSchema.parse({
      name: "  Lucia  ",
      username: "  lucia ",
      bio: "  Mostly science fiction.  ",
    });
    expect(parsed).toEqual(valid);
  });

  /*
   * Empty and absent are the same thing. A reader who clears their bio has
   * removed it, so it must reach the database as null and not as "".
   */
  it("normalizes an empty bio to null", () => {
    expect(accountSchema.parse({ ...valid, bio: "" }).bio).toBeNull();
    expect(accountSchema.parse({ ...valid, bio: "   " }).bio).toBeNull();
  });

  it("keeps a bio at the limit and refuses one past it", () => {
    expect(accountSchema.parse({ ...valid, bio: "x".repeat(BIO_MAX) }).bio).toHaveLength(
      BIO_MAX,
    );
    expect(refusal({ ...valid, bio: "x".repeat(BIO_MAX + 1) })).toMatch(/at most/);
  });

  it("requires a name", () => {
    expect(refusal({ ...valid, name: "" })).toBe("Your diary needs a name on it.");
    expect(refusal({ ...valid, name: "     " })).toBe("Your diary needs a name on it.");
  });

  it("refuses a name past the limit", () => {
    expect(refusal({ ...valid, name: "x".repeat(NAME_MAX + 1) })).toMatch(/at most/);
  });

  /*
   * The username rules are not restated here — they live in usernameError, and
   * the schema borrows its wording so the form says the same thing whichever
   * path refused it.
   */
  it("borrows the username rules and their wording", () => {
    expect(refusal({ ...valid, username: "ab" })).toBe(
      "Usernames are at least 3 characters.",
    );
    expect(refusal({ ...valid, username: "settings" })).toBe("That one is reserved.");
    expect(refusal({ ...valid, username: "1lucia" })).toBe("Start with a letter.");
    expect(refusal({ ...valid, username: "lucia__reads" })).toBe(
      "One underscore at a time.",
    );
  });

  it("forgives an @ and stray case in the username, as the claim form does", () => {
    expect(accountSchema.parse({ ...valid, username: "@Lucia" }).username).toBe("@Lucia");
    // The schema validates shape; normalizeUsername in updateAccount folds it.
    expect(refusal({ ...valid, username: "@Lucia" })).toBeNull();
  });

  it("reports the offending field so the error can land on its own row", () => {
    const parsed = accountSchema.safeParse({ ...valid, username: "settings" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues[0].path[0]).toBe("username");
  });
});

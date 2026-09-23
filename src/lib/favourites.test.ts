import { afterEach, describe, expect, it, vi } from "vitest";

/*
 * The refusals a real database only gives up under a race — two tabs adding at
 * once, or a book deleted mid-request — mapped from their SQLSTATE. Driven by a
 * stubbed driver, because the integration suite cannot stage those races.
 */
const execute = vi.fn();
vi.mock("@/db", () => ({ getDb: () => ({ execute }), schema: { favourite: {}, log: {} } }));

const { addFavourite } = await import("./favourites");

const fail = (code: string) => Object.assign(new Error("db"), { cause: { code } });

afterEach(() => execute.mockReset());

describe("addFavourite refusals", () => {
  it.each([
    ["23514", "full"],
    ["23505", "conflict"],
    ["23503", "missing"],
  ])("maps SQLSTATE %s to %s", async (code, reason) => {
    execute.mockRejectedValue(fail(code));
    await expect(addFavourite("reader", "book")).resolves.toEqual({ ok: false, reason });
  });

  it("lets any other database error through", async () => {
    execute.mockRejectedValue(fail("08006"));
    await expect(addFavourite("reader", "book")).rejects.toThrow("db");
  });
});

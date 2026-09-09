import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL = process.env.DATABASE_URL;

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = ORIGINAL;
});

describe("getDb", () => {
  it("does not touch DATABASE_URL at import time, so `next build` works", async () => {
    delete process.env.DATABASE_URL;
    // The import itself must not throw — only calling getDb() may.
    await expect(import("./index")).resolves.toBeDefined();
  });

  it("throws an actionable error when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL;
    const { getDb } = await import("./index");
    expect(() => getDb()).toThrow(/DATABASE_URL is not set/);
    expect(() => getDb()).toThrow(/\.env\.example/);
  });

  it("builds the client once and reuses it", async () => {
    process.env.DATABASE_URL =
      "postgresql://u:p@ep-test.eu-central-1.aws.neon.tech/marginalia?sslmode=require";
    const { getDb } = await import("./index");
    expect(getDb()).toBe(getDb());
  });
});

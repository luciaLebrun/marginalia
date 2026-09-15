import { afterEach, describe, expect, it } from "vitest";

import { isOwner, ownerIsConfigured } from "./owner";

const ORIGINAL = process.env.MARGINALIA_OWNER_EMAIL;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.MARGINALIA_OWNER_EMAIL;
  else process.env.MARGINALIA_OWNER_EMAIL = ORIGINAL;
});

describe("isOwner", () => {
  it("recognises the configured owner", () => {
    process.env.MARGINALIA_OWNER_EMAIL = "lucia@example.com";
    expect(isOwner("lucia@example.com")).toBe(true);
  });

  it("ignores case and surrounding space on both sides", () => {
    process.env.MARGINALIA_OWNER_EMAIL = "  Lucia@Example.com  ";
    expect(isOwner("LUCIA@example.COM ")).toBe(true);
  });

  it("accepts a comma-separated list", () => {
    process.env.MARGINALIA_OWNER_EMAIL = "a@example.com,b@example.com";
    expect(isOwner("b@example.com")).toBe(true);
  });

  it("rejects anyone not on the list", () => {
    process.env.MARGINALIA_OWNER_EMAIL = "lucia@example.com";
    expect(isOwner("someone@example.com")).toBe(false);
  });

  /*
   * The important one. An unset variable must close the door, not open it —
   * a deployment that forgot to configure an owner should mint nothing at all
   * rather than let every member mint.
   */
  it("fails closed when no owner is configured", () => {
    delete process.env.MARGINALIA_OWNER_EMAIL;
    expect(isOwner("lucia@example.com")).toBe(false);
    expect(ownerIsConfigured()).toBe(false);
  });

  it("fails closed on an empty or comma-only value", () => {
    process.env.MARGINALIA_OWNER_EMAIL = " , ,";
    expect(isOwner("lucia@example.com")).toBe(false);
    expect(ownerIsConfigured()).toBe(false);
  });

  it("rejects a missing email even when an owner is configured", () => {
    process.env.MARGINALIA_OWNER_EMAIL = "lucia@example.com";
    expect(isOwner(null)).toBe(false);
    expect(isOwner(undefined)).toBe(false);
    expect(isOwner("")).toBe(false);
  });

  it("reads the environment at call time, not at import", () => {
    delete process.env.MARGINALIA_OWNER_EMAIL;
    expect(isOwner("lucia@example.com")).toBe(false);
    process.env.MARGINALIA_OWNER_EMAIL = "lucia@example.com";
    expect(isOwner("lucia@example.com")).toBe(true);
  });
});

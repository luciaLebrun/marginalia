import { afterEach, describe, expect, it } from "vitest";

import { bootstrapAllowed } from "./bootstrap";

const OWNER = "lucia@example.com";
const ORIGINAL = process.env.MARGINALIA_OWNER_EMAIL;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.MARGINALIA_OWNER_EMAIL;
  else process.env.MARGINALIA_OWNER_EMAIL = ORIGINAL;
});

describe("bootstrapAllowed", () => {
  it("lets the configured owner in when nobody has an account", () => {
    process.env.MARGINALIA_OWNER_EMAIL = OWNER;
    expect(bootstrapAllowed(OWNER, false)).toBe(true);
  });

  /*
   * The one that stops this being "whoever finds the URL first owns the app".
   * Google has already proved the visitor owns the address by the time this
   * runs, so the comparison is against a verified email, not a claimed one.
   */
  it("refuses a stranger even when nobody has an account", () => {
    process.env.MARGINALIA_OWNER_EMAIL = OWNER;
    expect(bootstrapAllowed("someone@example.com", false)).toBe(false);
  });

  /*
   * Fails closed. A deployment that forgot to configure an owner must stay
   * shut, not stand open to the first arrival.
   */
  it("refuses everyone when no owner is configured", () => {
    delete process.env.MARGINALIA_OWNER_EMAIL;
    expect(bootstrapAllowed(OWNER, false)).toBe(false);
    expect(bootstrapAllowed("anyone@example.com", false)).toBe(false);
  });

  it("refuses an absent email", () => {
    process.env.MARGINALIA_OWNER_EMAIL = OWNER;
    expect(bootstrapAllowed(null, false)).toBe(false);
    expect(bootstrapAllowed(undefined, false)).toBe(false);
    expect(bootstrapAllowed("", false)).toBe(false);
  });

  /*
   * The door closes on the first account and never reopens while one exists —
   * including for the owner, who then needs a code like everybody else.
   */
  it("closes for everyone once any account exists", () => {
    process.env.MARGINALIA_OWNER_EMAIL = OWNER;
    expect(bootstrapAllowed(OWNER, true)).toBe(false);
    expect(bootstrapAllowed("someone@example.com", true)).toBe(false);
  });

  it("checks occupancy before identity, so a populated app never consults the owner list", () => {
    delete process.env.MARGINALIA_OWNER_EMAIL;
    expect(bootstrapAllowed(OWNER, true)).toBe(false);
  });

  it("matches the owner case-insensitively, as isOwner does", () => {
    process.env.MARGINALIA_OWNER_EMAIL = OWNER;
    expect(bootstrapAllowed("LUCIA@Example.com ", false)).toBe(true);
  });
});

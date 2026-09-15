import { afterEach, describe, expect, it } from "vitest";

import { PREVIEW_ORIGIN_PATTERN, trustedOrigins } from "./trusted-origins";

const ORIGINAL = process.env.VERCEL_ENV;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = ORIGINAL;
});

describe("trustedOrigins", () => {
  /*
   * The one that matters. Production is the environment where a forwarded
   * session would be worth stealing, and it is the one environment that never
   * needs the proxy — so it trusts nothing extra, rather than merely not
   * exercising the trust it holds.
   */
  it("trusts nothing extra in production", () => {
    process.env.VERCEL_ENV = "production";
    expect(trustedOrigins()).toEqual([]);
  });

  it("trusts preview deployments on preview", () => {
    process.env.VERCEL_ENV = "preview";
    expect(trustedOrigins()).toEqual([PREVIEW_ORIGIN_PATTERN]);
  });

  it("trusts them in local development too, where VERCEL_ENV is unset", () => {
    delete process.env.VERCEL_ENV;
    expect(trustedOrigins()).toEqual([PREVIEW_ORIGIN_PATTERN]);
  });

  it("reads the environment at call time, not at import", () => {
    process.env.VERCEL_ENV = "preview";
    expect(trustedOrigins()).toHaveLength(1);
    process.env.VERCEL_ENV = "production";
    expect(trustedOrigins()).toHaveLength(0);
  });
});

/*
 * Better Auth compiles a trusted-origin pattern to an anchored regex and tests
 * it against the request's *origin*, with `*` unable to cross a `/`. Its
 * matcher is internal and cannot be imported, so these assert the properties of
 * the pattern that make it safe under those rules, rather than re-implementing
 * the matcher and testing the re-implementation.
 */
describe("the preview origin pattern", () => {
  it("is TLS only", () => {
    expect(PREVIEW_ORIGIN_PATTERN.startsWith("https://")).toBe(true);
  });

  it("is anchored to this project at the front", () => {
    expect(PREVIEW_ORIGIN_PATTERN.startsWith("https://marginalia-")).toBe(true);
  });

  it("is anchored to this account at the back", () => {
    expect(PREVIEW_ORIGIN_PATTERN.endsWith("-lucialebruns-projects.vercel.app")).toBe(
      true,
    );
  });

  /*
   * A bare `https://*.vercel.app` would trust every deployment on Vercel,
   * belonging to anyone. The wildcard must sit between two fixed anchors so
   * only Vercel can issue a host that satisfies it.
   */
  it("has exactly one wildcard, and it is not the whole host", () => {
    expect([...PREVIEW_ORIGIN_PATTERN].filter((c) => c === "*")).toHaveLength(1);
    expect(PREVIEW_ORIGIN_PATTERN).not.toContain("://*");
    expect(PREVIEW_ORIGIN_PATTERN).not.toContain("*.");
  });

  it("carries no path, so only the origin is ever compared", () => {
    expect(PREVIEW_ORIGIN_PATTERN.slice("https://".length)).not.toContain("/");
  });
});

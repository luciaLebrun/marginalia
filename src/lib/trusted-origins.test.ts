import { afterEach, describe, expect, it } from "vitest";

import { PREVIEW_ORIGIN_PATTERN, requestOrigin, trustedOrigins } from "./trusted-origins";

const KEYS = ["VERCEL_ENV"] as const;
const ORIGINAL = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const k of KEYS) {
    if (ORIGINAL[k] === undefined) delete process.env[k];
    else process.env[k] = ORIGINAL[k];
  }
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

/*
 * The bug this exists for: sign-in began on the per-deployment host, Google was
 * sent to BETTER_AUTH_URL, and the callback landed on the branch alias — a host
 * that had never seen the state cookie. "State not persisted correctly".
 */
describe("requestOrigin", () => {
  const of = (h: Record<string, string>) => requestOrigin(new Headers(h));

  it("names the host the reader is on, not the one the alias points at", () => {
    expect(
      of({
        "x-forwarded-proto": "https",
        "x-forwarded-host": "marginalia-pnfrko59y-lucialebruns-projects.vercel.app",
      }),
    ).toBe("https://marginalia-pnfrko59y-lucialebruns-projects.vercel.app");
  });

  it("prefers the forwarded host, which is the one in the address bar", () => {
    expect(
      of({
        "x-forwarded-proto": "https",
        "x-forwarded-host": "marginalia-roan.vercel.app",
        host: "marginalia-emf7squhc-lucialebruns-projects.vercel.app",
      }),
    ).toBe("https://marginalia-roan.vercel.app");
  });

  it("keeps the scheme it was given, so local development stays http", () => {
    expect(of({ "x-forwarded-proto": "http", host: "localhost:3000" })).toBe(
      "http://localhost:3000",
    );
  });

  /* Half a host is a guess, and guessing is the whole bug. */
  it("declines rather than guess when the headers are not there", () => {
    expect(of({})).toBeUndefined();
    expect(of({ host: "marginalia-roan.vercel.app" })).toBeUndefined();
    expect(of({ "x-forwarded-proto": "https" })).toBeUndefined();
  });
});

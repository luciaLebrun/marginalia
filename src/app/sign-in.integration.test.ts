import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * The door's server action, end to end as far as Google. Better Auth returns a
 * Response instead of `{ url }` whenever it is handed a request, and a request
 * is exactly what the action hands it on every deployment — so this runs with
 * the forwarded headers Vercel sends, not the bare ones local dev has.
 */

let forwarded: Record<string, string> = {};

// CI carries no Google credentials. Nothing here talks to Google — building
// the authorization URL only needs something in each slot.
vi.stubEnv("GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID || "test-client-id");
vi.stubEnv("GOOGLE_CLIENT_SECRET", process.env.GOOGLE_CLIENT_SECRET || "test-secret");
vi.stubEnv("BETTER_AUTH_URL", process.env.BETTER_AUTH_URL || "http://localhost:3000");
vi.stubEnv("BETTER_AUTH_SECRET", process.env.BETTER_AUTH_SECRET || "a".repeat(32));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(forwarded),
  cookies: async () => ({ set: () => {} }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

const { beginSignInAction } = await import("./actions");

describe("beginSignInAction", () => {
  beforeEach(() => {
    forwarded = {};
  });

  it("sends a reader on a deployment to Google", async () => {
    forwarded = {
      "x-forwarded-proto": "https",
      "x-forwarded-host": "marginalia-git-x-lucialebruns-projects.vercel.app",
    };
    await expect(beginSignInAction({ error: null }, new FormData())).rejects.toThrow(
      /^REDIRECT https:\/\/accounts\.google\.com\//,
    );
  });

  it("sends a reader with no forwarding headers to Google too", async () => {
    await expect(beginSignInAction({ error: null }, new FormData())).rejects.toThrow(
      /^REDIRECT https:\/\/accounts\.google\.com\//,
    );
  });
});

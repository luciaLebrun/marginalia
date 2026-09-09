import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { getDb, schema } from "@/db";
import { createInviteCodes, enforceInvite } from "./invite";

/**
 * Proves the signup gate actually blocks account creation — the single
 * security property this app depends on. Everything else here is a reading
 * diary; this is the lock on the door.
 *
 * The production instance gates Google OAuth, which cannot be driven
 * headlessly. So this builds a parallel Better Auth instance with the *same*
 * databaseHooks wiring but email/password enabled, and drives it through the
 * real server API against the real database. What it verifies is the part that
 * could silently break: that a throwing `before` hook aborts the whole
 * sign-up rather than being logged and ignored.
 */
const url = process.env.DATABASE_URL ?? "";
const hasRealDb = url.length > 0 && !url.includes("placeholder");

const OWNER = "_it_gate_owner";

/** The invite code this instance will present, swapped per test. */
let presentedCode: string | undefined;

function buildTestAuth() {
  return betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema,
      transaction: false,
    }),
    secret: "test-secret-not-used-for-anything-real-0000",
    baseURL: "http://localhost:3000",
    // Enabled ONLY here, so the gate can be driven without Google.
    emailAndPassword: { enabled: true },
    databaseHooks: {
      user: {
        create: {
          async before(user) {
            await enforceInvite(presentedCode);
            return { data: user };
          },
        },
      },
    },
  });
}

async function attemptSignUp(email: string) {
  return buildTestAuth().api.signUpEmail({
    body: { email, password: "a-long-enough-password", name: "Applicant" },
  });
}

async function userExists(email: string) {
  const rows = await getDb()
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.email, email));
  return rows.length > 0;
}

async function purge(email: string) {
  await getDb().delete(schema.user).where(eq(schema.user.email, email));
}

describe.skipIf(!hasRealDb)("signup gate (integration)", () => {
  beforeAll(async () => {
    await getDb()
      .insert(schema.user)
      .values({ id: OWNER, name: "Owner", email: "owner@gate.test" })
      .onConflictDoNothing();
  });

  afterEach(() => {
    presentedCode = undefined;
  });

  afterAll(async () => {
    await getDb()
      .delete(schema.inviteCode)
      .where(eq(schema.inviteCode.createdBy, OWNER));
    await getDb().delete(schema.user).where(eq(schema.user.id, OWNER));
  });

  it("refuses an account when no invite code is presented", async () => {
    const email = "nocode@gate.test";
    presentedCode = undefined;

    await expect(attemptSignUp(email)).rejects.toThrow();
    // The important half: no row was left behind.
    await expect(userExists(email)).resolves.toBe(false);
    await purge(email);
  });

  it("refuses an account for a code that was never issued", async () => {
    const email = "badcode@gate.test";
    presentedCode = "ZZZZ-ZZZZ";

    await expect(attemptSignUp(email)).rejects.toThrow();
    await expect(userExists(email)).resolves.toBe(false);
    await purge(email);
  });

  it("refuses an account for an expired code", async () => {
    const email = "expired@gate.test";
    [presentedCode] = await createInviteCodes(OWNER, 1, -1);

    await expect(attemptSignUp(email)).rejects.toThrow();
    await expect(userExists(email)).resolves.toBe(false);
    await purge(email);
  });

  it("creates the account when a valid code is presented", async () => {
    const email = "valid@gate.test";
    [presentedCode] = await createInviteCodes(OWNER, 1);

    await expect(attemptSignUp(email)).resolves.toBeTruthy();
    await expect(userExists(email)).resolves.toBe(true);
    await purge(email);
  });

  it("burns the code, so the same invite cannot admit a second person", async () => {
    const first = "first@gate.test";
    const second = "second@gate.test";
    [presentedCode] = await createInviteCodes(OWNER, 1);

    await expect(attemptSignUp(first)).resolves.toBeTruthy();
    // Same code, different person.
    await expect(attemptSignUp(second)).rejects.toThrow();

    await expect(userExists(first)).resolves.toBe(true);
    await expect(userExists(second)).resolves.toBe(false);

    await purge(first);
    await purge(second);
  });
});

import { eq, inArray } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { getDb, schema } from "@/db";
import { claimUsername, findByUsername, isUsernameAvailable } from "./profile";

/**
 * A username is claimed once, is permanent, and becomes a public URL. The two
 * races that matter can only be tested against a real database, because what
 * makes them safe is the unique index and the WHERE clause, not the code.
 */
const url = process.env.DATABASE_URL ?? "";
const hasRealDb = url.length > 0 && !url.includes("placeholder");

const A = "_it_name_a";
const B = "_it_name_b";
const IDS = [A, B];

async function reset() {
  await getDb()
    .update(schema.user)
    .set({ username: null })
    .where(inArray(schema.user.id, IDS));
}

describe.skipIf(!hasRealDb)("username claim (integration)", () => {
  beforeAll(async () => {
    await getDb()
      .insert(schema.user)
      .values([
        { id: A, name: "Reader A", email: "a@name.test" },
        { id: B, name: "Reader B", email: "b@name.test" },
      ])
      .onConflictDoNothing();
  });

  afterEach(reset);

  afterAll(async () => {
    for (const id of IDS) {
      await getDb().delete(schema.user).where(eq(schema.user.id, id));
    }
  });

  it("claims a free username and normalizes it on the way in", async () => {
    await expect(claimUsername(A, "  @ItLucia ")).resolves.toEqual({
      ok: true,
      username: "itlucia",
    });

    const [row] = await getDb()
      .select({ username: schema.user.username })
      .from(schema.user)
      .where(eq(schema.user.id, A));
    expect(row.username).toBe("itlucia");
  });

  it("refuses an invalid username without touching the row", async () => {
    await expect(claimUsername(A, "ab")).resolves.toEqual({
      ok: false,
      reason: "invalid",
    });
    await expect(claimUsername(A, "admin")).resolves.toEqual({
      ok: false,
      reason: "invalid",
    });

    const [row] = await getDb()
      .select({ username: schema.user.username })
      .from(schema.user)
      .where(eq(schema.user.id, A));
    expect(row.username).toBeNull();
  });

  it("refuses a name another reader already has", async () => {
    await claimUsername(A, "ittaken");
    await expect(claimUsername(B, "ittaken")).resolves.toEqual({
      ok: false,
      reason: "taken",
    });
  });

  it("refuses a second claim by the same reader, so a handle is permanent", async () => {
    await claimUsername(A, "itfirst");
    await expect(claimUsername(A, "itsecond")).resolves.toEqual({
      ok: false,
      reason: "already-claimed",
    });

    const [row] = await getDb()
      .select({ username: schema.user.username })
      .from(schema.user)
      .where(eq(schema.user.id, A));
    expect(row.username).toBe("itfirst");
  });

  it("lets exactly one of five concurrent claims on one name win", async () => {
    // Two readers, five attempts, one name. The unique index is what decides.
    const results = await Promise.all([
      claimUsername(A, "itrace"),
      claimUsername(B, "itrace"),
      claimUsername(A, "itrace"),
      claimUsername(B, "itrace"),
      claimUsername(A, "itrace"),
    ]);

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await findByUsername("itrace")).not.toBeNull();
  });

  it("lets one reader's two simultaneous claims produce one username", async () => {
    const results = await Promise.all([
      claimUsername(A, "itonly"),
      claimUsername(A, "itother"),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
  });

  it("reports availability, and stops reporting it once claimed", async () => {
    await expect(isUsernameAvailable("itfree")).resolves.toBe(true);
    await claimUsername(A, "itfree");
    await expect(isUsernameAvailable("itfree")).resolves.toBe(false);
    await expect(isUsernameAvailable("ITFREE")).resolves.toBe(false);
  });

  it("never reports an invalid name as available", async () => {
    await expect(isUsernameAvailable("ab")).resolves.toBe(false);
    await expect(isUsernameAvailable("admin")).resolves.toBe(false);
  });

  it("finds a reader by username, in any case", async () => {
    await claimUsername(A, "itfound");
    const profile = await findByUsername("ITFOUND");
    expect(profile?.id).toBe(A);
    expect(profile?.username).toBe("itfound");
    expect(profile?.name).toBe("Reader A");
  });

  it("returns null for an unclaimed or invalid name", async () => {
    await expect(findByUsername("itnobody")).resolves.toBeNull();
    await expect(findByUsername("admin")).resolves.toBeNull();
    await expect(findByUsername("")).resolves.toBeNull();
  });
});

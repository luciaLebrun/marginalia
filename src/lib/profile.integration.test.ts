import { eq, inArray } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { getDb, schema } from "@/db";
import {
  claimUsername,
  findByUsername,
  isUsernameAvailable,
  updateAccount,
} from "./profile";

/**
 * A username becomes a public URL, and the races that matter can only be tested
 * against a real database — what makes them safe is the unique index and the
 * WHERE clause, not the code.
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

/**
 * The account sheet's single commit. What is being tested is the atomicity the
 * surface promises: three fields, one row, one UPDATE, all or nothing.
 */
describe.skipIf(!hasRealDb)("account update (integration)", () => {
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

  it("writes name, handle and bio together", async () => {
    const result = await updateAccount(A, {
      name: "Renamed",
      username: "itest_renamed",
      bio: "A note.",
    });

    expect(result).toEqual({ ok: true, username: "itest_renamed" });

    const profile = await findByUsername("itest_renamed");
    expect(profile).toMatchObject({ name: "Renamed", bio: "A note." });
  });

  it("moves a handle and frees the old address", async () => {
    await claimUsername(A, "itest_first");
    await updateAccount(A, { name: "Reader A", username: "itest_second", bio: null });

    expect(await findByUsername("itest_first")).toBeNull();
    expect(await findByUsername("itest_second")).not.toBeNull();
    // Freed, not reserved: the whole point of the trade this project made.
    expect(await isUsernameAvailable("itest_first")).toBe(true);
  });

  it("lets a second reader take a handle the first has left", async () => {
    await claimUsername(A, "itest_shared");
    await updateAccount(A, { name: "Reader A", username: "itest_moved", bio: null });

    const taken = await updateAccount(B, {
      name: "Reader B",
      username: "itest_shared",
      bio: null,
    });
    expect(taken).toEqual({ ok: true, username: "itest_shared" });
  });

  /*
   * The coupling is the design, so it is asserted rather than tolerated: a
   * handle collision must leave the name and the bio exactly as they were,
   * never write two of three fields and report a failure.
   */
  it("writes nothing at all when the handle is taken", async () => {
    await claimUsername(B, "itest_theirs");
    await claimUsername(A, "itest_mine");

    const result = await updateAccount(A, {
      name: "Should Not Land",
      username: "itest_theirs",
      bio: "Should not land either.",
    });

    expect(result).toEqual({ ok: false, reason: "taken" });

    const mine = await findByUsername("itest_mine");
    expect(mine).toMatchObject({ name: "Reader A", bio: null });
  });

  it("refuses a handle that cannot be a username without touching the row", async () => {
    await claimUsername(A, "itest_intact");

    const result = await updateAccount(A, {
      name: "Should Not Land",
      username: "settings",
      bio: null,
    });

    expect(result).toEqual({ ok: false, reason: "invalid" });
    expect(await findByUsername("itest_intact")).toMatchObject({ name: "Reader A" });
  });

  it("reports a reader who no longer exists rather than silently succeeding", async () => {
    const result = await updateAccount("_it_ghost", {
      name: "Nobody",
      username: "itest_ghost_name",
      bio: null,
    });
    expect(result).toEqual({ ok: false, reason: "no-such-user" });
  });
});

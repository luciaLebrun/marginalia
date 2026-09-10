import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getDb, schema } from "@/db";
import {
  attributeInviteCode,
  claimInviteCode,
  createInviteCodes,
  isInviteCodeUsable,
  listInvitesWithState,
  releaseInviteCode,
} from "./invite";

/**
 * Hits a real Postgres. The atomic claim is the whole point of this code and
 * cannot be tested against a mock — `UPDATE ... WHERE used_at IS NULL` either
 * serialises in the database or it does not.
 *
 * Skips unless a real DATABASE_URL is present, so CI (which builds with a
 * placeholder) stays green without a database.
 */
const url = process.env.DATABASE_URL ?? "";
const hasRealDb = url.length > 0 && !url.includes("placeholder");

const OWNER = "_it_invite_owner";

describe.skipIf(!hasRealDb)("invite codes (integration)", () => {
  beforeAll(async () => {
    await getDb()
      .insert(schema.user)
      .values({ id: OWNER, name: "Owner", email: "owner@integration.test" })
      .onConflictDoNothing();
  });

  afterAll(async () => {
    await getDb()
      .delete(schema.inviteCode)
      .where(eq(schema.inviteCode.createdBy, OWNER));
    await getDb().delete(schema.user).where(eq(schema.user.id, OWNER));
  });

  it("issues codes in the expected shape", async () => {
    const codes = await createInviteCodes(OWNER, 3);
    expect(codes).toHaveLength(3);
    for (const code of codes) expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(new Set(codes).size).toBe(3);
  });

  it("accepts a fresh code, and normalises how the user typed it", async () => {
    const [code] = await createInviteCodes(OWNER, 1);
    await expect(isInviteCodeUsable(code)).resolves.toBe(true);
    await expect(
      isInviteCodeUsable(code.toLowerCase().replace("-", " ")),
    ).resolves.toBe(true);
  });

  it("rejects a code that was never issued", async () => {
    await expect(isInviteCodeUsable("ZZZZ-ZZZZ")).resolves.toBe(false);
    await expect(claimInviteCode("ZZZZ-ZZZZ")).resolves.toBe(false);
  });

  it("lets exactly one of five concurrent claims win", async () => {
    const [code] = await createInviteCodes(OWNER, 1);

    const results = await Promise.all(
      Array.from({ length: 5 }, () => claimInviteCode(code)),
    );

    expect(results.filter(Boolean)).toHaveLength(1);
    await expect(isInviteCodeUsable(code)).resolves.toBe(false);
    await expect(claimInviteCode(code)).resolves.toBe(false);
  });

  it("records who used a code", async () => {
    const [code] = await createInviteCodes(OWNER, 1);
    await claimInviteCode(code);
    await attributeInviteCode(code, OWNER);

    const row = (await listInvitesWithState(OWNER)).find((r) => r.code === code);
    expect(row?.state).toBe("spent");
    expect(row?.usedAt).toBeInstanceOf(Date);
  });

  it("refuses an expired code", async () => {
    const [code] = await createInviteCodes(OWNER, 1, -1);
    await expect(isInviteCodeUsable(code)).resolves.toBe(false);
    await expect(claimInviteCode(code)).resolves.toBe(false);
  });

  it("can hand back a code whose signup did not complete", async () => {
    const [code] = await createInviteCodes(OWNER, 1);
    expect(await claimInviteCode(code)).toBe(true);

    await releaseInviteCode(code);
    await expect(isInviteCodeUsable(code)).resolves.toBe(true);
  });
});

import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { getDb, schema } from "@/db";
import { deleteAccount } from "./account";
import { createInviteCodes, listInvitesWithState } from "./invite";

/**
 * Deleting is one DELETE that leans entirely on the schema's cascades, so what
 * has to be proven is what the schema does — not what this function says.
 */
const url = process.env.DATABASE_URL ?? "";
const hasRealDb = url.length > 0 && !url.includes("placeholder");

const OWNER = "_it_del_owner";
const GUEST = "_it_del_guest";
const IDS = [OWNER, GUEST];

async function wipe() {
  for (const id of IDS) {
    await getDb().delete(schema.user).where(eq(schema.user.id, id));
  }
}

describe.skipIf(!hasRealDb)("account deletion (integration)", () => {
  beforeEach(async () => {
    await wipe();
    await getDb()
      .insert(schema.user)
      .values([
        { id: OWNER, name: "Owner", email: "owner@del.test" },
        { id: GUEST, name: "Guest", email: "guest@del.test" },
      ]);
  });

  afterAll(wipe);

  it("removes the reader", async () => {
    await deleteAccount(OWNER);

    const rows = await getDb()
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.id, OWNER));

    expect(rows).toHaveLength(0);
  });

  it("takes their sessions with them", async () => {
    await getDb().insert(schema.session).values({
      id: "_it_del_session",
      token: "_it_del_token",
      userId: OWNER,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await deleteAccount(OWNER);

    const rows = await getDb()
      .select({ id: schema.session.id })
      .from(schema.session)
      .where(eq(schema.session.id, "_it_del_session"));

    expect(rows).toHaveLength(0);
  });

  /*
   * An issuer who no longer exists must not leave live doors behind — this is
   * the cascade that actually matters, because invite codes are the only thing
   * gating the app.
   */
  it("takes the invitations they issued with them", async () => {
    await createInviteCodes(OWNER, 2);
    expect(await listInvitesWithState(OWNER)).toHaveLength(2);

    await deleteAccount(OWNER);

    expect(await listInvitesWithState(OWNER)).toHaveLength(0);
  });

  /*
   * The other direction. A code the deleted reader *used* stays spent: its
   * used_by goes null, but used_at does not, so the code cannot be walked
   * through a second time.
   */
  it("leaves a code they consumed spent rather than reopening it", async () => {
    const [code] = await createInviteCodes(OWNER, 1);
    await getDb()
      .update(schema.inviteCode)
      .set({ usedBy: GUEST, usedAt: new Date() })
      .where(eq(schema.inviteCode.code, code));

    await deleteAccount(GUEST);

    const [row] = await listInvitesWithState(OWNER);
    expect(row.state).toBe("spent");
    expect(row.usedByName).toBeNull();
  });
});

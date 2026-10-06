import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getDb, schema } from "@/db";
import { RUN, runKey } from "../../tests/run";
import { getOwnCopy } from "./book-view";

/** MRG-107: the same book under two rows is found, for its own reader only. */
const url = process.env.DATABASE_URL ?? "";
const hasRealDb = url.length > 0 && !url.includes("placeholder");

const KEY = runKey("owncopy");
const READER = `_it_owncopy_reader_${RUN}`;
const OTHER = `_it_owncopy_other_${RUN}`;
const BOOKS = [`_it_owncopy_a_${RUN}`, `_it_owncopy_b_${RUN}`] as const;
const TITLE = `Own Copy ${RUN}`;

const row = (i: 0 | 1) => ({
  id: BOOKS[i],
  sourceKey: i === 0 ? `gb:${KEY}` : `OL99${KEY}0W`,
  title: TITLE,
  authors: ["Same Author"],
});

describe.skipIf(!hasRealDb)("own copy (integration)", () => {
  beforeAll(async () => {
    const db = getDb();
    await db
      .insert(schema.user)
      .values([
        { id: READER, name: "Own", email: `reader-${RUN}@owncopy.test` },
        { id: OTHER, name: "Other", email: `other-${RUN}@owncopy.test` },
      ])
      .onConflictDoNothing();
    await db.insert(schema.book).values([row(0), row(1)]).onConflictDoNothing();
    await db.insert(schema.log).values({ id: `_it_owncopy_log_${RUN}`, userId: READER, bookId: BOOKS[1] });
  });

  afterAll(async () => {
    const db = getDb();
    await db.delete(schema.user).where(inArray(schema.user.id, [READER, OTHER]));
    await db.delete(schema.book).where(inArray(schema.book.id, [...BOOKS]));
  });

  it("finds the other row the reader has logged", async () => {
    await expect(getOwnCopy(READER, { ...row(0), isbn13: null })).resolves.toEqual({
      sourceKey: row(1).sourceKey,
      kind: "read",
    });
  });

  it("finds nothing for a reader who does not have it", async () => {
    await expect(getOwnCopy(OTHER, { ...row(0), isbn13: null })).resolves.toBeNull();
  });
});

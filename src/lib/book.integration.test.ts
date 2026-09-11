import { inArray } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { getDb, schema } from "@/db";
import type { BookDetail } from "@/lib/books";
import { openBook, type BookSources } from "./book";

/**
 * What makes a first open safe is the unique index on ol_work_key and the
 * ON CONFLICT clause, so this runs against a real database. Open Library is
 * never reached: every source is a stand-in, which is also how an outage is
 * staged.
 */
const url = process.env.DATABASE_URL ?? "";
const hasRealDb = url.length > 0 && !url.includes("placeholder");

// Real-shaped work keys no real work will ever be stored under here.
const FRESH = "OL990000001W";
const STUB = "OL990000002W";
const SURVIVOR = "OL990000003W";
const MISSING = "OL990000004W";
const KEYS = [FRESH, STUB, SURVIVOR, MISSING];

function detail(olWorkKey: string, extra: Partial<BookDetail> = {}): BookDetail {
  return {
    olWorkKey,
    title: "An Integration Test",
    authors: ["A. Tester"],
    firstPublishYear: 1965,
    coverId: 240727,
    source: "openlibrary",
    ...extra,
  };
}

/** Sources that hand back `found` and succeed at everything else. */
function sources(found: BookDetail | null): BookSources {
  return {
    fetchWork: vi.fn(async () => found),
    enrich: vi.fn(async (d: BookDetail) => ({
      ...d,
      pageCount: 604,
      source: "openlibrary+google" as const,
    })),
    bandColor: vi.fn(async () => "#8a4b2f"),
  };
}

/** Sources standing in for an Open Library outage. */
function down(): BookSources {
  const fail = async () => {
    throw new TypeError("fetch failed");
  };
  return { fetchWork: vi.fn(fail), enrich: vi.fn(fail), bandColor: vi.fn(fail) };
}

async function rowsFor(...keys: string[]) {
  return getDb()
    .select()
    .from(schema.book)
    .where(inArray(schema.book.olWorkKey, keys));
}

async function reset() {
  await getDb().delete(schema.book).where(inArray(schema.book.olWorkKey, KEYS));
}

describe.skipIf(!hasRealDb)("opening a book (integration)", () => {
  beforeEach(reset);
  afterAll(reset);

  it("copies a book in on first open, enriched and with its band colour", async () => {
    const outcome = await openBook(FRESH, sources(detail(FRESH)));

    expect(outcome.kind).toBe("found");
    if (outcome.kind !== "found") return;
    expect(outcome.book).toMatchObject({
      olWorkKey: FRESH,
      title: "An Integration Test",
      authors: ["A. Tester"],
      coverId: 240727,
      coverColor: "#8a4b2f",
      pageCount: 604,
      source: "openlibrary+google",
    });

    const rows = await rowsFor(FRESH);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(outcome.book.id);
  });

  /*
   * The invariant the table exists for: once a book is ours, Open Library
   * being down changes nothing about opening it.
   */
  it("reads a book it already holds without reaching Open Library at all", async () => {
    const first = await openBook(FRESH, sources(detail(FRESH)));
    const outage = down();

    const again = await openBook(FRESH, outage);

    expect(again).toEqual(first);
    expect(outage.fetchWork).not.toHaveBeenCalled();
    expect(outage.bandColor).not.toHaveBeenCalled();
  });

  it("says unavailable, not not-found, when Open Library is down on a first open", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    const outage = down();

    await expect(openBook(FRESH, outage)).resolves.toEqual({ kind: "unavailable" });

    expect(outage.enrich).not.toHaveBeenCalled();
    expect(await rowsFor(FRESH)).toHaveLength(0);
    quiet.mockRestore();
  });

  it("says not-found, and writes nothing, for a work that does not exist", async () => {
    const none = sources(null);

    await expect(openBook(MISSING, none)).resolves.toEqual({ kind: "not-found" });

    expect(none.bandColor).not.toHaveBeenCalled();
    expect(await rowsFor(MISSING)).toHaveLength(0);
  });

  it("stores a redirect stub's book under the surviving key, never the stub's", async () => {
    const outcome = await openBook(STUB, sources(detail(SURVIVOR)));

    expect(outcome.kind === "found" && outcome.book.olWorkKey).toBe(SURVIVOR);
    expect(await rowsFor(STUB)).toHaveLength(0);
    expect(await rowsFor(SURVIVOR)).toHaveLength(1);
  });

  it("lands on the surviving book already held when opened through its stub", async () => {
    const held = await openBook(SURVIVOR, sources(detail(SURVIVOR)));
    const viaStub = sources(detail(SURVIVOR));

    const outcome = await openBook(STUB, viaStub);

    expect(outcome).toEqual(held);
    // Already ours, so no enrichment and no cover decode on the way.
    expect(viaStub.enrich).not.toHaveBeenCalled();
    expect(viaStub.bandColor).not.toHaveBeenCalled();
    expect(await rowsFor(STUB, SURVIVOR)).toHaveLength(1);
  });

  it("lets several readers opening the same new book share one row", async () => {
    const outcomes = await Promise.all([
      openBook(FRESH, sources(detail(FRESH))),
      openBook(FRESH, sources(detail(FRESH))),
      openBook(FRESH, sources(detail(FRESH))),
    ]);

    const ids = new Set(
      outcomes.map((o) => (o.kind === "found" ? o.book.id : o.kind)),
    );
    expect(ids.size).toBe(1);
    expect(await rowsFor(FRESH)).toHaveLength(1);
  });

  it("opens a key given in its /works/ form under the bare key", async () => {
    const outcome = await openBook(`/works/${FRESH}`, sources(detail(FRESH)));
    expect(outcome.kind === "found" && outcome.book.olWorkKey).toBe(FRESH);
  });
});

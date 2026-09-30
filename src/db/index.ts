import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.ts";

/**
 * Lazily constructed so that importing this module does not require a live
 * DATABASE_URL. `next build` runs with a placeholder connection string, and
 * anything that reaches the database at module scope would break the build.
 */
let cached: ReturnType<typeof create> | undefined;

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
    );
  }
  // A plain Postgres connection, so the same code runs against Neon and
  // against a self-hosted Postgres (MRG-081). `prepare: false` keeps it safe
  // behind a transaction-mode pooler such as Neon's.
  return drizzle(postgres(url, { prepare: false }), { schema });
}

export function getDb() {
  cached ??= create();
  return cached;
}

export { schema };

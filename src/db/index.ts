import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

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
  return drizzle(neon(url), { schema });
}

export function getDb() {
  cached ??= create();
  return cached;
}

export { schema };

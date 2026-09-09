import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js reads .env.local and lets it override .env, but drizzle-kit runs
// outside Next and does not, so load them here in the same precedence order.
// `override: false` means the first file to define a key wins.
config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});

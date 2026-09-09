import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// Integration tests need a real DATABASE_URL. Unit tests do not, and CI only
// ever has a placeholder — the integration suite skips itself there.
config({ path: ".env.local" });

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    // Integration tests hit one shared database; running them in parallel
    // would make them race each other rather than the code under test.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      // Only measure what we actually unit-test. UI is covered by Playwright
      // from phase 5; counting it here would produce a misleading number.
      include: ["src/lib/**/*.ts", "src/db/index.ts"],
      exclude: ["**/*.test.ts", "**/fixtures/**", "src/db/migrations/**"],
    },
  },
});

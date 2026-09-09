import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
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

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Nothing a client component imports may reach Zod, the database or Better
 * Auth. One constant imported from a schema module shipped all of Zod to the
 * book, to-read and settings pages (MRG-022); this walks the real import graph
 * so it cannot happen quietly again. A "use server" module is a boundary: the
 * client only receives references to its actions.
 */

const SRC = path.resolve(__dirname, "..");
const FORBIDDEN = ["zod", "@/db", "drizzle-orm", "better-auth", "@neondatabase/serverless"];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry.name) && !entry.name.includes(".test.") ? [full] : [];
  });
}

function resolve(from: string, specifier: string): string | null {
  let base: string;
  if (specifier.startsWith("@/")) base = path.join(SRC, specifier.slice(2));
  else if (specifier.startsWith(".")) base = path.resolve(path.dirname(from), specifier);
  else return null;
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")];
  return candidates.find((c) => /\.tsx?$/.test(c) && existsSync(c)) ?? null;
}

/** Value imports only: `import type` and `export type` vanish at compile time. */
function imports(source: string): string[] {
  const found = source.matchAll(/^(?:import|export)\s+(?!type\s)[^;]*?from\s+["']([^"']+)["']/gm);
  return [...found].map((match) => match[1]);
}

function forbiddenReach(entry: string): string[] {
  const seen = new Set<string>();
  const hits: string[] = [];
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const source = readFileSync(file, "utf8");
    // The directive must open the file; an inline one inside a function is not a boundary.
    if (file !== entry && /^\s*["']use server["']/.test(source)) continue;
    for (const specifier of imports(source)) {
      if (FORBIDDEN.some((bad) => specifier === bad || specifier.startsWith(`${bad}/`))) {
        hits.push(`${path.relative(SRC, file)} → ${specifier}`);
      }
      const next = resolve(file, specifier);
      if (next) queue.push(next);
    }
  }
  return hits;
}

const clientFiles = sourceFiles(SRC).filter((file) =>
  /^["']use client["']/m.test(readFileSync(file, "utf8")),
);

describe("client import graph", () => {
  it("finds the client components", () => {
    expect(clientFiles.length).toBeGreaterThan(5);
  });

  it.each(clientFiles.map((file) => [path.relative(SRC, file), file]))(
    "%s reaches no server-only module",
    (_name, file) => {
      expect(forbiddenReach(file)).toEqual([]);
    },
  );
});

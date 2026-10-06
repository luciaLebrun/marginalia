/** Narrow a value a test has just arranged to exist; a miss fails the test with a name. */
export function must<T>(value: T | null | undefined, what = "value"): T {
  if (value === null || value === undefined) throw new Error(`expected ${what} to exist`);
  return value;
}

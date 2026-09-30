/*
 * Fixture ids for the integration suites, scoped to this run (MRG-061). CI
 * runs a workflow per push and per pull request, and both hit the same Neon
 * branch: with fixed ids, one run's cleanup deletes the rows the other is
 * asserting on, and its writes put back rows the other has just removed.
 */
export const RUN = process.env.GITHUB_RUN_ID ?? `local${process.pid}`;

/**
 * Six digits from the run and the suite, for the columns RUN cannot be pasted
 * into: a work key must stay `OL<digits>W` to parse, and a username is at most
 * 20 of [a-z0-9_]. Salted by suite so two suites never share a key.
 */
export function runKey(suite: string): number {
  return [...`${suite}${RUN}`].reduce((hash, char) => (hash * 31 + char.codePointAt(0)!) % 900000, 7) + 100000;
}

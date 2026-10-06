const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // House style appends (MRG-###) and the squash suffix (#NN).
    "header-max-length": [2, "always", 140],
    // Subjects open with proper nouns (TypeScript, Next.js, Vitest).
    "subject-case": [0],
  },
  ignores: [
    (m) => /^Merge /.test(m), // back-merges, "Merge pull request #…"
    (m) => /^Hotfix v\d/.test(m), // hotfix PR titles
    (m) => /^Release /i.test(m), // release PRs
  ],
};

export default config;

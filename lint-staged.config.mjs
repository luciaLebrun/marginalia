// Type-aware rules need Next's route types (PageProps), which live in
// .next/types: generate them once per commit, then lint only what is staged.
const config = {
  "*.{ts,tsx,mts,mjs,js}": (files) => [
    "next typegen",
    `eslint --fix --max-warnings 0 ${files.map((f) => JSON.stringify(f)).join(" ")}`,
  ],
};

export default config;

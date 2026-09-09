---
name: gitflow
description: Branching, PR and release rules for this repo (git flow without release branches). Use when starting work, opening a PR, cutting a release, or shipping a hotfix.
---

# Git flow

Two permanent branches, no release branches.

| Branch | Role |
|---|---|
| `main` | Production. Protected. Every merge is tagged `vX.Y.Z`. Deploys to Vercel production. |
| `develop` | Default branch and integration target. Deploys to a persistent Vercel preview. |
| `feature/MRG-###-slug` | Cut from `develop`, PR back into `develop`. |
| `hotfix/slug` | Cut from `main`, PR into `main`, **then back-merged into `develop`**. |

## Starting work

```bash
git checkout develop && git pull
git checkout -b feature/MRG-012-book-page
```

The `MRG-###` comes from `~/Documents/Notes/Marginalia/Backlog.md`. One backlog
item, one branch. If there is no backlog item, add one first.

## Opening a PR

Target `develop` (or `main` for a hotfix). Before pushing:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

CI runs the same four plus SonarQube Cloud. Both `main` and `develop` require a
passing CI run and a passing quality gate. Sonar's gate is "Clean as You Code" —
it judges the diff, not the whole repo, so it is a realistic bar.

## Releasing

`develop` → `main` **is** the release. There is no release branch.

```bash
git checkout main && git pull
git merge --no-ff develop
git tag -a v0.2.0 -m "v0.2.0 — book page and log form"
git push origin main --tags
```

Semver: patch for fixes, minor for features, major only on a breaking data
change. Tag *after* the merge lands, not before.

## Hotfixes

The back-merge is not optional. Skipping it is how a fix gets silently reverted
by the next `develop` → `main` merge.

```bash
git checkout -b hotfix/cover-403 main
# ... fix, PR into main, merge, tag vX.Y.Z+1 ...
git checkout develop && git merge --no-ff main && git push
```

## Notes

- The repo's `.gitconfig` sets `merge.ff = false`, so merges keep an explicit
  merge commit. That is intentional — it is what makes the two-trunk history
  readable.
- Never commit directly to `main` or `develop`.
- Never force-push either branch.
- Deployment is Vercel's Git integration, not a workflow. There is no
  `deploy.yml` and there should not be one.

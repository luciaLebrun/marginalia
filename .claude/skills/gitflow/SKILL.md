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

## Merging

**Feature PRs into `develop`: squash and merge.** One backlog item becomes one
commit on `develop`, so the history reads as a list of changes rather than of
working steps.

```bash
gh pr merge <n> --squash --delete-branch
```

**Release PRs (`develop` → `main`) and hotfix back-merges: a real merge commit.**

```bash
gh pr merge <n> --merge
```

Squashing a release would write a *new* commit onto `main` that is not a merge
of `develop`, so the two trunks permanently diverge: the next release PR
re-lists every commit already shipped and conflicts with itself. In a two-trunk
model this is the one place squash is genuinely destructive. Same reasoning for
a hotfix back-merge — `main` must remain an ancestor of `develop`.

| PR | Merge method |
|---|---|
| `feature/*` → `develop` | `--squash` |
| `hotfix/*` → `main` | `--squash` |
| `develop` → `main` (release) | `--merge` |
| `main` → `develop` (back-merge) | `--merge` |

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

`main` is protected and requires a PR, so a release is a PR from `develop` into
`main` — a local `git merge` into `main` would be rejected on push:

```bash
gh pr create --base main --head develop --title "release: v0.2.0 — ..."
# wait for CI + the Sonar gate, then:
gh pr merge <n> --merge          # --merge, never --squash — see Merging above

git checkout main && git pull --ff-only
git tag -a v0.2.0 -m "v0.2.0 — book page and log form"
git push origin v0.2.0
```

Semver: patch for fixes, minor for features, major only on a breaking data
change. Tag *after* the merge lands, not before.

Never `--squash` a release — see the Merging table above.

## Hotfixes

The back-merge is not optional. Skipping it is how a fix gets silently reverted
by the next `develop` → `main` merge.

```bash
git checkout -b hotfix/cover-403 main
# ... fix, PR into main, merge, tag vX.Y.Z+1 ...

# back-merge — also a PR, since develop is protected too
gh pr create --base develop --head main --title "chore: back-merge hotfix/cover-403"
```

## Notes

- The repo's `.gitconfig` sets `merge.ff = false`, so merges keep an explicit
  merge commit. That is intentional — it is what makes the two-trunk history
  readable.
- Never commit directly to `main` or `develop`. Both are protected: a PR is
  required and both CI checks must pass. Force pushes and deletions are blocked.
- Protection is set with `enforce_admins: false`, so the repo owner *can*
  bypass it. Do not — the point is that the checks ran.
- Deployment is Vercel's Git integration, not a workflow. There is no
  `deploy.yml` and there should not be one.

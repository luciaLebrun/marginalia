---
name: backlog
description: How to read and update the Marginalia backlog in Obsidian. Use when picking up work, finishing a task, adding an idea, or writing a session note.
---

# Backlog

Lives in the user's Obsidian vault, **not** in the repo:

```
~/Documents/Notes/Marginalia.md          index note
~/Documents/Notes/Marginalia/Backlog.md  the backlog (single source of truth)
~/Documents/Notes/Marginalia/Ideas.md    post-MVP parking lot
~/Documents/Notes/Marginalia/Sessions/   one note per working session
```

The vault has **no community plugins**. Plain markdown only — no Dataview, no
Kanban, no Tasks syntax beyond standard checkboxes.

## Item format

```markdown
- [ ] MRG-012 — Book detail page renders from our DB #area/ui
```

- IDs are `MRG-###`, sequential, **never reused** even after deletion.
- Exactly one `#area/*` tag: `#area/infra`, `#area/db`, `#area/api`,
  `#area/auth`, `#area/ui`, `#area/docs`.
- Sections in order: `## Now` (in flight, keep to 1–3) · `## Next` ·
  `## Later` · `## Done`.

## Moving work

Starting an item: move it into `## Now`, then branch
`feature/MRG-012-book-page`.

Finishing an item: it is Done only when it is **merged into `develop` with CI
and the Sonar gate green**. Then move the line to `## Done`, tick it, and append
the date:

```markdown
- [x] MRG-012 — Book detail page renders from our DB #area/ui ✅ 2026-09-09
```

Not done: works locally, PR open, or "just needs a test".

## What goes where

The backlog holds **work**. Decisions about the code do not go here — ADRs live
in the repo at `docs/adr/` so they version with the code they describe. Each
fact gets exactly one home; link across rather than copying.

New feature ideas go in `Ideas.md`, not `Later`. `Later` is committed scope;
`Ideas.md` is not.

## Session notes

One note per working session in `Sessions/`, matching the vault's existing
frontmatter convention (`title`, `type`, `permalink`, `tags`) and its
observation style:

```markdown
- [status] What is true now.
- [todo] What the next session should pick up.
- [constraint] A rule that must not be violated.
- [gotcha] Something hard-won, so it is not rediscovered.
```

Write one at the end of any session that changed the architecture, hit a
non-obvious problem, or left work half-finished.

---
version: 1
slug: "src-app-settings-page-tsx"
primary_target: "src/app/settings/page.tsx"
related_targets: ["src/components/SettingsForm.tsx","src/components/SignInDoor.tsx","src/components/InviteRun.tsx"]
---

Scope: the account surfaces — `/settings` for a signed-in reader, and the
signed-out door that replaces the placeholder in `src/app/page.tsx`. Visitor
mode: Operate.

Audience and job: the reader themselves, and a friend arriving with an invite
code. Three jobs, in order — get in when you have a code, correct the details
that appear on your own diary, and hand a code to someone else. This surface is
opened rarely and briefly; nothing here is a destination.

Constraints that bind: invite codes are the only thing gating this app. The
door checks a code before the Google round-trip, accepting a weak oracle (a
holder can learn their own code is spent) to avoid the far worse path, where a
typo sends someone through Google only to have sign-up aborted on the way back.
With 29^8 codes and single figures live, mistyping is the threat model, not
guessing. Codes cross the OAuth round-trip in a short-lived httpOnly cookie
because Google carries no form field. Only the owner may mint codes — the
schema has no owner notion, so one is added. A username may now be changed and
the old handle dies; the claim copy's "cannot be changed later" promise is
withdrawn. Phone and laptop are equally primary. Craft bar named by the user:
GitHub and Vercel account settings.

## Direction contract

THESIS: The account page is one sheet you fill in and commit once, not a
dashboard of independently saving widgets. It refuses the settings-page default
on both sides — the sidebar-and-panes console that turns four small facts into
a navigable app, and the row-per-setting list where every line saves itself and
nothing is ever finished.

OWN-WORLD: Inherited unchanged from DESIGN.md — paper #F4F1E8, ink #16130F,
sunk paper #EAE5D8, fiction orange #E8501B as the standing accent, Archivo
alone doing every job through weight and width, hairline rules at 15% ink, flat
ink, zero elevation, square corners. No new token, no second family, no dark
ground. States are printed marks rather than chrome: hairline at rest, filled
when pressed, run through when unavailable, bracketed on focus, a struck bar
when spent.

STORY: A friend with a code understands within one viewport that this is closed,
that their code is what opens it, and that Google is only the doorway. A signed-
in reader understands that the page is holding unsaved work and what committing
it will change, and never wonders whether something already took effect.

FIRST VIEWPORT: The wordmark band, then one continuous column with no internal
saves — name, handle, bio — read top to bottom as a single sheet. A commit band
sits at the foot of the viewport carrying a live count of what is pending, so
the page never silently holds work. Below the form's end and deliberately
outside it: the invite run (owner only), sign out, and last, fenced and ruled in
solid ink, the account itself, which requires the handle typed back before it
will fire. Anything irreversible says so at the point of action and shows the
result before it commits. The signed-out door is the same column pulled short —
the eight-cell invite mask, then the Google hand-off, and nothing else.

FORM: One Form, One Commit — candidate 4 of my ordered grounded list, dealt at
re-roll round 2 and locked after two re-rolls and a safer steer. Seed key
4c060032. Raised by two declined challengers: printed marks as the whole state
vocabulary (centre-rail reference setting), and irreversibility declared at the
point of action with the result shown before it commits (darkroom safelight bay).

FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance

## Unresolved

- The owner notion is an env-var allowlist (`MARGINALIA_OWNER_EMAIL`) rather
  than a schema column, so it stays free and needs no migration. Revisit if a
  second person ever needs to mint codes.
- Renaming frees the old handle immediately. No handle-history table, so a
  friend's link to the old address 404s and the name is takeable by anyone.
- The commit band is the only viewport-pinned element in a project where
  nothing else floats. It is scoped to the whole account column, not the form,
  so it survives the invite run and the delete fence.
- OWN-WORLD above says "no new token", and the build added one:
  `--color-alarm` (#951D10, 7.6:1 on paper). Ink cannot say "this failed" when
  every rule on the page is already ink, and the band colours all mean "a book".
  DESIGN.md must record it; this line stands until it does.

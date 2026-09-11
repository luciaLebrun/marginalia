---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/[handle]/page.tsx","src/components/Masthead.tsx","src/app/dev/profile/page.tsx"]
---

Scope: the reading diary grid — `/` for the signed-in reader and `/@[username]`
as the public profile. Both are the same surface: a chronological grid of books
finished. Visitor mode: Operate.

Audience and job: the reader themselves, and the handful of friends they invited.
Two jobs, in order — record a book just finished fast enough that nobody skips
it, and revisit months of reading pleasurably. Primary action on this surface is
"log a book"; the grid itself is the reward for having done so.

Constraints that bind: the database is empty and there are no users, reviews or
testimonials, so every state must be designed honestly and nothing may be mocked
up with fictional activity. Cover images are hotlinked from Open Library by
CoverID and have inconsistent aspect ratios and wildly inconsistent quality. Some
books have no cover at all. Phone and laptop are equally primary.

## Direction contract

THESIS: The diary is a cover *system*, not a wall of thumbnails. One rigid
three-band frame carries every entry, so a shelf of four books and a shelf of
four hundred look like the same designed object. It refuses the category default
on both sides: the near-black Letterboxd grid, and the cream-and-serif "cozy
reading" page that is the same default wearing the subject's clothes.

OWN-WORLD: Penguin/Pelican tri-band. Paper ground #F4F1E8, ink #16130F, and the
period category colours — orange #E8501B, crime green #007A5E, Pelican cyan
#00A0C6 — as the fallback band set. One typeface only, Archivo, doing every job
through weight and width; band labels are tracked-out caps, records are tabular
figures. Hairline rules, flat ink, no shadows, no gradients, no rounded corners
beyond 2px. Each entry's top band floods with a colour derived from that book's
own cover, falling back to a stable category colour when there is no cover or
extraction fails. Recognizable with all content removed by the band structure
alone.

STORY: The reader understands within one viewport that this is their record and
that it is ordered by time. They believe it is worth adding to because the grid
already looks like a designed shelf rather than an empty list. They log a book.

FIRST VIEWPORT: Paper ground. A tri-band masthead — MARGINALIA tracked out in
caps on a colour band, the reader's name and a running count beneath. Below it,
the grid: each entry a tri-band card, colour band top (book's own colour), cover
in the pale centre band at its native ratio, bottom band ruled with date finished
and rating in tabular figures. Two columns at 360px, six at 1440px, whole-cell
repack, chronology running down. The primary action, "Log a book", sits as a
tri-band cell in the grid's first position — the empty shelf therefore reads as
one card that is entirely that action, not as a blank page with a button. Year
dividers are full-width ruled bands.

FORM: Tri-band, candidate 4 of my ordered grounded list, assigned by the roll.
Seed key 400639f1. Raised by four declined challengers: total colour commitment
(racing livery), chronology ruling layout (tensegrity), one strict grid as the
whole composition (glyph render), and one control that re-gathers the shelf
(drawcord).

FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance

## Profile identity (MRG-017) — extension, confirmed with the user

An addition inside this surface, so it inherits the direction contract above
unchanged: no concept roll, no new tone, type step or motion. The profile's grid
itself shipped with MRG-012; MRG-017 was rescoped by the user to identity.

- Job: a friend opening `/@handle`, often from a link, sees whose diary this is
  before scanning it; the owner opening their own `/@handle` sees what others
  see.
- Masthead band two, profile only: the name at display scale left and the
  reading span right, as now; under the name the `@handle` in band voice, soft
  ink; under that the bio as body copy in soft ink, capped at 38rem — a few lines
  under the handle, as the account sheet now says. No bio, no line.
- Masthead band three, profile only: the tally left; the right edge depends on
  who is looking — the owner keeps "Your account" (`/settings`), a signed-in
  friend gets "Your diary" (their own `/`), a signed-out visitor gets nothing.
- Unchanged: the reader's own diary at `/`, the shelf, the grid, entry cells,
  page titles.
- States: owner · signed-in friend · signed-out visitor · with and without a
  bio · a 240-character bio · a 20-character handle (the username limit) at 390.
- Confirmed answers: rescope MRG-017 to profile identity; band three's link by
  viewer as above. Linking entry cells to book pages stays MRG-051.
- Confirmed after the finish review: the account sheet's bio hint promised
  "two lines", but a bio at the 240-character limit runs about three lines at
  1440 and five at 390. The user chose to reword the hint ("A few lines under
  your handle on your diary") rather than lower the limit or clamp the bio.

## Unresolved

- None blocking. Cover colour extraction and the username claim (MRG-012) both
  shipped; linking entry cells to their book pages is MRG-051.

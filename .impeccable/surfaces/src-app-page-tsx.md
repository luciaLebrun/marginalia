---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
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

## Unresolved

- Cover colour extraction: server-side on book upsert, cached to a new
  `book.coverColor` column. Falls back to a stable hash into the category colours.
  Verify Open Library covers can be fetched and decoded before committing to it.
- Username claim (MRG-012) is not built, so `/@[username]` has no route yet;
  this build targets `/` first and the profile inherits it.

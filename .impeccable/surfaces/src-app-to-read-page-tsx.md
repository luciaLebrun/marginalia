---
version: 1
slug: "src-app-to-read-page-tsx"
primary_target: "src/app/to-read/page.tsx"
related_targets: ["src/components/ToReadStack.tsx","src/app/dev/to-read/page.tsx","src/components/Masthead.tsx"]
---

Scope: `/to-read` — the signed-in reader's private list of books they mean to
read (MRG-059). Signed-in only; never shown to anyone else. Visitor mode:
Operate.

Audience and job: the reader, on phone or laptop, deciding what to read next —
or opening the list to see what they saved. See what is waiting, newest saved
first; open a book (to read about it, or to log it once read); take one off.
Reached from the diary masthead and from a saved book's "Your list" link.

Constraints that bind: renders from Postgres alone through `getToRead()`, no
external call; covers by CoverID only; a book on the list has not earned its
colour (colour means "read"), so nothing here wears a jacket colour; the list
is private, the reader from the session. Phone and laptop equally primary.
The database is nearly empty: the empty list is the state most readers meet
first, and must be designed honestly.

## Direction contract

THESIS: The list is the pile of books waiting by the bed — spines lying one on
another, the newest saved on top — not a second cover grid. It refuses the
diary's grid, where a cell means "read", and the checklist of rows with boxes
that every to-read app ships.

OWN-WORLD: the incumbent tri-band world, unchanged. Paper ground, ink, soft
ink, hairline; Archivo only. A spine is an ink band: the title in paper at the
field step, the first author under it in soft paper at the body step (never a
tracked-caps label above the title), the jacket in a 2:3 well at the spine's
end filling the spine's height — no well at all for a book with no cover.
Spines are separated by a paper hairline, and each whole spine lies off true
by a stable offset from the book's key, both edges moving, as a real pile
never aligns. No book colour, no shadow, no rotation, no motion.

STORY: The reader sees at once how many books wait and which they saved last,
on top. A thick book sits thick in the pile. They open one to read about it or
to log it, or take one off the pile.

FIRST VIEWPORT: 1440 — wordmark band; masthead name field "To read" at display
scale with the count at its right edge; ink record band "Newest saved on top"
with "Your diary" at its right. Below, the stack on a 48rem measure: spines at
least 3.5–6rem tall by page count (200–700 pages span the range), each offset
0–1.5rem, "Take it off" in paper band voice inside the spine's footprint
before the jacket, outside the link. 390 — the same stack across the gutter,
offsets up to 0.5rem. Signature interaction: the spine's words and its jacket
open the book page; the title's underline goes from paper at 40% to full under
the pointer and on focus, with a paper ring drawn inside the ink. A refusal
prints under its own spine. Empty: the outline of the first spine with its
jacket well drawn, "Nothing waiting", and the way to save one.

FORM: the bedside stack — position 4 of 7 on the ordered list, dealt as the
roll's lead by seed 9fe4b718 and locked by the user.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Decisions confirmed with the user

- Saved from the book page only ("Want to read"); logging a read removes the
  book from the list.
- The list lives on its own page, linked from the diary masthead, not on the
  diary.
- Private to its owner.
- Structure: the bedside stack, over the waiting shelf and the reserve slip.
- After the finish review, the user confirmed two points against the
  reviewer's preference: a jacket on a spine whose title wraps stays **whole**,
  centred with the spine's ink above and below it, because DESIGN.md's
  never-crop rule outranks filling the well; and "Take it off" stays **inside
  the spine's footprint at every width**, one layout rather than two.

## States

Empty · one book · many (tens) · a book with no cover (typographic jacket) ·
no page count (the median spine height) · no author ("Author unknown") · a long
title (wraps; the spine grows) · taking one off (pending) · taken off · signed
out → `/` · no handle → `/claim`.

## Unresolved

- None blocking.

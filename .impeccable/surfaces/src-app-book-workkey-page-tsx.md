---
version: 1
slug: "src-app-book-workkey-page-tsx"
primary_target: "src/app/book/[workKey]/page.tsx"
related_targets: ["src/components/BookTitlePage.tsx","src/components/DateSlip.tsx","src/components/BookStates.tsx","src/components/LogSheet.tsx"]
---

Scope: `/book/[workKey]` — one book, opened through `openBook()`. Reached
from a search result now, and from the diary later. Signed-in only. Visitor
mode: Operate.

Audience and job: the reader, on phone or laptop, just after finishing the book
or coming back to it. Recognise the book, see their own reads of it, and log a
new read inline (MRG-016).

Constraints that bind: rendering goes only through `openBook()` — found,
not-found, unavailable — and a stored book never reaches Open Library. Covers
by CoverID only. A first open takes 1–3s. Only the reader's own entries show.
Tests run from fixtures through `/dev/book`, never the live API.

## Direction contract

THESIS: A book opens on its own title page, and the reader's reads are dates on
the slip facing it. Refuses the store product page — cover, star average,
want/buy buttons, a wall of other people's reviews — and the modal "add to
shelf" sheet.

OWN-WORLD: the incumbent tri-band world at page scale. Band one: the author(s)
in band voice on ink, or on the book's conditioned jacket colour once it is on
this reader's shelf. Field: the jacket as frontispiece in a 2:3 sunk-paper well
facing the title page — title at display scale, subtitle, imprint rows split by
hairlines. Record: the date slip, ruled lines of reads — date, drawn rating,
Reread — closed by one ruled blank line. Paper, ink, soft ink, sunk paper; no
new tone, type step or motion.

STORY: The reader recognises the jacket and the title set large beside it,
reads who wrote it and when, and sees on the slip whether and when they read it
before. The blank line is where this read goes.

FIRST VIEWPORT: 1440 — wordmark band edge to edge, the author band beneath;
left third the jacket frontispiece, right two-thirds the title at 3.5rem over
the imprint rows and description; the slip below. 390 — author band, jacket at
about 60% width, title at 2.25rem, imprint rows, description, slip. Signature
interaction: the slip's blank line, which MRG-016 deploys into the log sheet in
place; drawn and inert until then. No new motion — the band wipe stays the
world's one moment.

FORM: title page and date slip — position 4 of 7 on the ordered list, dealt by
seed 24659867 and locked by the user over the lead.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Decisions confirmed with the user

- Logging is inline on the book page (MRG-016). MRG-015 draws the slip's next
  line ruled and inert: no control, no "coming soon" copy.
- Only the reader's own entries show; the circle stays on profiles.
- Signed-in only: opening an unseen book writes to the database.
- Band colour: ink until the book is on this reader's shelf, then its jacket
  colour — search's rule, carried over.

## States

Not on the shelf (slip is one blank line) · on the shelf with 1–n reads, newest
first, undated last · opening (wordmark, ink band "Opening this book…" — not
"from Open Library", since a stored book never reaches it — over a ruled empty
frontispiece and title frame; no skeleton cards) · unavailable
(soft ink on sunk paper; the diary is unaffected) · not found (a 404 in the
world's voice; may stream as a soft 404 with noindex) · redirect stub →
canonical `/book/[key]` · signed out → `/` · no handle → `/claim` · no cover →
typographic jacket · no author → "Author unknown" · an absent imprint value →
its row omitted.

## Log sheet (MRG-016) — extension, confirmed with the user

An addition inside this surface, so it inherits the direction contract above
unchanged: no concept roll, no new tone, type step or motion.

- The slip's blank line becomes the control: "Log a read" in band voice on the
  ruled line. It deploys the sheet in place inside the slip's 34rem column — a
  native disclosure, so it opens without JS; no modal, no navigation. Closing
  returns the blank line.
- Fields in the Field Row language (value over label, ruled line, no box):
  Finished — prefilled with today in the reader's own time zone, changeable, or
  cleared to Undated; a future date is refused in a sentence. Rating — five
  drawn marks in half steps over one real range input (the Code Cells pattern),
  unrated until touched, clearable. Review — optional, grows with the text.
  Reread — a printed tick, preselected when the slip already has a read.
- Commit: a fiction-orange band in the flow of the sheet, never pinned — the
  One Pin Rule's exception stays the account sheet's.
- After save the reader stays here: the page re-renders, the sheet closes into
  a new line at the top of the slip, the count updates, and a first read turns
  the author band to the book's colour. No animation on this page; the diary's
  ink-in fires on the next diary visit.
- One Zod schema shared by form and server action; the reader comes from the
  session, never the form. Refusals land on their field in alarm; a failed
  save says so and keeps what was typed.
- States: closed · open · saving · field error · save failed · saved.
- Confirmed answers: date prefilled with today; stay on the book page after
  saving; only date, rating, review, reread in this build.
- Confirmed after the finish review: the review field is set at the body step
  (0.9375rem, regular), not the field step — a named exception to the Value
  Over Label Rule for a field that holds paragraphs of prose. Short values stay
  at the field step.

## Unresolved

- None blocking. Diary cells linking to their book page is MRG-051; a spoiler
  flag is MRG-053; editing or removing a read is MRG-054.

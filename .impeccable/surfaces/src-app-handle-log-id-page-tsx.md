---
version: 1
slug: "src-app-handle-log-id-page-tsx"
primary_target: "src/app/[handle]/log/[id]/page.tsx"
related_targets: ["src/components/ReviewPostcard.tsx","src/components/DateSlip.tsx","src/app/dev/entry/page.tsx"]
---

Scope: `/@[handle]/log/[id]` — one diary entry, at its reader's address.
Public, like the profile it belongs to. Visitor mode: Read.

Audience and job: a friend opening a shared link, often on a phone and often
signed out, who wants to read one review and know whose it is and which book;
and the reader themselves, revisiting what they wrote. Reached from the book
page's date slip.

Constraints that bind: the page renders from Postgres alone through
`getEntry()` — no Open Library on this path, covers by CoverID only. Handle and
id must both match, so a renamed handle's old links 404 (ADR 0007). Every
entry has a page, reviewed or not: a diary entry is not a rating. A review runs
to 5,000 characters. The spoiler flag is not built (MRG-053), so nothing is
withheld yet.

## Direction contract

THESIS: A review arrives as a card from the reader — the jacket franked as its
stamp, the book addressed beside it, their words as the message, their name
signing the foot. It refuses the review-site default on both sides: the
rating-first product block with a comment underneath, and the blog-post page
with a byline header over an article.

OWN-WORLD: the incumbent tri-band world, unchanged. Paper ground, ink, soft
ink, sunk paper, hairline rules; Archivo alone through weight and width; the
jacket in its fixed 2:3 sunk-paper well as the stamp; band-voice labels on the
address lines; an ink postmark strip carrying the read date in tabular figures
and the drawn rating marks; the review as body copy. No new tone, type step,
radius or motion.

STORY: The friend opens the link, recognises the jacket and the book's name,
reads the message in the reader's own words, and knows who wrote it and when.
From the signature they can reach that reader's diary.

FIRST VIEWPORT: 1440 — wordmark band edge to edge; beneath it the card, built
out of the world's three bands. Band one carries the author on the book's own
earned jacket colour — this book is on the reader's shelf or there would be no
entry. The field holds the stamp block in the left column (the jacket in its
2:3 well, the title, first published, then the ink postmark strip with the read
date, the drawn rating and "Reread") and the message in the right column on the
34rem value measure, signed at its foot with the reader's name, @handle and the
read date, the name linking to their diary. Band three is the ink record: the
@handle left, and "Your diary" right for a signed-in reader, nothing for a
visitor. 390 — the same order stacked: colour band, stamp block, message,
record band. The card is not a fixed ratio: the stamp block holds its size
while the message column grows, so a 5,000-character review cannot break it.
No authored motion; the world's one moment stays the diary's band wipe.

FORM: the postcard — position 4 of 7 on the ordered list, dealt by seed
d602e2ae and locked by the user over the lead (the catalogue card). Code-led.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Decisions confirmed with the user

- Public, like the profile: no session needed to read a permalink.
- Every entry has a page; one with no review says so rather than 404ing.
- Reached from the book page's slip lines; diary and profile cells stay
  MRG-051.
- Structure: the postcard, locked over the dealt lead.
- The book's title links to its page only for a signed-in reader; a
  signed-out visitor sees it as plain text, because the book page is
  signed-in only and a door that will not open is not a link.

## Adaptations after the finish review

- The stamp block is the **left** column at 1440, not the right as first
  written: the stamp leads in the DOM so a screen reader meets the book before
  the words, and the keyboard must not jump right, then back left.
- The card gained band one (the book's earned colour, carrying the author) and
  band three (the ink record with the way onward). Two columns alone left the
  paper between them reading as a hole rather than as the card's own field, and
  the page was otherwise the only signed-in dead end in the product.
- The message sits on the 34rem value measure rather than 38rem: prose at the
  body step ran about 90 characters a line, past the 65–75 the craft floor asks
  for.
- The author is named on band one only, not repeated in the address lines.

## States

Reviewed · no review (the card says so in the reader's absence of words, never
404) · undated · unrated · reread · no cover → the type-only jacket · a renamed
handle or an unknown id → 404 · a review at the 5,000-character limit · signed
out versus signed in, which decides only whether the book's title links to its
page (the book page is signed-in only).

## Unresolved

- None blocking. The spoiler flag is MRG-053, social preview images MRG-025,
  and linking diary and profile cells MRG-051.

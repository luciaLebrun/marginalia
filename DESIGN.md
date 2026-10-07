---
name: Marginalia
description: A reading diary drawn as a Penguin/Pelican paperback cover system — paper ground, flat ink, one typeface, three bands; below 40rem, Now Reading, a night ground lit by each book's jacket colour.
colors:
  paper: "#F4F1E8"
  paper-sunk: "#EAE5D8"
  ink: "#16130F"
  ink-soft: "#5D564C"
  rule: "#16130F26"
  alarm: "#951D10"
  band-fiction: "#E8501B"
  band-crime: "#007A5E"
  band-pelican: "#00A0C6"
  m-night: "#0E0E10"
  m-raised: "#1A1A1D"
  m-raised-2: "#232327"
  m-text: "#F5F5F2"
  m-text-soft: "#A19E98"
  m-rule: "#F5F5F21F"
  m-accent: "#FF7A45"
  m-alarm: "#FF6B5B"
typography:
  wordmark:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.34em"
    fontVariation: "'wdth' 118"
    textTransform: "uppercase"
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  display-lg:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
  field:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "normal"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  passage:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.14em"
    fontVariation: "'wdth' 88"
    textTransform: "uppercase"
  meta:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.25
    fontFeature: "tabular-nums"
  m-display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 112"
  m-headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 112"
  m-title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  m-bar-label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.02em"
rounded:
  band: "2px"
  m-cell: "0.5rem"
  m-jacket: "0.875rem"
  m-spine: "1rem"
  m-commit: "1.125rem"
  m-card: "1.25rem"
  m-sheet: "1.75rem"
  m-pill: "999px"
spacing:
  hairline: "1px"
  band-y: "8px"
  band-x: "10px"
  page-x: "16px"
  page-x-wide: "24px"
  section: "40px"
  m-gutter: "20px"
  m-card-inset: "16px"
  m-grid-row: "28px"
  m-grid-col: "14px"
components:
  entry-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "0"
  entry-band-colour:
    typography: "{typography.label}"
    padding: "8px 10px"
  entry-band-field:
    backgroundColor: "{colors.paper-sunk}"
  entry-band-record:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    padding: "8px 10px"
  result-band-colour:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    padding: "8px 10px"
  log-cell:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "0"
  log-cell-hover:
    backgroundColor: "{colors.band-fiction}"
    textColor: "{colors.ink}"
  masthead-band-colour:
    backgroundColor: "{colors.band-fiction}"
    textColor: "{colors.ink}"
    typography: "{typography.wordmark}"
    padding: "20px 16px"
  masthead-band-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.display}"
    padding: "24px 16px"
  masthead-band-record:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    padding: "12px 16px"
  year-rule:
    backgroundColor: "{colors.paper-sunk}"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    padding: "8px 12px"
  field-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.field}"
    rounded: "0"
    padding: "20px 16px"
  field-row-error:
    textColor: "{colors.alarm}"
  code-cell:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.field}"
    rounded: "0"
    height: "48px"
  code-cell-active:
    backgroundColor: "{colors.paper-sunk}"
  code-cell-invalid:
    textColor: "{colors.ink}"
  commit-band:
    backgroundColor: "{colors.band-fiction}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "16px 16px"
  commit-band-flow:
    backgroundColor: "{colors.band-fiction}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "16px 12px"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "0"
    padding: "10px 12px"
  button-outline-hover:
    backgroundColor: "{colors.band-fiction}"
    textColor: "{colors.ink}"
  author-band:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    padding: "12px 16px"
  imprint-row:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "10px 0"
  date-slip-head:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    padding: "10px 12px"
  date-slip-line:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.field}"
    padding: "12px 72px 12px 12px"
  date-slip-edit:
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    height: "56px"
    width: "64px"
    padding: "0 12px 0 0"
  date-slip-edit-open:
    textColor: "{colors.ink}"
  log-sheet-summary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    height: "3.25rem"
    padding: "0 12px"
  log-sheet-summary-open:
    textColor: "{colors.ink}"
  log-sheet-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.field}"
    rounded: "0"
    padding: "16px 12px"
  log-sheet-review:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
  log-sheet-rating:
    textColor: "{colors.ink}"
    size: "32px"
  reread-tick:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "0"
    size: "20px"
  text-button:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
  remove-question:
    textColor: "{colors.alarm}"
    typography: "{typography.body}"
  page-jacket:
    backgroundColor: "{colors.paper-sunk}"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    padding: "24px 20px"
  postcard-band-colour:
    typography: "{typography.label}"
    padding: "12px 16px"
  postcard-postmark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    padding: "10px 12px"
  postcard-message:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
  postcard-signature:
    textColor: "{colors.ink}"
    typography: "{typography.field}"
  margins-band:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "12px 16px"
  journal-passage:
    textColor: "{colors.ink}"
    typography: "{typography.passage}"
    width: "34rem"
  keep-passage-line:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    height: "3.25rem"
    padding: "0 12px"
  keep-passage-line-open:
    textColor: "{colors.ink}"
  postcard-band-record:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    padding: "12px 16px"
  spine:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.field}"
    rounded: "0"
    padding: "8px 12px"
  spine-author:
    textColor: "{colors.paper}"
    typography: "{typography.body}"
  spine-empty:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.field}"
    rounded: "0"
    height: "4.5rem"
  m-bottom-bar:
    backgroundColor: "#161619D6"
    textColor: "{colors.m-text}"
    typography: "{typography.m-bar-label}"
    rounded: "{rounded.m-sheet}"
  m-bar-log:
    backgroundColor: "{colors.m-accent}"
    textColor: "{colors.m-night}"
    rounded: "{rounded.m-card}"
    size: "3.5rem"
  m-jacket:
    backgroundColor: "{colors.m-raised}"
    rounded: "{rounded.m-jacket}"
  m-cell-title:
    textColor: "{colors.m-text}"
    typography: "{typography.m-title}"
  m-hero-name:
    typography: "{typography.m-display}"
    padding: "24px 20px 32px"
  m-book-sheet:
    backgroundColor: "{colors.m-night}"
    textColor: "{colors.m-text}"
    rounded: "{rounded.m-sheet}"
    padding: "28px 20px 40px"
  m-year-rule:
    backgroundColor: "#0E0E10BF"
    textColor: "{colors.m-text}"
    typography: "{typography.m-headline}"
    padding: "12px 20px"
  m-commit-pill:
    backgroundColor: "{colors.m-accent}"
    textColor: "{colors.m-night}"
    typography: "{typography.label}"
    rounded: "{rounded.m-commit}"
  m-pill-button:
    textColor: "{colors.m-text}"
    typography: "{typography.label}"
    rounded: "{rounded.m-pill}"
    padding: "10px 18px"
  m-pill-button-hover:
    backgroundColor: "{colors.m-accent}"
    textColor: "{colors.m-night}"
  m-order-choice-current:
    backgroundColor: "{colors.m-text}"
    textColor: "{colors.m-night}"
    rounded: "{rounded.m-pill}"
    padding: "10px 14px"
  m-card:
    backgroundColor: "{colors.m-raised}"
    textColor: "{colors.m-text}"
    rounded: "{rounded.m-card}"
  m-spine:
    backgroundColor: "{colors.m-raised-2}"
    textColor: "{colors.m-text}"
    rounded: "{rounded.m-spine}"
---

# Design System: Marginalia

## Overview

**Creative North Star: "Tri-band"**

Marginalia is drawn as a paperback cover system, not as an app skin. The reference
is the mid-century Penguin/Pelican grid: a paper ground, flat opaque ink, one
typeface doing every job through weight *and* width, and a rigid three-band frame —
colour, field, record — that carries every object on the page. The frame is applied
at two scales: each diary entry is a tri-band cell, and the masthead is the same
three bands run at page width. A shelf of four books and a shelf of four hundred
read as the same designed object because the frame never varies.

The density is printed rather than app-like. Cells butt against each other on a 1px
hairline, band padding is 8–10px, and there is no card gutter, no elevation, no
rounding to soften a join. The one colour that varies is each entry's own band,
derived from that book's cover art; everything else on the page is paper, ink, soft
ink, or sunk paper. What the world refuses at 40rem and up is recorded in the build itself: no dark
mode (this is printed paper, and paper does not invert; the phone's night ground is a
second world chosen by viewport, not an inversion of this one), no shadows, no gradient
shading, no second typeface, and no decorative imagery — the book jackets are the
only pictures and they arrive from Open Library at unpredictable ratio and quality,
so the system holds them in a fixed frame rather than trusting them.

Because both phone and laptop are equally primary (PRODUCT.md), the shelf repacks
whole cells at 2 / 3 / 4 / 6 columns rather than degrading into a list on one of
them. And because the production database is genuinely empty, the empty shelf is
the first-run surface a real reader meets, designed as one full tri-band cell that
*is* the action — never mocked up with invented entries, ratings, or activity.

The account surfaces extend the same world into interaction. Controls and fields
carry their state as printed marks rather than as chrome: a hairline at rest, solid
ink once filled, sunk paper on the cell waiting for the next keystroke, a struck bar
across a code that is spent. One tone was added to the palette to do the one job ink
cannot do — say that something failed — and one element is pinned to the viewport,
which the world otherwise never does.

Below 40rem the phone has its own world, Now Reading, recorded in its own section at
the end of this file. It overrides this world's ground, depth, shape, pinning and
type display at that width only; everything not named there still holds.

**Key Characteristics:**
- A three-band frame — colour / field / record — at both cell and page scale
- Paper ground, flat ink, hairline rules, zero elevation (at 40rem and up)
- One family (Archivo variable), differentiated by weight and by width axis
- Band foreground chosen by WCAG contrast at render time, never fixed
- Tabular figures everywhere: this page is a record of dates and ratings
- State drawn as a printed mark — rule, fill, strike — never as a chrome control
- Motion at every width: one focal moment (a jacket travelling from shelf to page) and
  quiet feedback around it; reduced motion crossfades only

## Colors

A printed palette: warm paper, near-black ink, and one saturated field colour per
entry drawn from that book's own jacket. One tone stands outside it, for refusal.

### Primary
- **Penguin Orange** (`{colors.band-fiction}`): the fiction band. The system's
  standing accent — it carries the masthead's colour band, the "Add" affordance's
  hover and focus fill, the ground of both commit bands (the account sheet's, pinned, and
  the log sheet's, in the flow), the outline button's hover and
  focus fill, the text selection highlight, and the caret. It is also the first of
  the three fallback bands.

### Secondary
- **Crime Green** (`{colors.band-crime}`): second fallback band, assigned by stable
  hash when a book has no usable cover colour.
- **Pelican Cyan** (`{colors.band-pelican}`): third fallback band, same mechanism.

These three are a *fallback set*, not a category taxonomy. The live band colour on a
populated shelf is nearly always derived from the jacket and conditioned before use.

### Tertiary
- **Alarm Red** (`{colors.alarm}`): refusal. The one tone in the system that is
  neither paper, ink, nor a band. It exists because ink cannot say "this failed"
  when every rule and border on the page is already ink, and because all three band
  colours already mean "a book". It measures 7.6:1 on paper, so it carries body copy
  as well as a stroke. It appears in exactly seven places: the door's refused-code
  message and all eight of that mask's cell borders; a field-level validation error
  under the account sheet's ruled value; the handle-rename warning that says the old
  address dies; the border of the delete control once the handle has been typed
  back and the control is armed; a refused field on the log sheet, as the error
  sentence under its row and, where the field has a ruled line (Finished, Review),
  that line redrawn in alarm — Rating's drawn marks are never recoloured; and the log
  sheet's general refusal sentence above its commit band, whose "Sign in again" link
  is underlined in alarm at 40% at rest and in full alarm under the pointer; and the
  removal under a slip line's edit sheet, once armed — the body-step question "Remove
  this read for good? Its page goes too.", the border of its "Remove" control, and the
  "Not removed: …" refusal that replaces that question at the same step (its "Sign in
  again" link underlined as the log sheet's is).

### Neutral
- **Paper** (`{colors.paper}`): the page ground and every cell's ground. Also the
  reversed text colour on every ink band — including a review permalink's postmark
  strip, where the drawn rating takes paper as its `tone` — the focus ring on an ink band, and one of the two candidates the contrast
  helper picks from for band text. A spine on the to-read list is another ink band:
  its title, its first author at 70%, and its "Take it off" are all paper, and the
  underline under its title is paper at 40%, going full under the pointer and on
  keyboard focus.
- **Sunk Paper** (`{colors.paper-sunk}`): the jacket well behind a cover (in a cell,
  and as a book page's frontispiece), the no-cover setting at both scales, the empty
  frontispiece drawn while a book opens, the year rule's ground, the ground of the
  code cell awaiting the next keystroke, the band that says Open Library is
  unavailable (under search, and in place of a book never opened here), and the
  scrollbar track. It reads as the same sheet pressed
  slightly, not as a second surface.
- **Ink** (`{colors.ink}`): all primary text, all structural borders, the focus
  ring (except on a band: paper on an ink band, the band's `readableOn()` foreground
  on a book's colour), the fence around the delete section, and the masthead's record
  band ground. It is also the ground of the date slip's head, of the band that opens
  each of a book page's states, and of a book page's author band until the book is on
  this reader's shelf, and it draws the 2px rule that parts that author band from the
  wordmark band. On a review permalink it is the ground of the postmark strip under
  the stamp block, of the card's record band, and of the 2px rule that opens the
  card's colour band.
- **Soft Ink** (`{colors.ink-soft}`): dates, counts, the reading span, a profile's
  handle and bio in the masthead, a book's
  subtitle, "Unrated" and "Undated" (and "N of 5" on the log sheet), the log sheet's
  "Log a read" line at rest, a slip line's "Edit" at rest, an empty date field, a placeholder, field and imprint
  labels and hints, a closed
  code's characters, supporting copy (a book's description among it), the author at
  the foot of a type-only jacket, a review permalink's "First published" line, its
  no-review sentence, and the `@handle` and read date under its signature, the line
  beside an unavailable "Show 20 more" saying why, the line beside "Add to favourites" at
  four ("You have four already. Take one off from its own page to make room."), the
  line after a book page's imprint saying the reader already has this book from the other source ("You’ve already logged this book from Google Books." and its link), the
  owner's hint under an empty favourites rule ("Up to four books you’ve read, in the
  order you choose. Open one from your shelf and add it from its page."), the line under
  the owner's favourites saying how to arrange them, and the scrollbar thumb. It is the only tonal step below ink; there is no third text grey.
- **Hairline Rule** (`{colors.rule}`): ink at 15% alpha. Every hairline in the shelf
  — cell borders, record-band separator, and the ruled column lines that show a
  partial row's unfilled positions — plus the resting stroke under a field value,
  the resting border of an empty code cell, the border of a control that is not
  yet available, the border of a book page's frontispiece, the lines between imprint
  rows, between reads on the date slip and between the log sheet's rows, the slip's
  closing "Log a read" line at rest (at 2px), a text button's underline at rest and the
  underline under a slip line's "Edit", the
  empty box of the reread tick,
  the ruled empty frame drawn while a book opens, and a link's underline at rest on
  paper — a review permalink's title and reader-name links among them, where it also
  draws the well around the stamp and the rule above the signature.

### Named Rules

**The Readable Band Rule.** No band ever has a fixed foreground. `readableOn()`
compares the WCAG contrast of ink and paper against the band and returns the winner.
This is not a nicety: bands are derived from arbitrary cover art, and paper on the
fiction orange is 3.32:1 and fails AA. The same helper decides the masthead, the
entry bands, a book page's author band (its foreground, its link underline, and its
focus ring), and the "Add" cell's hover state.

**The Conditioned Ink Rule.** A colour lifted from a jacket is never used raw.
`conditionBand()` floors saturation at 0.35 and clamps lightness into 0.28–0.62, so
near-white paper borders, near-black spines, and washed-out scans all land as
deliberate flat ink rather than as whatever the scanner captured.

**The Stable Colour Rule.** A fallback band is a deterministic hash of the Open
Library work key, never random and never per-render. A shelf that reshuffles its own
colours between visits reads as broken, not lively. Anything else that varies per book
is settled the same way: how far off true a spine lies in the to-read pile is a
deterministic step from the same key, so the pile looks hand-stacked and still stands
exactly as it did last visit.

**The Earned Colour Rule.** A book wears a band colour only once it is on this
reader's shelf. Until then its band is ink: a search result's band, and a book page's
author band while its slip reads "Not on your shelf". On the shelf it takes the
conditioned jacket colour, or the stable fallback when there is none. Removing a
book's last read takes it off the shelf, and its band goes back to ink. The rule also
governs a page-scale band on the review permalink, which calls `bookBand(book, true)`
with the flag already earned: the entry's own existence is what proves the book is on
the shelf, so that card's colour band is never held back to ink. A book merely
*waiting* is held back the same way: every spine on the to-read list is ink, because
colour is earned by reading and not by saving, and no jacket colour is extracted for a
book that has never been logged. A favourite always wears earned colour, because only
a book the reader has logged can be one: removing a book's last read takes it off the
reader's favourites as well as off the shelf, so no favourite is ever left to fall back
to ink. A kept passage is held to the same test: a passage belongs to its book, not to a
read, so it can be kept from a book that is not on the shelf, and then Margins gives it
the ink band on a laptop and the ink flood on the phone (`bookBand(passage, onShelf)`);
keeping a passage never earns a book its colour.

**The Refusal Tone Rule.** Alarm red says one thing — *this was refused, or this is
about to destroy something* — and it says it as a stroke or as words, never as a
fill and never as a band. Nothing on this page is ever tinted with it, nothing is
"styled" with it, and it never marks a merely optional or informational state. If a
new surface needs a second red, the answer is that it does not.

**The Word Beside the Colour Rule.** Colour is never the only carrier of a state. A
spent invite is struck *and* labelled "Used"; a refused code is bordered in alarm
*and* explained in a sentence; an unavailable control is ruled through *and* says
what it is waiting for.

**The Browser-Surface Rule.** Surfaces we did not draw still belong to the design.
Selection, caret, scrollbar track and thumb, and the focus ring are all themed to
paper and ink; none may be left at the OS default. The tap highlight is switched off:
a tapped cover-sized link must not flash the platform's grey or blue box, because its
state is the printed ink border. The focus ring is 2px ink at a 2px offset everywhere except on a band that ink would vanish into. On an ink band the ring is paper; on a band whose ground is a book's colour (a book page's author band) the ring is that band's `readableOn()` foreground, because a fixed paper ring vanishes on a pale jacket as surely as ink vanishes on ink. Every control or link set on a band carries its band's ring. Two rings are drawn inside rather than outside, each because an outside ring would be lost against what abuts the control. A slip line's "Edit" hit box fills the line's corner, against the slip's ink head above and the 34rem edge beside it, so its ink ring sits at a −2px offset, inside the box. A spine's link on the to-read list carries a **paper** ring at a −4px offset, inside the ink: the spines above and below it are ink too, so an outside ring loses its top and bottom edges into its neighbours. Those two are the only inset rings in the build; every other ring stays outside its control.

## Typography

**One Font:** Archivo (variable, `wdth` axis loaded), falling back to
`ui-sans-serif, system-ui, sans-serif`. There is no display face, no body face, and
no mono face — there is one family, and it does every job.

**Character:** A grotesque with a genuine width axis, run hard in both directions.
The masthead is set *wide* (`wdth` 118) and tracked out 0.34em; band labels are set
*condensed* (`wdth` 88) and tracked out 0.14em. That contrast — the same letterforms
stretched apart and squeezed together on the same page — is the typographic signature
of the system, and it is what makes a second typeface unnecessary.

### Hierarchy
- **Wordmark** (700, `wdth` 118, 1rem → 1.375rem at ≥640px, 0.34em tracking, caps):
  "MARGINALIA" on the masthead's colour band. This voice belongs to the wordmark
  only.
- **Display** (600, 2.25rem → 3.5rem at ≥640px, lh 0.95, −0.02em): the reader's name
  in the masthead's field band, "Your account" at the head of the account sheet, and
  a book's title on its title page, balanced, breaking an unbroken word rather than
  overflowing, and capped at the title column's 34rem edge. The largest type on the
  page. Both steps are recorded tokens.
- **Headline** (600, 1.75rem → 2.25rem at ≥640px, lh 1, −0.02em): the year on a year
  rule, "Favourites" on the favourites rule, the door's one sentence of proposition, and the title at the head of a
  page-scale type-only jacket (1.75rem, reaching 2.25rem only at ≥64rem, where the
  frontispiece column is wide enough not to break a word). Chronology is the structure the
  shelf is ordered by, so it is drawn at a scale that carries across a viewport
  rather than set in the page's smallest type.
- **Field** (600, 1.375rem, lh snug, −0.01em): the value voice. Every editable value
  in the system but one is set at this step — the name, handle and note on the account
  sheet, the Finished date on the log sheet (in soft ink while the field is empty),
  the handle on the claim form, the confirmation handle in the delete fence, and the
  characters in an invite-code cell (stepping to 1.75rem at ≥640px in the door's
  mask). The masthead's reading span uses the same step at ≥640px, at weight 500 in
  soft ink, because a span is a value too. A book's subtitle takes that same setting
  under its title, and a read's date on the date slip is set at this step at 600, in
  ink, or in soft ink when the line says "Undated". A review permalink signs its
  message at the same step with the reader's name, linking to their diary. Values are larger than their labels here;
  that inversion is deliberate and is what makes a form read as a filled-in sheet.
  The one exception is the log sheet's review, set at the body
  step (see the Value Over Label Rule). A spine on the to-read list sets its title at
  this step in paper, balanced and underlined, because a waiting book's title is the
  value that spine carries. The title at the head of a cell-scale type-only jacket
  takes it too, in ink.
- **Title** (600, 0.8125rem, lh tight, balanced): a book title in an entry's record
  band. Small on purpose — the jacket above it is the identifying object. A favourite's
  record band sets its title one step up, at 0.9375rem, because the cell runs four
  across where the shelf runs six.
- **Body** (400, 0.9375rem / 0.875rem, lh relaxed, soft ink, capped ~34–38rem):
  the empty-shelf guidance, the door's explanation, the delete fence's
  consequences, a book's description (on the title page's 34rem edge), and the
  sentence under a book page's unavailable or not-found band (38rem), and a profile's
  bio in the masthead's field band (38rem). Body copy is
  rare here; this surface is a record, not an article. An imprint value (a year, a
  page count, "Open Library") sits at the body size at weight 500 in ink: a value on
  a ruled line, still larger than its label. A log sheet's review is set at this
  size and leading, weight 400, in ink, by the Value Over Label Rule's named
  exception; the log sheet's general refusal sentence takes the same step in alarm, as do
  the armed removal question in an edit sheet and the refusal that replaces it.
  A review permalink's message is set at this step in ink, one paragraph per blank
  line in the reader's own text, capped at the 34rem value measure rather than 38rem
  because prose at this size runs about 90 characters on the wider one; an entry with
  no words takes the same step in soft ink. A spine's first author takes this step in
  paper at 70%, on one truncated line beneath the title — beneath it, never as a
  tracked-caps label above it.
- **Passage** (400, 1.0625rem, lh relaxed, ink, capped at 34rem): words a reader
  kept from a book — an earlier passage in the Margins journal, and the words field of
  the passage sheet as they are typed. Body voice one step up, because the words are
  the object and are reread rather than skimmed, set in the reader's own line breaks
  (`white-space: pre-line`) with `text-pretty`. A passage's note under it stays at the
  body step's 0.8125rem in soft ink. The latest passage does not take this step: on
  Margins' spotlight it is set by length at display, headline or field (see Margins).
- **Label** (600, 0.6875rem, `wdth` 88, 0.14em tracking, caps): the band voice —
  author name, "Add", "Reread", the tally, a year's book count, a field's label, an
  invite's state, every button on the account surfaces, a book page's author line
  and state line, the date slip's head and count, the log sheet's "Log a read" / "Close" line, a slip line's "Edit" / "Close", its field
  labels, "Reread" beside its tick, and its text buttons, an imprint row's label, a
  review permalink's author band, the read date, "Reread" and "Unrated" on its
  postmark strip and the `@handle` in both its signature and its record band, and a profile's `@handle` under the name in
  the masthead's field band, in soft ink. Two page-scale headings
  ("Invitations", a commit band's verb) run this voice at `wdth` 118 and 0.2em to
  hold a full-width band. Where band-voice text has to wrap — a state line beside a
  link in a record band at 390px, a two-author line in a book page's author band, the
  author at the foot of a type-only jacket — it takes 1.4 leading and balanced lines instead of
  its resting line-height of 1 (the book page's author band takes 1.75, so a focus ring on a
  wrapped author link clears the line above — MRG-090). A spine's "Take it off", a to-read masthead's record
  line and its "To read" link, and the saved line's "On your to-read list" are this
  voice as well.
- **Meta** (500, 0.6875rem, soft ink, tabular): dates, "Unrated", counts, the
  reading span, and on a review permalink the "First published" line and the read
  date under the signature. Field hints, inline errors and the log sheet's
  rating readout ("Unrated", "N of 5", at 500) sit one step up at 0.8125rem, as does
  the address in the claim form's ink band (500, in paper, lowercase).

### Named Rules

**The One Family Rule.** Archivo alone. New weight, new width, new tracking, new
case — never a new face. A second family breaks the system this entire surface is
built on.

**The Tabular Record Rule.** `font-variant-numeric: tabular-nums` is set on `body`
and inherited everywhere. This page is a column of dates and ratings, and
proportional digits make that column ripple.

**The Band Voice Rule.** Condensed tracked-out caps are the voice of *content
carried on a band* — an author, a state, a count, a control, a field's own label.
They are never used as a kicker or eyebrow above a heading, and never as body copy.
A band that carries a live value rather than naming content drops the voice: the
claim form's ink band prints the address the handle becomes, `/@` and the typed
handle, lowercased, at 0.8125rem and 500 in normal case, because a handle is
lowercase. Until the reader types it holds a ruled blank after `/@`, never the
suggestion in the field, so a hint is never printed as if it were already an address.
The band is `aria-hidden`; the field is what a screen reader reads.

**The Value Over Label Rule.** A form's value is set larger than its label: label in
the 0.6875rem band voice, value at the 1.375rem field step, on a ruled line with no
box. A control that inverts this — small value inside a chrome input under a large
heading — is not this system. One named exception, approved by the user: a field
that holds paragraphs of prose — the log sheet's review — sets its value at the body
step (0.9375rem, regular), not the field step, still in ink on a ruled line with no
box and still under its band-voice label. The passage sheet (MRG-110) ships two more
prose fields under the same terms: a passage's words at the Passage step (1.0625rem)
and its note at the body step. Short values stay at the field step — the passage's
page among them — and no other field joins the exception without the same approval.

## Layout

The page is a full-bleed vertical stack: masthead, then the Favourites band when it
is drawn, then year-grouped shelf sections.
There is no centred max-width container and no side gutters at the page level —
bands run edge to edge, which is what makes them read as printed bands rather than
as cards. The account sheet is the same stack: header, one continuous column of
field rows, then the ink-banded sections that are not part of the form.

**Page padding** is 16px, widening to 24px at ≥640px. **Section rhythm** between year
groups is 40px; a year rule sits 12px above its grid. **Band padding** inside a cell
is 8px vertical / 10px horizontal; masthead bands run 20–32px vertical. A field row
runs 20px vertical inside the page padding and is closed by a hairline; on the log
sheet a row runs 16px vertical and 12px horizontal inside the slip's column, on the
same inset as the slip's lines.

**Measure is capped inside the full-bleed column, not by the column.** The band and
the row run edge to edge; the ruled line under a value stops at 34rem and a hint or
a paragraph stops at 38rem, so a value on a laptop sits on a line rather than under
a 1400px stroke.

**The shelf grid** is whole-cell repack at four steps: 2 columns below 40rem, 3 at
≥40rem, 4 at ≥64rem, 6 at ≥80rem. At 40rem and up, cells are separated by a 1px gap over a paper
background, so the join between two cells reads as a single printed hairline.
Across that 1px gap the next cell would paint over a linked cell's 2px-offset focus
ring, so every link in the grid — an Entry Card, a Search Result, the Log Cell — is
raised in paint order while pointed at or focused. Only the stacking changes;
nothing moves.
Chronology runs down the grid; the "Log a book" cell always holds the first position
of the first (most recent) year group.

**Unfilled positions** in a partial row are ruled, not blank. The container paints
one non-repeating linear gradient tiled by `background-size` to the current column
count, and every real cell paints over it — so a partial row shows its empty
positions the way a printed signature does, at the cost of one background and no
filler elements.

**A book page is a title page facing its frontispiece.** Beneath the wordmark band
and the author band sits a two-column grid from 40rem: a jacket column of
min(24rem, 33%) and a title column taking the rest, 40px apart, inside the page
padding, 32px under the band and 40px above the foot. The jacket column is sized to
the jacket, so the title page faces it across one gap rather than across the dead half
of a third. Every block in the title column (title, subtitle, imprint rows, date
slip, description) hangs on one 34rem right edge, so the page reads as a single set
measure and a long title wraps on the same edge as the imprint. The date slip comes
before the description, so a long blurb never pushes the reads out of the first
viewport. The log sheet opens in place inside the slip, on the same 34rem measure,
and pushes the description down rather than covering anything. Below 40rem the columns stack 24px apart, 24px under the band, and the
frontispiece is centred at 60% of the width.

**A review permalink is a card at page scale.** Under the wordmark band, band one
runs edge to edge on a 2px ink rule; the field is a two-column grid from 40rem — a
stamp column of min(20rem, 32%) and a message column of at most 34rem, 40px apart —
inside 24px page padding and 32px of vertical air. Below 40rem the columns stack 32px
apart inside 16px padding and 24px of air, and the jacket is centred at 60% of the
width. The stamp block leads in both layouts, first at 390 and left at 1440, so the
pointer and the keyboard meet the book before the words. The card is not a fixed
ratio: the stamp column holds its size while the message column grows, so a
5,000-character review cannot break it.

**The to-read list is a pile, not a grid.** It runs in one column capped at 48rem,
inside 16px page padding (24px at ≥640px) and 24px of vertical air (32px at ≥640px).
Spines are separated by a 1px paper gap rather than by a border, so the join between
two reads as one printed hairline. Each spine's minimum height is set by its book's
length (3.5rem at 200 pages or fewer, 6rem at 700 or more, rounded to quarter-rems,
4.5rem where the page count is unknown), and its jacket well is two-thirds of that
height wide. Each whole spine is offset from true by a stable 0–3 step — up to 0.5rem
at 390px and 1.5rem at 1440px — and gives that width up, so both its edges move and
the pile never runs past its measure.

**Everything runs in the flow of the page, with one named exception.** The commit
band on the account sheet is `position: sticky; bottom: 0`, and it is the only
viewport-pinned element in the build. It is scoped to the whole account column
rather than to the `<form>` — sticky only holds inside its own containing block, so
a band nested in the form would unpin exactly where the reader scrolls past the last
field, which is the stretch of page where unsaved work must not go quiet. It reaches
the form by `form` id instead of by nesting. The log sheet's commit band is a second
commit band, not a second pin: it sits at the foot of its sheet, in the flow.
This holds at 40rem and up; below it the phone adds the floating bottom bar and
sticky year rules (see Below 40rem: Now Reading, The Thumb Reach Rule).

**Both viewports are primary.** Neither the 390px nor the 1440px layout is the
fallback; a change that only holds on one of them is not finished.

### Named Rules

**The Edge-to-Edge Rule.** At 40rem and up, bands span the full viewport width. Never inset a band
inside a container to make it look like a card. The one band set to a measure is a
band that heads an object on that measure: the date slip's head runs to the title
column's 34rem edge and no further. It is never boxed; what it heads closes on ruled
lines, not on a border.

**The Ruled Signature Rule.** An incomplete row shows ruled empty slots. Never
centre a short row, never stretch cells to fill it, and never insert placeholder
cards to square it off. Below 40rem the empty slots are left as night rather than
ruled; a short row is still never centred or stretched.

**The One Pin Rule.** At 40rem and up, bands run in the flow of the page. The single exception is the
commit band, which pins to the foot of the viewport *only while unsaved work
exists* and is not rendered at all otherwise — the exception is paid for by the
promise that the page never silently holds work. Nothing else floats, sticks, or
overlays: no sticky header, no toast, no floating action button, and no second
pinned band alongside this one. The log sheet's commit band runs in the flow and
never pins; the exception stays the account sheet's. Below 40rem the phone has a
second pin, the floating bottom bar, and its year rules stick to the top of the
viewport; the Thumb Reach Rule governs that width.

## Elevation & Depth

**At 40rem and up there is no elevation.** No `box-shadow` exists in the Tri-band
world, and none may be added to it; the phone's soft depth is scoped below 40rem. Depth is entirely tonal and structural: paper against sunk paper, ink
against paper, a 15%-alpha hairline against both. A jacket sits in a sunk-paper well;
that recession is the only "depth" the system has, and it is a colour step, not a
light source. The pinned commit band is separated from the column behind it by a 1px
solid ink rule and an opaque paper ground, not by a shadow.

There is likewise no gradient shading at this width. The single Tri-band
`linear-gradient` is a *drawing* device — it rules the shelf's column lines — not a shade.

### Named Rules

**The Flat Ink Rule.** At 40rem and up, every surface is flat at every state. Hover and
focus change *colour* (the "Add" cell floods with the fiction band), never height,
never blur, never a shadow. Nothing on this page casts light. A press may give
(scale 0.965) at every width; that is motion, not depth.

## Shapes

Square, at 40rem and up (the phone rounds; see Below 40rem: Now Reading). Every cell, band, rule, and well ships with a 0px radius; the corners of a
paperback are the corners of this system. A `rounded.band` token of 2px exists in the
theme as the absolute ceiling the direction contract set, but **no shipped surface
consumes it** — treat 2px as a limit, not as a default, and prefer 0.

Form language is rectangles and rules only: 1px hairlines in `{colors.rule}` between
and inside cells, 1px solid ink around the "Add" cell, above and below a year rule,
and around the delete fence; a 2px solid ink rule between the wordmark band and a
book's author band, which a fallback band can match in colour and over a hairline
would merge with; a 2px ruled line under an editable value, and the same 2px line
closing the date slip as its "Log a read" line; a 20px square in a 1px hairline,
ink once ticked, around the reread tick; and a fixed 2:3 jacket frame that never crops,
hairline-bordered where it stands alone as a frontispiece. The single non-rectangular shape in the system is
the drawn rating mark. Icons and separators are authored SVG paths at 1.5px stroke
with square line caps — including the log line's plus and minus, the reread tick,
and the dash between the two halves of an invite code,
which is drawn rather than typed so a screen reader never spells it as part of the
code. Never an icon font, never an emoji, never a glyph character. The phone's
bottom-bar icons are the one round-capped set; the bar's drawn quote mark (Margins)
reappears at 16px on the book page's "Keep a passage" line, so the place and the act
of keeping share one mark.

State is drawn in the same vocabulary. At 40rem and up there is no chrome control: no
filled input box, no pill, no toggle, no badge. What changes between states is the
weight, tone, or presence of a printed mark.

### Named Rules

**The Printed State Rule.** Control and field state is carried by a mark on the
page, not by chrome:
- **At rest** — a hairline (`{colors.rule}`): an empty code cell, an unedited field's
  ruled line, a control that is not yet available, the date slip's closing
  "Log a read" line, a text button's underline, the reread tick's empty box, a link's
  underline (hairline tone on paper; the band's foreground at 40% on a band; alarm
  at 40% inside a refusal sentence), and the claim band's blank after `/@` (a 4rem,
  1px line in the band's foreground at 50%).
- **Filled or focused** — the same stroke at solid ink: a code cell holding a
  character, a field being typed in (`focus-within`), a search result under the pointer
  or keyboard focus, a date-slip line under the pointer or on keyboard focus (its own
  2px line is transparent at rest and drawn in ink there), the log line and its words under the pointer, on keyboard focus and
  while its sheet is open, a date-slip line's 2px line while its edit sheet is open,
  the underline under a slip line's "Edit" under the pointer and while open, a ticked reread box (with its tick drawn in), a text
  button's or link's underline under the pointer (the band's full foreground on a
  band; full alarm inside a refusal sentence).
- **Current** — the stroke thickened to 2px solid ink, with `aria-current`: the order
  the shelf is shelved by, on the shelf-order line. It is thicker than the 1px ink a
  hovered neighbour takes, so a pointer resting on another order never reads as the
  current one.
- **Where a carried book would land** — the focus ring's mark, 2px ink at a 2px
  offset, on the favourites position under the pointer; the carried cell itself takes the
  Entry Card's hover mark — border and record rule in solid ink — from the moment it
  is lifted, so a touch reader sees the hold arm.
- **Awaiting the next keystroke** — sunk paper as the cell's ground, so the position
  the next character lands in is visible without a blinking cursor.
- **Refused** — the stroke redrawn in alarm red, on the field that failed and on
  every cell of a refused code, with a sentence in the same tone. A refusal with no
  field of its own is the sentence alone, above the commit it refused.
- **Unavailable** — a rule run through the control's own label (`line-through`) at
  50%, never a greyed box and never a removed control.
- **Spent** — a 1px ink bar struck across the whole object, which keeps its cells and
  its characters so the record of it survives; the tone steps down to soft ink
  (6.4:1) rather than fading below legibility.

Add a state to this vocabulary only as another mark. A new state that needs a fill,
a badge, or a rounded chip is a state this world does not have yet.

## Components

### Entry Card (signature component)

The tri-band cell, and the object the whole system exists to repeat. Character:
printed, impersonal, identical to its four hundred neighbours.

- **Shape:** square (0px), 1px hairline border in `{colors.rule}`, paper ground.
- **Band one — colour:** the book's conditioned cover colour, or its stable fallback,
  flooded edge to edge. Carries the first author in label type, plus a "Reread" label
  at 80% opacity when relevant. Foreground from `readableOn()`.
- **Band two — field:** a fixed 2:3 well on sunk paper. The jacket is `object-contain`
  — letterboxed on paper, never cropped, because a cropped jacket loses its
  typography. With no cover, the well holds the cell-scale type-only jacket (see
  Cover); that is a real state with a real setting, never a broken-image icon.
- **Band three — record:** paper, separated by a hairline, 8px/10px padding. Title
  (balanced) on top; rating and date pinned to the bottom edge of the cell so the
  baseline holds across a ragged row.
- **States:** for a signed-in reader — on their own diary or a friend's profile — the
  whole cell is one link to its book page, named as one sentence (title, author,
  rating, read date, reread). Hover and focus-visible take the border and the record
  band's hairline to solid ink, as on a Search Result, with the standard focus ring;
  it never lifts, tints or fills. For a signed-out visitor the book page does not
  exist, so the card is inert: no link, no state.

### Search Result

An Entry Card with the colour held back: a book that is not on the shelf yet.
Colour is what a book earns by being logged. A jacket colour is only extracted once
a book is logged, so a result showing a fallback band would change colour at the
moment it was taken.

- **Shape:** the Entry Card's frame on the shelf grid — square, 1px hairline, paper
  ground, stretched to its row so the year holds one baseline across a ragged row.
- **Band one — ink:** ink ground, the first author in paper label type ("Author
  unknown" when there is none). Never a band colour, conditioned or fallback.
- **Band two — field:** the same 2:3 sunk-paper well and Cover, including the
  typographic no-cover jacket, which is the common case in search results, not a
  rare one.
- **Band three — record:** the title (balanced) over the first-published year in
  soft-ink meta, pinned to the foot of the cell.
- **Hover / focus-visible:** the cell's border and the record band's hairline both
  go to solid ink, per the Printed State Rule. Nothing fills: sunk paper marks the
  position awaiting the next keystroke, not the thing under the pointer.
- **Unavailable:** when Open Library does not answer, the grid is replaced by one
  sentence of soft-ink body copy on a full-width sunk-paper band. Not alarm, because
  nothing was refused. It is kept visibly apart from "no matches", which is plain
  soft-ink body copy on paper.
- **Showing more:** books added by "Show 20 more" fill the partial row's ruled slots
  and then the rows below; the books already shown never move.

### Log Cell (primary action)

The primary action shaped as an entry, so an empty shelf reads as one card that *is*
the action rather than a blank page with a button stranded above it. Two sizes: the
in-grid cell, and an `emphatic` variant used alone on the empty shelf.

- **Shape:** square, 1px **solid ink** border — the one full-strength border in the
  grid, and the only thing that distinguishes it from a book at a glance.
- **Bands:** ink band labelled "Add"; a 2:3 well holding a 34px (44px emphatic)
  drawn plus at 1.5px stroke with square caps; a record band reading "Log a book",
  with one sentence of guidance in the emphatic variant.
- **Hover / focus-visible:** the whole cell floods with the fiction band and all
  foreground flips to the contrast-chosen tone. Colour only; nothing moves.

### Spine (signature component)

A book waiting to be read, lying in the pile: a single ink band on paper, and the
object the to-read surface is made of. Character: a paperback seen edge-on on the
bedside stack, not a row in a list.

- **Shape:** square (0px), no border — an ink band on the paper page, its neighbours a
  1px paper gap away. It is not a tri-band cell: a waiting book has one thing to say,
  and three bands would promise a record it does not have yet.
- **Ground:** ink, always, per the Earned Colour Rule. No band colour, no fallback.
- **Words:** the title at the field step in paper, balanced, underlined in paper at 40%
  and going to full paper under the pointer and on keyboard focus; the first author
  beneath it at the body step in paper at 70% ("Author unknown" where there is none),
  truncated to one line.
- **Thickness:** the spine's minimum height is its book's length, so a thick book sits
  thick in the pile (see Layout for the mapping).
- **Jacket well:** at the spine's end, a 2:3 well at the spine's minimum height, parted
  from the words by a paper hairline at 20%, holding the Cover. A title that wraps
  grows the spine past that minimum, and the jacket then sits whole and centred with
  the spine's own ink above and below it — **never cropped to fill the well**; the
  never-crop rule outranks a full well. **A book with no cover has no well at all:** the
  ink runs to the end rather than framing nothing. It is the one place in the build
  where a missing cover is answered by absence rather than by a drawn setting, because
  a spine has no second band to hold a type-only jacket.
- **Take it off:** band voice in paper, underlined at 40%, inside the spine's own
  footprint at every width — outside the title link, since a control may not live in a
  link, and before the jacket. Pending, its label becomes the live readout
  ("Taking off…").
- **Lie:** each whole spine lies off true by its stable step (Layout, Stable Colour
  Rule). Newest saved on top. Nothing tilts and nothing casts a shadow at 40rem and up; a
  spine reveals on scroll and gives under a press, as a cell does (Motion).
- **Links and focus:** the words are the link to the book's page; the jacket is a
  second link to the same page, `tabIndex -1` and `aria-hidden`, so the ring bounds the
  words while the whole spine is clickable. That ring is the paper inset exception of
  the Browser-Surface Rule. After a spine is taken off, focus goes to the next spine's
  "Take it off", else the previous one's, else the page heading, unless the reader has
  moved elsewhere.
- **Refusal:** printed under the spine it happened to, on that spine's own offset,
  never once under the whole stack: the sentence at the body step in alarm, its "Sign
  in again" link underlined in alarm at 40% and in full alarm under the pointer.
- **Empty:** the outline of the first spine, drawn rather than described — a 4.5rem
  hairline box with its jacket well ruled in, "Nothing waiting" at the field step in
  soft ink — then the sentence saying how a book gets here, and a "Search for a book"
  Outline Button. The pile shows what it will be; it is never mocked up with invented
  books.

### Want to Read

The one press that keeps a book without logging a read, set on a book page between the
imprint rows and the date slip, on the same 34rem measure. Character: a line printed on
the sheet, never a filled badge and never a toggle.

- **Not on the list:** an Outline Button reading "Want to read". Pending, it reads
  "Saving…" in the same grid cell at a held width and keeps its flood under the pointer
  or focus.
- **On the list:** a ruled line closed by a hairline, 12px vertical — the reread tick's
  20px hairline box with its drawn tick, "On your to-read list" beside it in band voice,
  and at the right end "Your list" and "Take it off" as Text Buttons. At 390px the two
  halves wrap rather than shrinking.
- **Refusal:** the sentence at the body step in alarm under the line, with "Sign in
  again" where the reader is signed out. Taking off has its own wording ("Not taken off:
  you’re signed out."), never the saving sentence reused.
- **Announced:** a visually hidden readout says "Saved to your to-read list." or "Taken
  off your to-read list."; the same readout stands under the pile when a spine goes.
  After either, focus goes to the replacement's first control — "Your list" once saved,
  the button once taken off — unless the reader has already moved elsewhere.
- **Pending keeps focus:** a pending control here is `aria-disabled` and ignores
  presses; it is never natively disabled, which would drop a keyboard reader's focus to
  the page for the length of the request.

### Favourite

A read book's place among the reader's four, set on a book page after the date slip and
before the description, on the 34rem measure. It is drawn only once the slip holds a
read, because only a read book may be a favourite. Character: Want to Read's printed
line, one step further along.

- **Not a favourite:** an Outline Button, "Add to favourites". Pending, it reads
  "Adding…" in the same grid cell at a held width and keeps its flood under the pointer
  or focus.
- **A favourite:** Want to Read's saved line — a ruled line closed by a hairline, the
  drawn tick in its 20px hairline box, "One of your favourites" in band voice, and at
  the right end "Your favourites" (to the diary) and "Take it off" as Text Buttons,
  "Taking it off…" while it runs. With two or more favourites the line adds its place
  in soft ink ("· 2 of 3"), and "Earlier" and "Later" lead the Text Buttons, ruled
  through at an end; focus passes to the other when the pressed one reaches an end.
  They are the single-pointer way to arrange (WCAG 2.5.7), chosen by the user on
  2026-09-23 so the diary's band stays drag-only.
- **At four:** the button stays, ruled through (the Outline Button's disabled mark),
  with one soft-ink 0.8125rem line beside it: "You have four already. Take one off from
  its own page to make room." and a "Your favourites" link.
- **Refusal:** one body-step sentence in alarm under the control, with "Sign in again"
  when the reader is signed out.
- **Announced:** a visually hidden readout says "Added to your favourites." or "Taken
  off your favourites.". After either, focus goes to the replacement's first control —
  "Your favourites" once added, the button once taken off — unless the reader has
  already moved elsewhere.
- **Pending keeps focus:** as on Want to Read, a pending control is `aria-disabled` and
  ignores presses, never natively disabled, so a keyboard reader's focus stays on it.

### Masthead (page-scale tri-band)

The same three bands at page width, differentiated by *ground* rather than by size —
colour, paper, ink — because two thin ruled paper strips in a row would read as one
device repeated, and the year rule immediately below is already a ruled strip.

- **Band one:** fiction orange; wordmark left, "A reading diary" in label type at 80%
  opacity right. This band ships on its own (the wordmark band) at the head of every
  page that has no reader to name yet — the door, the claim form, the account sheet.
- **Band two:** paper; the reader's name at display scale left, the reading span in
  tabular soft ink right. The span is structural: it holds the name field's right
  edge so the band is not one word floating in a thousand pixels of paper. The name
  and the span keep a row of their own, so the span stays on the name's baseline at
  every width. On a profile, and only there, the `@handle` follows under that row in
  band voice, in soft ink, breaking anywhere rather than overflowing at 390px; then
  the bio as body copy in soft ink, capped at 38rem, each 12px under the line above.
  With no bio there is no line and nothing stands in for it. The reader's own diary
  shows neither. A page that is not a diary names itself in this band the same way: the
  to-read list sets "To read" at display scale with its count holding the right edge,
  and Margins sets "Margins" with "N passages" there.
- **Band three:** ink ground, paper text, the tally in label type ("11 books logged"
  / "Nothing logged yet") left, and the way onward right. The left words are a tally by
  default; a page that is not a diary gives them directly instead — the to-read list
  reads "Newest saved on top", or "Saved from a book's page" when nothing is waiting;
  Margins reads "Newest kept first", or "Kept from a book’s page" with nothing kept.
  The right end carries one way onward or several: several are a `nav` labelled "Your
  pages", 20px apart. On the reader's own diary they are "To read" (`/to-read`),
  "Margins" (`/margins`), then "Your account" (`/settings`); on Margins they are "Your
  diary" then "To read". On a profile it is one link, and which depends on who is
  looking: the owner, on their own profile, keeps "Your account"; a signed-in friend gets
  "Your diary" (their own `/`); a signed-out visitor gets nothing, only the tally. Every
  link on this band carries the paper focus ring. This band remains the page's ruled
  foot; a separate nav bar would be a fourth band this page does not have. This band
  also ships on its own under the search field: the search's state ("5 books", "Searching Open
  Library…") left, and "Your diary" right. A book page's states open with the same
  ink band on its own: "Opening this book…", "Book unavailable" or "Book not found"
  left, "Your diary" right.

### Year Rule

A full-width ruled band on sunk paper, bordered top and bottom in solid ink: the
group's name at headline scale left, its book count in soft-ink label type right. It
is a band, not a hairline, because the grouping is the shelf's organising structure —
a year by default, or an author or a category (MRG-072). A long name ("Biography &
Autobiography", "Emily St. John Mandel") wraps balanced at 390 and the count never
shrinks off the band. The group with nothing to file it under — "Undated", "Unknown
author", "Uncategorised" — comes last, its name in soft ink.

### Shelf-Order Line

One line on the page margin between the Favourites band (or the masthead, when it is
not drawn) and the first group: "Shelved by" in band voice and soft ink, then "Year",
"Author" and "Category" as Text Buttons, the current one in the current mark. They are
plain links carrying `?by=`, so the order works without script, keeps the reader's
scroll position, and a sorted shelf can be shared; an unknown value falls back to
Year. The same on the owner's diary and on a profile; not drawn on an empty shelf.
The Log Cell leads the first group in the Year order only — Author and Category are
for looking back. MRG-069's language choice is meant to reuse this line.

### Favourites Band

Up to four books the reader has chosen, between the masthead and the shelf-order line:
the shelf's own cell at a larger scale, so the band reads as a statement drawn from the
shelf rather than a second list. Character: the four books pulled forward on the shelf.

- **Rule:** the Year Rule's anatomy — sunk paper, solid ink top and bottom — headed
  "Favourites" at the headline step, the count right in soft-ink band voice: "N of 4"
  for the owner on their own diary, "N books" in public. The grid hangs 12px under it.
- **Grid:** 2 columns, 4 from 40rem, joined on the shelf's 1px hairline gap in both
  directions. Each linked cell rises in paint order under the pointer and on focus, as
  on the shelf grid.
- **Four positions, always:** an empty position is a hairline frame (`aria-hidden`)
  that the row stretches to its neighbours' height. The frames are drawn as positions of
  their own rather than by the shelf's column gradient; they are the Ruled Signature
  Rule's empty slots, never placeholder cards.
- **Cell:** the Entry Card, with the record band holding the title alone at 0.9375rem
  (600, tight, balanced). A coverless favourite's type-only jacket is set at
  `scale="band"`: its title steps up to the headline at ≥64rem (see Cover). Every favourite is logged, so its colour band always wears
  earned colour. A signed-in viewer's cell is one link to its book page, named by title
  and author, with the Entry Card's hover and focus; a visitor's is inert, as on the
  shelf.
- **Arrange:** on the owner's own diary `/` only, by dragging the cells themselves;
  there is no control row. The owner on their own `/@handle` sees the public band, with
  nothing to change it by.
  - *Mouse:* press a favourite and drag it onto another's position; the rest close up
    behind it. A press that travels under 6px stays a click on the link, and a drag
    never opens the book.
  - *Touch:* press and hold for 350ms, then drag. A swipe that moves before the hold
    scrolls the page as normal. The long-press callout and text selection are
    suppressed on these cells.
  - *Keyboard:* Alt with an arrow key moves the focused favourite one place — Left and
    Up earlier, Right and Down later — and focus stays on it. At an end nothing moves.
    Dragging is never the only way.
- **Printed state while arranging:** the position a carried book would land in takes a
  2px ink ring at a 2px offset, the focus ring's mark. The carried cell follows the
  pointer, raised in paint order, its border and record rule in solid ink (the Entry
  Card's hover mark, which a touch reader otherwise never sees, and which shows the
  moment a touch hold arms) and nothing else: no shadow, no tilt, no fill. That
  is direct manipulation, not an authored motion — no transition, no easing — so the
  One Moment Rule stands. The cursor is grab over a cell, grabbing while one is carried. The position the book was lifted from stays in the grid, drawn as an empty position (a hairline frame) until the book is dropped.
- **Hint:** on the owner's diary only, one soft-ink 0.8125rem line under the grid, which
  every favourite's link is `aria-describedby`: "Drag a book to arrange them, or hold
  Alt (Option on a Mac) and use the arrow keys." on a fine pointer, "Press and hold a book, then drag it
  to arrange them." on a coarse one.
- **Order:** it changes at once and settles on what the server returns, so a refused
  move falls back. A visually hidden readout announces each move: "{title} moved to N
  of M."
- **Empty:** the owner with no favourites but at least one read gets the rule ("0 of 4")
  over the soft-ink hint line at the body step, capped at 38rem. With no reads, and for
  anyone else looking at none, the band is not drawn.

### Book Title Page (page-scale tri-band)

One book, opened: the tri-band frame at page scale, run beneath the wordmark band.
Character: a paperback's title page facing its frontispiece, not a store's product
page.

- **Band one, author:** full width, 12px vertical inside the page padding. The author
  line in band voice at 1.75 leading with balanced lines ("Author unknown" when there
  is none; past three names, two and a count) left, "Your diary" right. When the
  book was opened from a search, "Your search" stands before "Your diary" (same
  link style, 16px apart) and leads back to that search with both fields and the
  "show more" count kept. The two links stay on one row at 390 — stacked they fail
  2.5.8 spacing and crowd each other's focus ring — so the author line wraps
  instead. Its ground
  follows the Earned Colour Rule, and its foreground, its link underline (40% of the
  foreground at rest, full under the pointer) and its focus ring all come from
  `readableOn()`. A 2px solid ink rule parts it from the wordmark band, which a
  fallback band can match exactly.
- **Band two, frontispiece and title page:** the jacket in a 2:3 sunk-paper well with
  a hairline border, facing the title column (see Layout). In that column: the title
  at display scale, the subtitle at the field step in soft ink, the imprint rows, the
  Want to Read control, the date slip, the Favourite control once the slip holds a
  read, the Keep a Passage line (shown whether or not the book has a read: a passage
  is kept mid-book as readily as after), then the description in soft-ink body copy.
- **Imprint rows:** a list opened by a hairline, one row per known value, each closed
  by a hairline, 10px vertical. The label sits left in soft-ink band voice and the
  value right on the same baseline, at body size, weight 500, in ink. A value Open
  Library did not have omits its row rather than printing a dash. The last row,
  "Source / Open Library", is always present and links out to the record, underlined
  in hairline tone and going to ink under the pointer.
- **Own-copy notice:** when the reader already has this book as another row, one soft-ink
  sentence (0.8125rem) after the imprint on the 34rem measure, with a link to that copy
  named for its source. It warns and never refuses: no band, no alarm, and logging stays open.
- **Band three, record:** the Date Slip, set in the title column straight under the
  imprint rather than as a third full-width band.
- **States:** the page has none of its own; its two links and the date slip's "Log a
  read" line respond to hover and focus, only in colour, and that line deploys the
  Log Sheet in place, as each slip line's "Edit" deploys it in edit mode under that
  line.

### Date Slip

The record band of a book page: this reader's own reads of the book, one ruled line
each, closed by the line the next read goes on. Character: the slip pasted into a
library book, saying "your reads", never "due".

- **Head:** an ink band on the 34rem measure, 10px/12px padding. "Your reads" (the
  section's heading, in band voice) sits left and the count in band voice right: "Not
  on your shelf", "Read once", "Read twice", then "Read N times". The heading takes
  focus by script only (`tabIndex -1`, the paper ring of an ink band): focus returns to
  it after a removal, and a visually hidden live readout says "Read removed."
- **Lines:** newest first, undated last, each closed by a hairline, 12px padding. The
  date sits left at the field step (600, ink), or "Undated" at the same step in soft
  ink. On the right: a soft-ink "Reread" label when relevant, then the drawn Rating
  in ink, or "Unrated" in soft-ink meta. At 390px the two halves wrap rather than
  shrinking the date. **Each line is the link to that read's permalink** — the whole
  line, never a word inside it, bar the 4.5rem it leaves at its right end for Edit. At
  rest it carries no mark of its own beyond the hairline that closes it; under the
  pointer and on keyboard focus it draws a 2px line in solid ink and nothing fills,
  which is the Search Result pattern. Its accessible name is the read itself: the date,
  the rating or "unrated", and "reread" when it applies.
- **Edit:** a separate native `<summary>` laid over the line's right end rather than
  inside the link, because a control may not live in a link. Its hit box is the line's
  full height and the width the link leaves it (56px × 64px), so a thumb near the word
  opens Edit and not the permalink; the word sits right, 12px in. "Edit" in band voice,
  soft ink at rest and ink under the pointer and while open, underlined on the word
  only — hairline at rest, ink under the pointer and while open. Open, the visible word
  becomes "Close" while "Edit" stays the accessible name, as the log line does, and the
  line's own 2px line is drawn in ink, the same open mark the log line carries. Its
  focus ring is the inset exception of the Browser-Surface Rule. Colour only; nothing
  moves.
- **Closing line:** the summary of the Log Sheet, standing where the next read goes.
  A 3.25rem line, 12px horizontal padding, closed by a 2px rule: "Log a read" in band
  voice left, a 14px drawn plus (1.5px stroke, square caps) right. It is the Field
  Row's resting ruled line, labelled with what goes on it. A book not on the shelf
  shows the head and this one line.
- **States:** at rest the words and the plus are soft ink over a hairline-tone rule.
  Under the pointer and on focus-visible, words, mark and rule go to solid ink, with
  the standard focus ring. Open, the line stays ink, the visible word becomes "Close"
  and the plus loses its upright to become a drawn minus; "Close" is `aria-hidden` and
  "Log a read" remains the accessible name, so the disclosure is announced as "Log a
  read, expanded", never "Close". The line itself changes colour only; the sheet under
  it eases open (Motion).

### Log Sheet

The date slip's closing line, deployed in place: a native `<details>` whose summary is
that line and whose body is a short form in the Field Row language. It opens without
JavaScript, inside the slip's 34rem column, and pushes the description down. There is
no modal, no overlay, and no navigation. Character: the slip's next line, filled in.
The same sheet ships in an edit mode, deployed under a slip line by its "Edit" (see
Date Slip) and holding that read as it stands.

- **Rows:** 16px/12px, each closed by a hairline. The label sits above in soft-ink band
  voice and the value 8px under it. A value on a line takes the 2px ruled line:
  hairline at rest, ink on `focus-within`, alarm when it is what was refused. A
  refused field's sentence prints under its row at 0.8125rem in alarm, and everything
  typed stays where it was.
- **Finished:** a native date field at the field step (1.375rem, 600), prefilled on
  first opening with today in the reader's own zone and capped at it. Empty, it is
  set in soft ink, so the browser's "mm/dd/yyyy" never reads as a date; the slip sets
  Undated the same way. Beside it, an "Undated" Text Button empties it. Under the line,
  a soft-ink 0.8125rem hint gives the date in the slip's own words — "Logs as 11 Sept
  2026", or "Logs as Undated" — because a native field prints in the browser's locale
  order.
- **Rating:** the drawn Rating at 32px in ink, with one real range input (0 to 5 in
  half steps) lying over the marks: the Code Cells pattern. Its track is transparent
  and its thumb is a transparent 1px sliver the marks' height, so where the reader
  taps is the value, and drag, arrow keys and a screen reader all work. The focus ring
  is drawn around the marks, not around an invisible input. Beside them sit the
  readout, "Unrated" or "N of 5", in soft ink at 0.8125rem/500, and a "Clear" Text
  Button. Untouched means unrated.
- **Review:** a textarea on the ruled line with no box, set at the body step (0.9375rem,
  400, relaxed leading) in ink, by the Value Over Label Rule's named exception. Its
  placeholder, "Optional", is plain soft ink. It grows with its text where
  `field-sizing: content` is supported and starts at three rows elsewhere; no resize
  handle.
- **Reread:** a printed tick. A 20px paper square in a 1px hairline beside "Reread" in
  ink band voice; ticked, the square's border goes to ink and a drawn tick (1.5px,
  square caps) appears inside it. Preselected when the slip already holds a read.
- **Refusal without a field:** one body-step sentence in alarm above the commit band —
  "Not saved: you’re signed out. Sign in again to log this read.", with "Sign in
  again" linking to the door, or "Not saved: this book is no longer here. Find it
  again from search." In edit mode the signed-out sentence ends "Sign in again to save
  these changes."
- **Commit:** a Commit Band in the flow at the foot of the sheet, 16px under the last
  row, reading "Save this read", then "Saving…" while the save runs.
- **Edit mode:** the rows open prefilled with the read — its date, or an empty field
  that logs as Undated; its rating; its review; its reread tick — and a new read's
  today is never written over them. The commit band reads "Save changes" ("Saving…"
  while it runs), and a visually hidden live readout says "Changes saved."
- **Remove (edit mode only):** under the commit band, 16px/12px, a Text Button
  "Remove this read". Pressed, it arms: the button is replaced by one body-step
  (0.9375rem) sentence in alarm, "Remove this read for good? Its page goes too.", over
  an Outline Button "Remove" in its armed state and a Text Button "Keep it", 16px apart.
  Focus lands on "Keep it"; kept, the sheet returns to "Remove this read" with focus on
  it. While the removal runs, "Remove" reads "Removing…" at full strength and "Keep it"
  is ruled through at 50%. A refusal ("Not removed: …") replaces the question at the
  same body step, so the sheet never stacks alarm sentences at two sizes; it shows only
  on the refused read's sheet and is cleared by "Keep it" or by arming again. Two
  presses, no typing and no undo: a diary line is not an account. The removed read's
  line, sheet and permalink go with it.
- **After a save:** the sheet remounts closed and empty, focus returns to the "Log a
  read" line, and a visually hidden live readout says "Read saved." ("Read saved — N
  logged this visit." on later saves, so its words change every time). The page
  re-renders, and the new line at the top of the slip, with its updated count, is the
  confirmation: a record, not a toast. Nothing animates.

### Book States

The book page's other outcomes, each opened under the wordmark band by the masthead's
ink record band on its own (state left, "Your diary" right, paper underline and
focus ring). None uses alarm, because nothing in them was refused.

- **Opening:** "Opening this book…" as a live `<output>` in the band, over the page's
  frame drawn empty and `aria-hidden`: the frontispiece as a hairline-bordered
  sunk-paper well, the title as a 2px hairline-tone ruled line, and three hairline
  imprint rows. These are ruled empty positions, as an unfilled shelf position is
  ruled, never skeleton shapes pretending to be a book, and nothing moves.
- **Unavailable:** "Book unavailable" in the band, then one sentence of soft-ink body
  copy on a full-width sunk-paper band closed by a hairline. This is search's
  unavailable setting, kept apart from not-found so a reader never hunts for a typo
  that is not there.
- **Not found:** "Book not found" in the band, one soft-ink sentence on paper, and an
  Outline Button, "Search for a book", as the way on.

### Review Postcard (page-scale tri-band)

One diary entry as a card from its reader, and the surface a shared link opens: the
tri-band frame at page scale, run beneath the wordmark band. Character: a postcard —
the jacket franked as the stamp, the book addressed beside it, the reader's words as
the message, their name signing the foot. Neither of the review-site defaults: not a
rating-first product block with a comment under it, and not a blog post with a byline
header over an article.

- **Band one, colour:** full width on a 2px solid ink top rule, 12px vertical inside
  the page padding. The author line in band voice at 1.75 leading with balanced lines,
  on the book's earned jacket colour — `bookBand(book, true)`, the Earned Colour Rule
  with the flag already earned — and its `readableOn()` foreground. The author is
  named here and nowhere else on the card.
- **Band two, field:** the two-column grid of Layout, stamp block left at 1440 and
  first at 390, message right.
- **Stamp block:** the page-scale Cover in a fixed 2:3 hairline-bordered sunk-paper
  well, the same well the frontispiece uses, centred at 60% of the width below 40rem.
  Under it the title at the headline step (1.75rem), which links to the book page for
  a signed-in reader and is plain text for a visitor, because the book page is
  signed-in only and a door that will not open is not a link. Then "First published
  YYYY" in soft-ink meta, which omits its line rather than printing a dash when the
  year is unknown. Then the postmark: an ink strip at the date slip head's 10px/12px,
  the read date in band voice left, "Reread" and the drawn Rating — or "Unrated" — right,
  the marks drawn in paper so they carry the strip's own tone.
- **Message:** the review at the body step in ink, one paragraph per blank line in the
  reader's own text, on the 34rem value measure. With no review the card says so in a
  soft-ink sentence naming the reader, rather than leaving the field blank: every
  entry has a page, reviewed or not, and a diary entry is not a rating.
- **Signature:** at the foot of the message column, 32px down and over a hairline: the
  reader's name at the field step linking to their diary, underlined in hairline tone
  at rest and ink under the pointer; the `@handle` under it in soft-ink band voice;
  then the read date as "Read 14 Aug 2026", or "Read at some point" when the read is
  undated.
- **Band three, record:** ink ground, the `@handle` left in band voice, and "Your
  diary" right for a signed-in reader only — underlined in paper at 40%, full paper
  under the pointer, with the paper focus ring. A signed-out visitor gets the band
  with the handle alone; the page is public, so it must close without offering a door
  that will not open.
- **States:** none of its own, and no motion. Its links respond in colour only.
  Undated, unrated, reread, no cover (the page-scale type-only jacket), no review, and
  signed out against signed in are all real settings with real copy.

### Margins (page-scale tri-band)

The reader's private commonplace book (`/margins`, MRG-110): the words lead, a jacket
is only ever a small stamp, so the page never reads as a second shelf and never as a
wall of quote cards. Newest first. At 40rem and up it runs under the masthead (see
Masthead); below 40rem see Margins Spotlight (phone).

- **Spotlight:** the latest passage owns the first viewport as a quotation, in a
  44rem column (24px side padding, 40px top). A full-column band in the book's colour
  (Earned Colour Rule; foreground from `readableOn()`) heads it, 12px/16px, and *is*
  the link to the book: "Title · Author · p. 214" in band voice, the title underlined in
  the foreground at 40%, the focus ring in the band's foreground. Under it the words
  on paper, in ink, at 600 and sized by length, so neither the page name nor a heading
  ever outranks them and a long passage steps down rather than running a viewport of
  display type: up to 80 characters at Display (3.5rem, lh 1.02), up to 240 at
  Headline (2.25rem, lh 1.12), longer at the Field step (1.375rem, lh snug). The
  opening quotation mark hangs outside the measure in the gutter at 50%, so the
  words' first line stands on the same edge as the stamp and note under them. The
  band already carries the credit, so the stamp under the words keeps only its
  jacket; then the note in soft-ink body copy (34rem), then "Edit".
- **Journal:** the earlier passages as one column — 41rem at 40rem and up, 16px
  gutters below — opened by a hairline, each passage closed by one (none after the
  last), 28px vertical. Each is the words at the Passage step on the 34rem measure,
  the stamp, the note at 0.8125rem in soft ink, and "Edit". Each rises in on reveal.
- **Stamp:** where a passage came from, and the link to its book (the jacket travels
  there as from the shelf). A small 2:3 jacket in a hairline-bordered sunk-paper well
  (2rem wide in the journal, 2.75rem under the spotlight), 12px beside the title at
  the Title step (0.9375rem under the spotlight), underlined in hairline tone and ink
  under the pointer, over "Author · p. 214" at 0.8125rem in soft ink, both truncated
  on one line. A missing page omits its part rather than printing a dash.
- **Edit:** a native `<summary>` Text Button, "Edit" in soft ink becoming "Close" in
  ink when open, that deploys the passage sheet (see Keep a Passage) in edit mode
  under the passage, between hairlines.
- **Empty:** honest, and it invents no passage. "Nothing kept yet" at the Display step
  (2.25rem), one soft-ink body sentence (30rem) saying a passage is kept from a
  book's page and lands here privately, then an Outline Button, "Open your diary".

### Keep a Passage

A line on the book page's 34rem column, 24px under the control above it, that
deploys the passage sheet in place: a native `<details>`, never a modal. It is the
Log Sheet's language, kept for a passage rather than a read.

- **Line:** a 3.25rem summary, 12px horizontal padding, closed by a 2px rule, exactly
  as the date slip's "Log a read" line: "Keep a passage" in band voice left, the
  drawn 16px quote mark right. Soft ink over a hairline-tone rule at rest; words,
  mark and rule go to ink under the pointer, on focus-visible and while open, and
  open the visible word becomes "Close" while "Keep a passage" stays the accessible
  name. Under it, once the book has any, one 0.8125rem soft-ink line: "One passage" or
  "N passages from this book in your Margins", the last two words linking there.
- **Sheet:** Log Sheet rows (16px/12px, hairline-closed, band-voice label above a 2px
  ruled line: hairline at rest, ink on `focus-within`, alarm when refused). "The
  passage" — required, a textarea at the Passage step that grows with its text, with a
  "N / 1500" soft-ink tabular counter (0.8125rem) under it; then on one row "Page" (6rem,
  the Field step, tabular, "—" placeholder) beside "Your note" (body step, "Optional",
  at most 280). A field's refusal prints under its row; a refusal with no field (signed
  out, a book gone) is one body sentence in alarm above the commit.
- **Commit:** a Commit Band in the flow, 16px under the rows: "Keep it" ("Keep the
  changes" in edit mode, "Keeping…" while it runs), unavailable while the words are
  empty; its unavailable mark is the Printed State Rule's rule-through. After a save the sheet remounts closed and empty, and a hidden
  live readout says "Passage kept in your Margins." (its words alternate each save).
- **Remove (edit mode only):** the Log Sheet's guarded remove — a Text Button "Remove
  this passage"; pressed, one body sentence in alarm, "Remove this passage for good?",
  over a Text Button "Keep it" and an Outline Button "Remove" in alarm, 20px apart.
  Focus lands on "Keep it"; kept, it returns to "Remove this passage".

### Field Row

One row of a form — the account sheet's and the log sheet's — and the only text-entry
pattern in the system. The claim form's handle takes the same line and states under
its heading.
Character: a line on a printed form, filled in.

- **Shape:** no box, no fill, no radius. A 2px ruled line under the value, capped at
  34rem, closed below by a hairline that separates it from the next row.
- **Label:** band voice in soft ink, above the value.
- **Value:** the field step (1.375rem, 600), transparent ground, prefixed by a
  soft-ink `@` where the value is a handle. A multi-line note uses
  `field-sizing: content` so the box grows to the text rather than clipping it. A log
  sheet's review is the one value set at the body step instead (see the Value Over
  Label Rule). A placeholder is a hint, never a prefilled value, set at the body
  weight (400) in full soft ink, never faded below it. The claim form's is a handle
  built from the reader's own name by `suggestUsername()` ("your_name" when the name
  gives nothing usable), never a handle that belongs to someone else.
- **States:** hairline at rest, solid ink on `focus-within`, alarm on the failed
  field. A hint sits under the line in soft ink at 0.8125rem and switches to alarm
  when what the reader has typed will destroy something (renaming a handle kills the
  old address). The field-level error prints under the hint in the same tone. The
  line's tone is set by class, so ink on `focus-within` is never held down by a
  resting colour. The claim form is `noValidate`: an empty handle is refused in its
  own alarm sentence ("Type your own username — the one shown is only a
  suggestion."), never the browser's bubble, and the refusal stands down on the
  reader's next keystroke — sentence, alarm line and `aria-invalid` together — because
  what was refused is no longer in the field.

### Code Cells (signature component)

Eight drawn cells with a drawn dash between the two groups of four. The same
component draws a code being typed at the door and a code being handed out on the
account sheet, so a code looks the same going in as it does coming out — that
identity is the point of the component.

- **Shape:** square cells, 1px border, 4px gap, no radius. 48px tall in the door's
  mask (56px at ≥640px), 36px in the invite run, where the code is a record rather
  than a control.
- **Entry:** one real `<input>` lies over the drawn cells with its own text and caret
  made transparent (not `opacity: 0`, which would hide it from Windows high
  contrast). It holds the whole value, so paste, password managers, and phone
  keyboards all work. Characters outside the code alphabet are dropped as typed
  rather than rejected.
- **Empty cells are drawn, not absent:** the mask says how long a code is before any
  of it is typed, the same way an unfilled shelf position is ruled.
- **States:** per the Printed State Rule — hairline empty, ink filled, sunk paper on
  the cell awaiting the next keystroke, all eight in alarm when the code is refused,
  a struck ink bar and soft-ink characters when the code is spent or expired.
- **Reading:** the drawn cells are `aria-hidden`; the whole code is exposed once in a
  visually hidden line, so a screen reader says the code rather than spelling eight
  loose characters.

### Commit Band

A form's one commit, set as a band. It ships twice: pinned at the foot of the account
sheet, where it is the system's one pinned element, and in the flow at the foot of the
log sheet. Character: a band, not a toolbar.

- **Shape and colour:** full-width fiction-orange band, square. On the account sheet
  it sits on a solid ink top rule with paper behind it, 16px/24px padding. On the log
  sheet it spans the slip's column at 16px/12px with no top rule, because nothing
  scrolls beneath it.
- **Content:** the verb at `wdth` 118 / 0.2em, then the live count of fields that
  differ from what the server last rendered ("2 changes pending"), set beside the
  verb rather than pushed to the far end of the band — held apart by
  `justify-between` the count lands a thousand pixels from the word it qualifies.
  Both at full ink: ink on the fiction band is 4.9:1, and the same tone at 80% falls
  to 3.9:1, under the floor for the only live readout on the page. The log sheet's band
  carries the verb alone, "Save this read", or "Save changes" in edit mode.
- **States:** on the account sheet, absent entirely when nothing is pending; after a
  successful commit it is replaced in the flow by a soft-ink "Saved" line on a
  hairline, which is a record, not a toast. On the log sheet it is always present in
  the open sheet. **Every commit band** — the account sheet, the log sheet, the door
  and the claim form — holds full ink on full orange at full opacity while it
  submits, its verb becoming the live readout ("Saving…", "Claiming…", "Taking you
  to Google…"). Only the cursor changes; a faded band would be a greyed box, and ink
  at 60% on the fiction band falls under AA.

### Outline Button

The standing control outside the form — "Mint a code", "Sign out", "Delete this
account", "Search for a book" on a book page that was not found and on an empty to-read
list, where it is a link, "Want to read" and "Add to favourites" on a book page, "Remove" in an edit sheet's
armed removal, and "Show 20 more", a link 24px under a full grid of search results,
its left edge on the page padding. Character: a label with a border drawn around it.

- **Shape:** square, 1px border, 12px/10px padding, band-voice label, paper ground.
- **Border:** solid ink when the control is available; hairline while it is not.
  Alarm when the control is armed and irreversible: "Delete this account" once the
  handle is typed back, and "Remove", which is only ever shown armed.
- **Pending:** any Outline Button whose action waits on a source — an armed one or
  not — turns its label into the live readout in place ("Removing…", "Finding
  more…"). Both labels share one grid cell, so the button holds the longer width and
  nothing beside it moves; the flood stays while it is under the pointer or focused.
- **Hover / focus-visible:** floods with the fiction band. Colour only; nothing moves.
- **Disabled:** the label is ruled through and the whole control drops to 50% opacity,
  label and hairline border together — the printed mark for unavailable — never a grey
  chrome fill. The delete fence's button before the handle is typed back, "Show 20
  more", and "Add to favourites" at four all use it. A control that can no longer act is
  never removed: "Show 20 more" at the cap or after a short step, and "Add to
  favourites" at four, stay in this mark (a native disabled button), each with one
  soft-ink line beside it at 0.8125rem saying why.

### Text Button

The secondary control inside a form row — "Undated" and "Clear" on the log sheet,
"Remove this read" and "Keep it" under an edit sheet's commit band, "Your list" and
"Take it off" on the saved line of a book page's Want to Read, "Earlier", "Later",
"Your favourites" and "Take it off" on a favourite's line, and "Year", "Author" and
"Category" on the shelf-order line.
Character: a word in the row's margin, not a second button.

- **Shape:** no border, no ground, no padding; a band-voice label in ink, underlined
  4px below in hairline tone.
- **Hover / focus-visible:** the underline goes to ink under the pointer; keyboard focus
  takes the standard 2px ink ring. Colour only.
- **Current:** where a row of Text Buttons picks one of several views, the chosen one
  carries `aria-current` and a 2px ink underline (the Printed State Rule's current mark).
- **Pending:** a Text Button whose action waits on a source ("Take it off" on Want to
  Read's and a favourite's line) turns its label into the live readout in place
  ("Taking it off…"). Both labels share one grid cell, so it holds the longer width and
  nothing beside it moves. It is `aria-disabled` and ignores presses, never natively
  disabled, so keyboard focus stays on it.
- **Unavailable:** when there is nothing to undo — the date already empty, the rating
  already unrated, or "Keep it" while a removal runs — the label is ruled through in
  ink at 50% opacity, as a disabled
  Outline Button is. It stays on the page rather than disappearing.

### Delete Fence

The last block on the account sheet, and the only one fenced on all four sides in
solid ink, inset by the page padding so the fence reads as a fence rather than as
another band. An ink band heads it; the consequences are stated in body copy at the
point of action; the reader must type their own handle back before the control arms,
at which point its border turns alarm. There is no dialog: a dialog can be dismissed
by reflex, and this cannot be satisfied without reading what it asks for.

### Rating

Five drawn marks in authored SVG, half-steps supported by clipping the filled path at
a fractional width. The unfilled state is **the same shape at 30% opacity** — never a
different mark, never an outline variant. `tone` is passed in so the marks carry the
same ink weight as whatever band they sit on. Exposed as `role="img"` with an
"N out of 5" label. `size` sets one mark's pixel size: 11 on the shelf and the slip,
32 on the log sheet, where the marks are the drawn face of a range input and are
hidden from assistive tech in favour of it.

### Cover

A plain lazy `<img>` at `object-contain` inside the fixed 2:3 well, with a
`srcset`/`sizes` pair matched to the four grid steps. Alt text is
`"{title} by {author}"` and is load-bearing rather than decorative, because the
interface is built around cover art.

**No cover.** A coverless book gets one answer at both scales: a type-only jacket
filling the well, the title at the head and the first author in soft-ink band voice
(1.4 leading, balanced) at the foot. A small centred caption read as a failed image
load beside a full-bleed jacket in a grid, and as an empty placeholder at frontispiece
size. The jacket is `aria-hidden`, because a heading or record band beside every
Cover already says the title.

- **Cell** (the default): the title at the field step (1.375rem, snug, −0.01em),
  balanced, clamped at five lines, with 16px/12px padding — it holds at 2 columns on
  a 390px phone. Only a word of twelve letters or more hyphenates
  (`hyphenate-limit-chars: 12 5 5`), so ordinary titles never do. Browsers never
  hyphenate a capitalised word, so a title-case word too wide for the cell still
  breaks bare rather than overflowing.
- **Band** (`scale="band"`, the favourites band): the cell setting, with the title a
  step up at the headline step (1.75rem, lh 1, −0.02em) from ≥64rem, where the band
  runs four across in a ~276px well — as its record band steps up from the shelf's.
  At 2 across it stays at the field step.
- **Page** (`scale="page"`): the title at the headline step, with 24px/20px padding
  (32px/28px at ≥64rem). A page-scale cover also passes its own `sizes` for the
  frontispiece column and loads eagerly.

### Motion

**The One Moment Rule** (scoped). Tri-band's own authored moment is unchanged: an
entry's colour band inks in from the spine edge via a `clip-path` wipe, 620ms on
`cubic-bezier(0.16, 1, 0.3, 1)`, `animation-fill-mode: backwards`, gated to entries
created since the reader's server-side `lastSeenAt` and to the band's first
intersection with the viewport. It is no longer the only motion: since MRG-108 a
motion layer runs at every width — place transitions, the jacket morph, sheet easing,
reveal, press, roll — recorded under Below 40rem: Now Reading, Motion. Hover and focus
still change only colour; under `prefers-reduced-motion: reduce` nothing travels.

## Do's and Don'ts

### Do:
- **Do** build every new object out of the three bands — colour, field, record — at
  whatever scale the object needs.
- **Do** pass every band colour through `conditionBand()` and every band foreground
  through `readableOn()`. Contrast is decided by the helper, never by eye.
- **Do** give a book its band colour only once it is on this reader's shelf; until
  then its band is ink.
- **Do** keep hairlines at `{colors.rule}` (ink at 15%) and reserve solid ink borders
  for the primary action, the year rule, the standing controls, the delete fence, and
  the 2px rule between the wordmark band and a book's author band.
- **Do** draw state as a printed mark — hairline at rest, solid ink filled or
  focused, sunk paper on the position awaiting the next keystroke, an alarm stroke on
  refusal, a rule through an unavailable label, a struck bar across a spent code.
- **Do** reserve `{colors.alarm}` for refusal, destructive warning, and an armed
  irreversible control, as a stroke or as words.
- **Do** say every state in a word as well as a tone: "Unused", "Used", "Expired",
  "2 changes pending".
- **Do** set an editable value at the field step (1.375rem) on a ruled line, with its
  label smaller above it. The one named exception is a field that holds
  paragraphs of prose, set at the body step (0.9375rem).
- **Do** set numbers in tabular figures; the record is a column of dates and ratings.
- **Do** use Archivo's width axis for voice: wide for the wordmark (`wdth` 118),
  condensed for band labels (`wdth` 88).
- **Do** design empty and no-cover states as real settings with real copy — an
  unfilled slot is ruled, a coverless book gets a typographic jacket, an empty invite
  run says what an invitation does, a book with no reads gets a slip with one ruled
  line, the one its first read is logged on.
- **Do** cap the measure of a ruled value at 34rem and of prose at 38rem, inside a
  band that still runs edge to edge. On a title page, hang every block, the title
  included, on one 34rem edge. Prose that is the object itself — a review on its
  permalink — takes the 34rem value measure instead, which is where the body step
  lands inside the 65–75 characters a line of prose wants.
- **Do** hold a jacket whole in whatever well it lands in, letting the well's own
  ground show above and below it. Never crop a cover to fill a taller well.
- **Do** print a refusal under the object that refused — the spine, the field, the row
  — not once under the list that holds it.
- **Do** theme browser surfaces (selection, caret, scrollbar, focus ring, tap highlight) whenever a
  new one appears.
- **Do** hold both 390px and 1440px as finished layouts; whole-cell repack, never a
  list fallback.

### Don't:
- **Don't** add a `box-shadow`, an elevation layer, or a lift-on-hover at 40rem and
  up. Depth there is tonal only.
- **Don't** use a gradient as shading, tint, or decoration at 40rem and up. The one
  Tri-band gradient draws the shelf's column rules and is a ruling device.
- **Don't** introduce a second typeface, including for numerals, code, or quotes.
- **Don't** round a corner past the 2px ceiling at 40rem and up, and prefer 0 —
  nothing shipped at that width uses even 2px.
- **Don't** hard-code a foreground colour on a coloured band, and don't assume paper
  reads on the fiction orange (3.32:1, fails AA).
- **Don't** build a dark mode keyed to `prefers-color-scheme`, or invert the ground at
  40rem and up. This world is printed paper.
- **Don't** fill a surface with `{colors.alarm}`, use it as a band, or add a second
  red. It is a stroke and a sentence, and it means refusal.
- **Don't** pin, float, or overlay anything else at 40rem and up. The account sheet's commit band is
  the one exception, and it disappears when there is nothing to commit; the log
  sheet's commit band runs in the flow.
- **Don't** give a control chrome at 40rem and up: no filled input box, no pill, no
  toggle, no badge, no rounded chip. State is a mark on the page.
- **Don't** grey out a disabled control as the only signal, and don't delete a spent
  object from the page — rule through it and keep it legible.
- **Don't** use the condensed tracked-out caps as a kicker or eyebrow above a heading;
  that voice belongs to content carried on a band, on a control, or on a field's own
  label.
- **Don't** use a glyph character, an icon font, or an emoji as an icon, a rating
  mark, or the dash inside a code. Icons and separators are authored SVG paths.
- **Don't** invent entries, ratings, reviews, counts, or activity to populate a
  design. The production database is empty; every state must be honest to that.
- **Don't** give a book a band colour, a jacket colour, or a fallback for merely being
  saved. A waiting book is ink until it is read.
- **Don't** add motion outside the recorded layer (place transitions, the jacket
  morph, sheet easing, reveal, press, roll, hero-in, the band wipe), and don't add any
  motion without a reduced-motion crossfade or stillness.

## Below 40rem: Now Reading

Everything above this heading is the Tri-band world, and it stays authoritative at
40rem and up. Below 40rem the phone has its own world, confirmed with the user under
MRG-108. It is not a fork: every component keeps its markup and its behaviour, and
the world changes only through a token remap inside `@media (max-width: 39.999rem)`,
`max-sm:` utilities, and the phone-only `m-` utilities (`m-only`, `m-hidden`,
`m-flood`, `m-jacket`). Tri-band rules that this section does not override still hold
on the phone: one family, tabular figures, `readableOn()` on every band, conditioned
and stable colour, earned colour, refusal tone, the word beside the colour, and the
honest empty state.

### Overview

**Creative North Star: "Now Reading"**

Desktop is printed paper. The phone is read at night, in the minute after a book is
closed, on a lit screen. So below 40rem the ground goes to night, the book's own jacket
colour floods the field behind it, and surfaces become rounded sheets with soft depth
that move on springs. The first viewport of a reader's own diary is their latest read:
its jacket large on a wash of its colour, their name and tally above it, the shelf of
rounded jackets two-up beneath, and a floating bar in thumb reach.

**Key Characteristics:**
- A night ground chosen by viewport, never by `prefers-color-scheme`
- The jacket's own conditioned colour as a full-field wash and as the glow under its cover
- Rounded sheets, pills, and soft downward shadows; the colour bands of the cell are folded away
- One lit control per view in the night accent, with night words on it
- A floating five-place bar, the one element that never moves between places
- Archivo pushed wide and bold for display (`wdth` 112, 700), still the one family

### Colors

The Tri-band tokens are re-cut for the night, and components consume them unchanged:
`paper` resolves to `{colors.m-night}`, `paper-sunk` to `{colors.m-raised}`, `ink` to
`{colors.m-text}`, `ink-soft` to `{colors.m-text-soft}`, `rule` to `{colors.m-rule}`,
`alarm` to `{colors.m-alarm}`, and `band-fiction` to `{colors.m-accent}`. Crime green and
Pelican cyan keep their values; band colours from jackets are conditioned as on desktop.

- **Night** (`{colors.m-night}`): the page ground, the book page's sheet, the text on the
  accent, and the 4px ring that seats the raised Log pill in the bar. The browser's
  `theme-color` is night below 40rem and paper above, and `color-scheme` is `dark` here
  only, so form controls and the scrollbar follow.
- **Raised** (`{colors.m-raised}`): the first step up — a jacket well, a rounded account
  card.
- **Raised 2** (`{colors.m-raised-2}`): every surface that is an ink chip on desktop —
  a spine on the to-read pile, an ink band that has not set its own phone colour — and
  the scrollbar thumb. Their paper words read as `{colors.m-text}`.
- **Night Text** (`{colors.m-text}`) and **Night Soft** (`{colors.m-text-soft}`): primary
  and secondary text, as ink and soft ink are on paper. The focus ring takes Night Text
  because it is the remapped ink.
- **Night Rule** (`{colors.m-rule}`): Night Text at 12%; every remaining hairline. Ink
  borders that have not set a phone colour soften to Night Text at 28%.
- **Ember** (`{colors.m-accent}`): the one lit control on a view — the raised Log pill,
  every commit band (now a pill), an outline button's hover flood, "Log your first book".
  Words on it are always Night, never light.
- **Night Alarm** (`{colors.m-alarm}`): refusal, as on desktop — a stroke and a sentence.

**The Night by Viewport Rule.** The phone's night ground is a second world chosen by
width, not a dark mode. Nothing switches on `prefers-color-scheme`; a laptop in a dark
OS still gets paper, and a phone in a light OS still gets night.

**The Jacket Flood Rule.** Colour on the phone is the book's own, and it is still
earned. A shelved book's conditioned band colour washes the field behind its jacket
(`m-flood`: a radial wash from the top over a fall from the colour at 55% into night)
and tints the glow under its cover. A search result and a spine have no band colour,
so their jackets cast a neutral black shadow and their grounds stay raised; an empty
diary's hero washes in a neutral `#2A2A2E`. Nothing ever floods in the accent.

**The One Lit Control Rule.** Ember is the single lit control on a view, and the words
on it are Night. A second Ember surface on the same view is a second primary action,
and the view has only one.

### Typography

One family still: Archivo, run wider and heavier for display on the phone.

- **Night Display** (`{typography.m-display}`): the reader's name on the Now Reading
  hero and on a profile's masthead. A book's title on its sheet takes the same weight
  and tracking (−0.03em) at 2.25rem and `wdth` 108.
- **Night Headline** (`{typography.m-headline}`): the year (or author, or category) on a
  sticky year rule, and "Favourites".
- **Night Title** (`{typography.m-title}`): a book's title under its jacket on the shelf,
  in favourites and in search results, with its first author beneath it at 0.75rem in
  Night Soft, truncated — the author moves under the title because the colour band
  that carried it is folded away.
- **Margins** keeps the Tri-band steps on the phone: the spotlight's words at Display,
  Headline or Field by length (2.25rem, 1.75rem, 1.375rem, at 600), never Night Display,
  because a quotation is not a name.
- **Bar Label** (`{typography.m-bar-label}`): the five place names in the bottom bar,
  sentence case. The condensed tracked caps stay the voice of buttons and band labels;
  the bar is a place list, not a band.
- The wordmark shrinks to 0.75rem at the head of the hero and the wordmark band, and
  "A reading diary" is not drawn.

### Layout

- **Gutter.** Phone page content sits on a 1.25rem gutter (`{spacing.m-gutter}`); the
  account's cards inset 1rem.
- **The shelf breathes.** The grid keeps two columns, but cells stand apart on a 1.75rem
  row gap and 0.875rem column gap with no hairlines, no ruled column lines, and no
  card frame. A short row is still left-aligned and never stretched; its empty
  positions are night rather than ruled.
- **The hero.** On the reader's own diary the Tri-band masthead is replaced by Now
  Reading: wordmark and reading span on one line under the safe-area inset, the name
  at Night Display, the tally (its figure rolls in), then the latest read's jacket at
  46% width beside its title, author, date and rating. The masthead's "Your pages"
  nav is not drawn; the bar replaces it.
- **The book page is a sheet over its jacket.** The wordmark band is not drawn. The
  frontispiece stands at 64% width on the jacket's flood, the author band runs
  transparent over it with its way back as frosted pills, and the title column rises
  as a night sheet with 1.75rem top corners, a minimum of half the viewport, and the
  sheet shadow.
- **Account surfaces are cards.** Invitations, the device section and the delete fence
  become rounded Raised cards inset 1rem; their ink header bands fold into the card.
- **The to-read pile stands straight.** Spines run full width, 0.5rem apart, with 1rem
  corners. The stable lie is a desktop drawing; on the phone it is not drawn.
- **Room for the bar.** A page with the bar pads its foot by 6.5rem plus the
  safe-area inset, and the viewport is `viewport-fit: cover` so night runs under the
  notch.

**The Thumb Reach Rule.** Beyond the account sheet's commit band, the phone pins
exactly two kinds of element: the floating bottom bar, and each year rule, which sticks to the top of the viewport over a
frosted night (Night at 75%, 24px blur) while its group scrolls. Nothing else floats, sticks, or overlays: no top
app bar, no toast, no floating action button beside the bar's own Log pill.

### Elevation & Depth

The phone is lifted. Depth is soft, offset downward, and coloured only by the object
casting it: a jacket glows in its own flood colour, the Log pill in Ember, and
everything else casts black. There are no hard offset shadows and no outlines drawn as
depth.

- **Night lift** (`--m-shadow`): the base under a jacket.
- **Jacket glow**: the jacket's flood colour at 70% into black, 24px down and 48px
  wide, over Night lift.
- **Sheet**: `0 -12px 32px -12px` black at 60%, cast upward by the book page's sheet
  onto the flood.
- **Bar**: an inset 1px white hairline at 7% over a 20px-down, 40px black shadow,
  with a 24px backdrop blur at 1.8 saturation through 84% night.
- **Log glow**: Ember at 55%, 12px down, plus a 4px night seat.

**The Glow Belongs to Its Object Rule.** A shadow is never decorative and never a
brand colour laid under an arbitrary surface. It is black, or it is the colour of the
thing casting it.

### Shapes

Rounded, on a short scale: 0.5rem for an invite code's cell (`{rounded.m-cell}`),
0.875rem for every jacket and an empty favourites slot (`{rounded.m-jacket}`, the
slot dashed), 1rem for a spine (`{rounded.m-spine}`), 1.125rem for a commit band
(`{rounded.m-commit}`), 1.25rem for an account card and the Log pill
(`{rounded.m-card}`), 1.75rem for the bar and the book page's sheet
(`{rounded.m-sheet}`), and a full pill for every outlined button, the shelf-order
choices and the frosted back links (`{rounded.m-pill}`). The bar's icons are the one
round-capped, round-joined SVG set (1.75px stroke, 2.25px for Log); every other drawn
mark keeps the Tri-band's square caps.

### Components

#### Bottom Bar (signature component)

A floating, frosted five-place bar — Diary · Margins · Log · To read · Account — inset
0.75rem from the sides and above the home indicator, in `{rounded.m-sheet}`. Log sits
in the middle as a raised 3.5rem Ember square (`{rounded.m-card}`) lifted 2rem out of
the bar, its label on the others' baseline. The current place is marked by one white
10% pill that slides between slots on the bar spring rather than five marks that
blink, with `aria-current` and the slot's icon and label going from Night Text Soft to
Night Text. Slot two is Margins, drawn as a quote mark (MRG-110); Search no longer
has a slot of its own and is reached through Log, so search lights the Log slot. A
book page keeps the slot it was opened from. Presses give: a slot
scales to 0.9, the Log pill to 0.88 with a quarter turn. The bar is exempt from every
place transition, so it is the one thing that never moves between pages. Not drawn at
40rem and up.

#### Now Reading Hero

The diary's first viewport (see Layout). With no reads, the field is the neutral
wash, the tally reads "0 books logged — yet", and an Ember pill reads "Log your first
book" under one sentence of guidance; nothing is mocked up. The jacket settles in
(`hero-in`) and is a shared element with that book's page.

#### Margins Spotlight (phone)

The masthead is not drawn. The latest passage stands on its book's flood (`m-flood`;
ink's flood when the book is not on the shelf), under the 1.25rem gutter and the
safe-area inset: the 0.75rem wordmark left and "N passages" right in the flood's
`readableOn()` tone, then the words in that tone at their length-chosen step, with no
quotation mark — the gutter cannot hold one at display size, and the flood and the
size already say "quotation". Under the words, the stamp with its jacket rounded and
glowing in the flood colour, its title and "Author · p." in the tone (the second line
at 75%), never grey; then the note in the tone at 75%. The journal follows on night.

#### Phone Cell

An Entry Card, Favourite or Search Result on the phone: no frame, no colour band, no
record rule — the rounded jacket with its glow, then the title at Night Title and the
author beneath. Hover and focus still draw the cell's ring; a press gives.

#### Pills

Outlined buttons become pills (1.125rem side padding) and keep their printed states
— ruled through when unavailable, alarm when armed. Commit bands become Ember pills set
inside their column, borderless, with Night words. The shelf-order line becomes a row
of pill choices: the current one filled in Night Text with Night words, the others
bare, each pressing to 0.95.

#### Delete Fence (phone)

A Raised card in `{rounded.m-card}` on a Night Rule hairline at rest, like every other
account card; alarm arrives only as the Refusal Tone Rule allows, when the handle is
typed back.

### Motion (every width)

Motion is no longer Tri-band's single moment; it is one layer, at every width,
documented here because it arrived with this world.

- **Places.** Each page is wrapped in a view transition whose kind is set by the link
  that started it: deeper slides in 48px from the right, back slides from the left
  (420ms ease-out, with a short fade); a sideways move between bar places is a
  crossfade-rise of 14px; a book's page rises 64px as a sheet over the shelf (520ms).
  A navigation with no kind — browser back, a refresh — does not slide.
- **The jacket morph** (the focal moment). A jacket is a shared element between the
  shelf (or the hero, or a favourite) and its book page: it travels 560ms on the
  jacket spring, softened by a 1.5px blur mid-flight.
- **Sheets.** Native `<details>` (the log sheet, a slip line's edit) ease open on
  their block size over 420ms and shut at once. Their `content-visibility` is never
  transitioned: that would animate the close too, but it leaves an opening sheet's
  controls unfocusable for the whole ease.
- **Reveal.** Shelf cells, search results and spines rise 28px from 96% as they scroll
  into view, on a scroll-driven timeline where supported and not at all otherwise.
- **Press.** A jacket cell, a spine or a pill gives to 96.5% under a press.
- **Roll.** A changed figure rolls up into place (700ms).
- **Band wipe.** The Tri-band's colour-band ink-in is unchanged; on the phone the band
  is folded away, so it is seen at 40rem and up.

**The Travel, Not Blink Rule.** What changes place moves as one object — the bar's
pill, the jacket — rather than disappearing here and appearing there. Every motion
eases out on `cubic-bezier(0.16, 1, 0.3, 1)` or one of the three named springs.

**The Still Reader Rule.** Under `prefers-reduced-motion: reduce` nothing travels:
places and sheets crossfade (180ms), the bar's pill fades rather than slides, reveal,
roll and hero-in do not run, and presses do not scale. Every state still changes
visibly.

### Do's and Don'ts (below 40rem)

#### Do:
- **Do** change the phone by token remap and `max-sm:` / `m-` utilities on the same
  markup; never fork a component into a phone copy.
- **Do** flood a field or tint a glow only with a book's earned, conditioned band
  colour; a passage from an unshelved book floods ink.
- **Do** set words on a flood in the flood's `readableOn()` tone, secondary lines at
  75% of it, never Night Soft grey.
- **Do** set Night words on Ember, and keep Ember to the one lit control on a view.
- **Do** round jackets, cards, sheets and controls on the recorded radius scale.
- **Do** give every new motion a reduced-motion crossfade or stillness.

#### Don't:
- **Don't** key the night ground to `prefers-color-scheme`.
- **Don't** pin anything but the bottom bar, the year rules and the account commit band.
- **Don't** cast a hard offset shadow, or a glow in a colour other than its object's.
- **Don't** give an unshelved book a coloured flood or glow.
- **Don't** let the bar move during a place transition.

---
name: Marginalia
description: A reading diary drawn as a Penguin/Pelican paperback cover system — paper ground, flat ink, one typeface, three bands.
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
rounded:
  band: "2px"
spacing:
  hairline: "1px"
  band-y: "8px"
  band-x: "10px"
  page-x: "16px"
  page-x-wide: "24px"
  section: "40px"
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
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "0"
    padding: "10px 12px"
  button-outline-hover:
    backgroundColor: "{colors.band-fiction}"
    textColor: "{colors.ink}"
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
ink, or sunk paper. What the world refuses is recorded in the build itself: no dark
mode (this is printed paper, and paper does not invert), no shadows, no gradient
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

**Key Characteristics:**
- A three-band frame — colour / field / record — at both cell and page scale
- Paper ground, flat ink, hairline rules, zero elevation
- One family (Archivo variable), differentiated by weight and by width axis
- Band foreground chosen by WCAG contrast at render time, never fixed
- Tabular figures everywhere: this page is a record of dates and ratings
- State drawn as a printed mark — rule, fill, strike — never as a chrome control
- Exactly one authored motion moment on the whole surface

## Colors

A printed palette: warm paper, near-black ink, and one saturated field colour per
entry drawn from that book's own jacket. One tone stands outside it, for refusal.

### Primary
- **Penguin Orange** (`{colors.band-fiction}`): the fiction band. The system's
  standing accent — it carries the masthead's colour band, the "Add" affordance's
  hover and focus fill, the commit band's ground, the outline button's hover and
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
  as well as a stroke. It appears in exactly four places: the door's refused-code
  message and all eight of that mask's cell borders, a field-level validation error
  under the account sheet's ruled value, the handle-rename warning that says the old
  address dies, and the border of the delete control once the handle has been typed
  back and the control is armed.

### Neutral
- **Paper** (`{colors.paper}`): the page ground and every cell's ground. Also the
  reversed text colour on every ink band, the focus ring on an ink band, and one of the two candidates the contrast
  helper picks from for band text.
- **Sunk Paper** (`{colors.paper-sunk}`): the jacket well behind a cover, the
  no-cover setting, the year rule's ground, the ground of the code cell awaiting the
  next keystroke, the band that says Open Library is unavailable, and the scrollbar
  track. It reads as the same sheet pressed
  slightly, not as a second surface.
- **Ink** (`{colors.ink}`): all primary text, all structural borders, the focus
  ring (except on an ink band, where it is paper), the fence around the delete section, and the masthead's record band ground.
- **Soft Ink** (`{colors.ink-soft}`): dates, counts, the reading span, "Unrated",
  field labels and hints, a closed code's characters, supporting copy, and the
  scrollbar thumb. It is the only tonal step below ink; there is no third text grey.
- **Hairline Rule** (`{colors.rule}`): ink at 15% alpha. Every hairline in the shelf
  — cell borders, record-band separator, and the ruled column lines that show a
  partial row's unfilled positions — plus the resting stroke under a field value,
  the resting border of an empty code cell, and the border of a control that is not
  yet available.

### Named Rules

**The Readable Band Rule.** No band ever has a fixed foreground. `readableOn()`
compares the WCAG contrast of ink and paper against the band and returns the winner.
This is not a nicety: bands are derived from arbitrary cover art, and paper on the
fiction orange is 3.32:1 and fails AA. The same helper decides the masthead, the
entry bands, and the "Add" cell's hover state.

**The Conditioned Ink Rule.** A colour lifted from a jacket is never used raw.
`conditionBand()` floors saturation at 0.35 and clamps lightness into 0.28–0.62, so
near-white paper borders, near-black spines, and washed-out scans all land as
deliberate flat ink rather than as whatever the scanner captured.

**The Stable Colour Rule.** A fallback band is a deterministic hash of the Open
Library work key, never random and never per-render. A shelf that reshuffles its own
colours between visits reads as broken, not lively.

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
paper and ink; none may be left at the OS default. The focus ring is 2px ink at a 2px offset everywhere except on an ink band, where ink vanishes into the ground and the ring is paper; every control or link set on an ink band carries it.

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
  in the masthead's field band, and "Your account" at the head of the account sheet.
  The largest type on the page. Both steps are recorded tokens.
- **Headline** (600, 1.75rem → 2.25rem at ≥640px, lh 1, −0.02em): the year on a year
  rule, and the door's one sentence of proposition. Chronology is the structure the
  shelf is ordered by, so it is drawn at a scale that carries across a viewport
  rather than set in the page's smallest type.
- **Field** (600, 1.375rem, lh snug, −0.01em): the value voice. Every editable value
  in the system is set at this step — the name, handle and note on the account sheet,
  the handle on the claim form, the confirmation handle in the delete fence, and the
  characters in an invite-code cell (stepping to 1.75rem at ≥640px in the door's
  mask). The masthead's reading span uses the same step at ≥640px, at weight 500 in
  soft ink, because a span is a value too. Values are larger than their labels here;
  that inversion is deliberate and is what makes a form read as a filled-in sheet.
- **Title** (600, 0.8125rem, lh tight, balanced): a book title in an entry's record
  band. Small on purpose — the jacket above it is the identifying object.
- **Body** (400, 0.9375rem / 0.875rem, lh relaxed, soft ink, capped ~34–38rem):
  the empty-shelf guidance, the door's explanation, and the delete fence's
  consequences. Body copy is rare here; this surface is a record, not an article.
- **Label** (600, 0.6875rem, `wdth` 88, 0.14em tracking, caps): the band voice —
  author name, "Add", "Reread", the tally, a year's book count, a field's label, an
  invite's state, and every button on the account surfaces. Two page-scale headings
  ("Invitations", the commit band's verb) run this voice at `wdth` 118 and 0.2em to
  hold a full-width band. Where band-voice text has to wrap — a state line beside a
  link in a record band at 390px — it takes 1.4 leading and balanced lines instead of
  its resting line-height of 1.
- **Meta** (500, 0.6875rem, soft ink, tabular): dates, "Unrated", counts, the
  reading span. Field hints and inline errors sit one step up at 0.8125rem.

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

**The Value Over Label Rule.** A form's value is set larger than its label: label in
the 0.6875rem band voice, value at the 1.375rem field step, on a ruled line with no
box. A control that inverts this — small value inside a chrome input under a large
heading — is not this system.

## Layout

The page is a full-bleed vertical stack: masthead, then year-grouped shelf sections.
There is no centred max-width container and no side gutters at the page level —
bands run edge to edge, which is what makes them read as printed bands rather than
as cards. The account sheet is the same stack: header, one continuous column of
field rows, then the ink-banded sections that are not part of the form.

**Page padding** is 16px, widening to 24px at ≥640px. **Section rhythm** between year
groups is 40px; a year rule sits 12px above its grid. **Band padding** inside a cell
is 8px vertical / 10px horizontal; masthead bands run 20–32px vertical. A field row
runs 20px vertical inside the page padding and is closed by a hairline.

**Measure is capped inside the full-bleed column, not by the column.** The band and
the row run edge to edge; the ruled line under a value stops at 34rem and a hint or
a paragraph stops at 38rem, so a value on a laptop sits on a line rather than under
a 1400px stroke.

**The shelf grid** is whole-cell repack at four steps: 2 columns below 40rem, 3 at
≥40rem, 4 at ≥64rem, 6 at ≥80rem. Cells are separated by a 1px gap over a paper
background, so the join between two cells reads as a single printed hairline.
Chronology runs down the grid; the "Log a book" cell always holds the first position
of the first (most recent) year group.

**Unfilled positions** in a partial row are ruled, not blank. The container paints
one non-repeating linear gradient tiled by `background-size` to the current column
count, and every real cell paints over it — so a partial row shows its empty
positions the way a printed signature does, at the cost of one background and no
filler elements.

**Everything runs in the flow of the page, with one named exception.** The commit
band on the account sheet is `position: sticky; bottom: 0`, and it is the only
viewport-pinned element in the build. It is scoped to the whole account column
rather than to the `<form>` — sticky only holds inside its own containing block, so
a band nested in the form would unpin exactly where the reader scrolls past the last
field, which is the stretch of page where unsaved work must not go quiet. It reaches
the form by `form` id instead of by nesting.

**Both viewports are primary.** Neither the 390px nor the 1440px layout is the
fallback; a change that only holds on one of them is not finished.

### Named Rules

**The Edge-to-Edge Rule.** Bands span the full viewport width. Never inset a band
inside a container to make it look like a card.

**The Ruled Signature Rule.** An incomplete row shows ruled empty slots. Never
centre a short row, never stretch cells to fill it, and never insert placeholder
cards to square it off.

**The One Pin Rule.** Bands run in the flow of the page. The single exception is the
commit band, which pins to the foot of the viewport *only while unsaved work
exists* and is not rendered at all otherwise — the exception is paid for by the
promise that the page never silently holds work. Nothing else floats, sticks, or
overlays: no sticky header, no toast, no floating action button, and no second
pinned band alongside this one.

## Elevation & Depth

**There is no elevation.** No `box-shadow` exists anywhere in the build, and none may
be added. Depth is entirely tonal and structural: paper against sunk paper, ink
against paper, a 15%-alpha hairline against both. A jacket sits in a sunk-paper well;
that recession is the only "depth" the system has, and it is a colour step, not a
light source. The pinned commit band is separated from the column behind it by a 1px
solid ink rule and an opaque paper ground, not by a shadow.

There is likewise no gradient shading. The single `linear-gradient` in the codebase
is a *drawing* device — it rules the shelf's column lines — not a shade.

### Named Rules

**The Flat Ink Rule.** Every surface is flat at every state. Hover and focus change
*colour* (the "Add" cell floods with the fiction band), never height, never blur,
never a shadow. Nothing on this page casts light.

## Shapes

Square. Every cell, band, rule, and well ships with a 0px radius; the corners of a
paperback are the corners of this system. A `rounded.band` token of 2px exists in the
theme as the absolute ceiling the direction contract set, but **no shipped surface
consumes it** — treat 2px as a limit, not as a default, and prefer 0.

Form language is rectangles and rules only: 1px hairlines in `{colors.rule}` between
and inside cells, 1px solid ink around the "Add" cell, above and below a year rule,
and around the delete fence, a 2px ruled line under an editable value, and a fixed
2:3 jacket frame that never crops. The single non-rectangular shape in the system is
the drawn rating mark. Icons and separators are authored SVG paths at 1.5px stroke
with square line caps — including the dash between the two halves of an invite code,
which is drawn rather than typed so a screen reader never spells it as part of the
code. Never an icon font, never an emoji, never a glyph character.

State is drawn in the same vocabulary. There is no chrome control anywhere: no
filled input box, no pill, no toggle, no badge. What changes between states is the
weight, tone, or presence of a printed mark.

### Named Rules

**The Printed State Rule.** Control and field state is carried by a mark on the
page, not by chrome:
- **At rest** — a hairline (`{colors.rule}`): an empty code cell, an unedited field's
  ruled line, a control that is not yet available.
- **Filled or focused** — the same stroke at solid ink: a code cell holding a
  character, a field being typed in (`focus-within`), a search result under the pointer
  or keyboard focus.
- **Awaiting the next keystroke** — sunk paper as the cell's ground, so the position
  the next character lands in is visible without a blinking cursor.
- **Refused** — the stroke redrawn in alarm red, on the field that failed and on
  every cell of a refused code, with a sentence in the same tone.
- **Unavailable** — a rule run through the control's own label (`line-through`),
  never a greyed box and never a removed control.
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
  typography. With no cover, the well holds the title and author centred in soft ink
  at 0.8125rem; that is a real state with a real setting, never a broken-image icon.
- **Band three — record:** paper, separated by a hairline, 8px/10px padding. Title
  (balanced) on top; rating and date pinned to the bottom edge of the cell so the
  baseline holds across a ragged row.
- **States:** none. The card is not interactive at rest and does not lift, tint, or
  outline on hover.

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

### Masthead (page-scale tri-band)

The same three bands at page width, differentiated by *ground* rather than by size —
colour, paper, ink — because two thin ruled paper strips in a row would read as one
device repeated, and the year rule immediately below is already a ruled strip.

- **Band one:** fiction orange; wordmark left, "A reading diary" in label type at 80%
  opacity right. This band ships on its own (the wordmark band) at the head of every
  page that has no reader to name yet — the door, the claim form, the account sheet.
- **Band two:** paper; the reader's name at display scale left, the reading span in
  tabular soft ink right. The span is structural: it holds the name field's right
  edge so the band is not one word floating in a thousand pixels of paper.
- **Band three:** ink ground, paper text, the tally in label type ("11 books logged"
  / "Nothing logged yet") left, and the link into the account sheet right. A separate
  nav bar would be a fourth band this page does not have. This band also ships on its
  own under the search field: the search's state ("5 books", "Searching Open
  Library…") left, and "Your diary" right.

### Year Rule

A full-width ruled band on sunk paper, bordered top and bottom in solid ink: the year
at headline scale left, the group's book count in soft-ink label type right. It is a
band, not a hairline, because chronology is the shelf's organising structure.

### Field Row

One row of the account sheet, and the only text-entry pattern in the system.
Character: a line on a printed form, filled in.

- **Shape:** no box, no fill, no radius. A 2px ruled line under the value, capped at
  34rem, closed below by a hairline that separates it from the next row.
- **Label:** band voice in soft ink, above the value.
- **Value:** the field step (1.375rem, 600), transparent ground, prefixed by a
  soft-ink `@` where the value is a handle. A multi-line note uses
  `field-sizing: content` so the box grows to the text rather than clipping it.
- **States:** hairline at rest, solid ink on `focus-within`, alarm on the failed
  field. A hint sits under the line in soft ink at 0.8125rem and switches to alarm
  when what the reader has typed will destroy something (renaming a handle kills the
  old address). The field-level error prints under the hint in the same tone.

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

The account sheet's one commit, and the system's one pinned element. Character: a
band, not a toolbar.

- **Shape and colour:** full-width fiction-orange band on a solid ink top rule,
  paper behind it, 16px/24px padding, square.
- **Content:** the verb at `wdth` 118 / 0.2em, then the live count of fields that
  differ from what the server last rendered ("2 changes pending"), set beside the
  verb rather than pushed to the far end of the band — held apart by
  `justify-between` the count lands a thousand pixels from the word it qualifies.
  Both at full ink: ink on the fiction band is 4.9:1, and the same tone at 80% falls
  to 3.9:1, under the floor for the only live readout on the page.
- **States:** absent entirely when nothing is pending; after a successful commit it
  is replaced in the flow by a soft-ink "Saved" line on a hairline, which is a
  record, not a toast.

### Outline Button

The standing control outside the form — "Mint a code", "Sign out", "Delete this
account". Character: a label with a border drawn around it.

- **Shape:** square, 1px border, 12px/10px padding, band-voice label, paper ground.
- **Border:** solid ink when the control is available; hairline while it is not.
  Alarm when the control is armed and irreversible.
- **Hover / focus-visible:** floods with the fiction band. Colour only; nothing moves.
- **Disabled:** the label is ruled through at 50% opacity — the printed mark for
  unavailable — never a grey chrome fill.

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
"N out of 5" label.

### Cover

A plain lazy `<img>` at `object-contain` inside the fixed 2:3 well, with a
`srcset`/`sizes` pair matched to the four grid steps. Alt text is
`"{title} by {author}"` and is load-bearing rather than decorative, because the
interface is built around cover art.

### Motion

**The One Moment Rule.** The entire surface has exactly one authored animation: an
entry's colour band inks in from the spine edge via a `clip-path` wipe, 620ms on
`cubic-bezier(0.16, 1, 0.3, 1)`, `animation-fill-mode: backwards`. It is gated twice —
to entries created since the reader's server-side `lastSeenAt`, and to the band's
first intersection with the viewport. The band renders visible from the server, so
with no JS or under `prefers-reduced-motion: reduce` nothing is hidden and nothing
moves. No other transition on the page changes anything but colour or opacity.

## Do's and Don'ts

### Do:
- **Do** build every new object out of the three bands — colour, field, record — at
  whatever scale the object needs.
- **Do** pass every band colour through `conditionBand()` and every band foreground
  through `readableOn()`. Contrast is decided by the helper, never by eye.
- **Do** keep hairlines at `{colors.rule}` (ink at 15%) and reserve solid ink borders
  for the primary action, the year rule, the standing controls, and the delete fence.
- **Do** draw state as a printed mark — hairline at rest, solid ink filled or
  focused, sunk paper on the position awaiting the next keystroke, an alarm stroke on
  refusal, a rule through an unavailable label, a struck bar across a spent code.
- **Do** reserve `{colors.alarm}` for refusal, destructive warning, and an armed
  irreversible control, as a stroke or as words.
- **Do** say every state in a word as well as a tone: "Unused", "Used", "Expired",
  "2 changes pending".
- **Do** set an editable value at the field step (1.375rem) on a ruled line, with its
  label smaller above it.
- **Do** set numbers in tabular figures; the record is a column of dates and ratings.
- **Do** use Archivo's width axis for voice: wide for the wordmark (`wdth` 118),
  condensed for band labels (`wdth` 88).
- **Do** design empty and no-cover states as real settings with real copy — an
  unfilled slot is ruled, a coverless book gets a typographic jacket, an empty invite
  run says what an invitation does.
- **Do** cap the measure of a ruled value at 34rem and of prose at 38rem, inside a
  band that still runs edge to edge.
- **Do** theme browser surfaces (selection, caret, scrollbar, focus ring) whenever a
  new one appears.
- **Do** hold both 390px and 1440px as finished layouts; whole-cell repack, never a
  list fallback.

### Don't:
- **Don't** add a `box-shadow`, an elevation layer, or a lift-on-hover anywhere. Depth
  is tonal only.
- **Don't** use a gradient as shading, tint, or decoration. The one gradient in this
  system draws the shelf's column rules and is a ruling device.
- **Don't** introduce a second typeface, including for numerals, code, or quotes.
- **Don't** round a corner past the 2px ceiling, and prefer 0 — nothing shipped uses
  even 2px.
- **Don't** hard-code a foreground colour on a coloured band, and don't assume paper
  reads on the fiction orange (3.32:1, fails AA).
- **Don't** build a dark mode or invert the ground. This world is printed paper.
- **Don't** fill a surface with `{colors.alarm}`, use it as a band, or add a second
  red. It is a stroke and a sentence, and it means refusal.
- **Don't** pin, float, or overlay anything else. The commit band is the one
  exception, and it disappears when there is nothing to commit.
- **Don't** give a control chrome: no filled input box, no pill, no toggle, no badge,
  no rounded chip. State is a mark on the page.
- **Don't** grey out a disabled control as the only signal, and don't delete a spent
  object from the page — rule through it and keep it legible.
- **Don't** use the condensed tracked-out caps as a kicker or eyebrow above a heading;
  that voice belongs to content carried on a band, on a control, or on a field's own
  label.
- **Don't** use a glyph character, an icon font, or an emoji as an icon, a rating
  mark, or the dash inside a code. Icons and separators are authored SVG paths.
- **Don't** invent entries, ratings, reviews, counts, or activity to populate a
  design. The production database is empty; every state must be honest to that.
- **Don't** add a second animated moment. If something must move, replace the band
  wipe rather than joining it.

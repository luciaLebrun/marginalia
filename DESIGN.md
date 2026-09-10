---
name: Marginalia
description: A reading diary drawn as a Penguin/Pelican paperback cover system — paper ground, flat ink, one typeface, three bands.
colors:
  paper: "#F4F1E8"
  paper-sunk: "#EAE5D8"
  ink: "#16130F"
  ink-soft: "#5D564C"
  rule: "#16130F26"
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
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
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

**Key Characteristics:**
- A three-band frame — colour / field / record — at both cell and page scale
- Paper ground, flat ink, hairline rules, zero elevation
- One family (Archivo variable), differentiated by weight and by width axis
- Band foreground chosen by WCAG contrast at render time, never fixed
- Tabular figures everywhere: this page is a record of dates and ratings
- Exactly one authored motion moment on the whole surface

## Colors

A printed palette: warm paper, near-black ink, and one saturated field colour per
entry drawn from that book's own jacket.

### Primary
- **Penguin Orange** (`{colors.band-fiction}`): the fiction band. The system's
  standing accent — it carries the masthead's colour band, the "Add" affordance's
  hover and focus fill, the text selection highlight, and the caret. It is also the
  first of the three fallback bands.

### Secondary
- **Crime Green** (`{colors.band-crime}`): second fallback band, assigned by stable
  hash when a book has no usable cover colour.
- **Pelican Cyan** (`{colors.band-pelican}`): third fallback band, same mechanism.

These three are a *fallback set*, not a category taxonomy. The live band colour on a
populated shelf is nearly always derived from the jacket and conditioned before use.

### Neutral
- **Paper** (`{colors.paper}`): the page ground and every cell's ground. Also the
  reversed text colour on the ink band, and one of the two candidates the contrast
  helper picks from for band text.
- **Sunk Paper** (`{colors.paper-sunk}`): the jacket well behind a cover, the
  no-cover setting, the year rule's ground, and the scrollbar track. It reads as the
  same sheet pressed slightly, not as a second surface.
- **Ink** (`{colors.ink}`): all primary text, all structural borders, the focus
  ring, and the masthead's record band ground.
- **Soft Ink** (`{colors.ink-soft}`): dates, counts, the reading span, "Unrated",
  supporting copy, and the scrollbar thumb. It is the only tonal step below ink;
  there is no third text grey.
- **Hairline Rule** (`{colors.rule}`): ink at 15% alpha. Every hairline in the shelf
  — cell borders, record-band separator, and the ruled column lines that show a
  partial row's unfilled positions.

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

**The Browser-Surface Rule.** Surfaces we did not draw still belong to the design.
Selection, caret, scrollbar track and thumb, and the focus ring are all themed to
paper and ink; none may be left at the OS default.

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
  in the masthead's field band. The largest type on the page.
- **Headline** (600, 1.75rem → 2.25rem at ≥640px, lh 1, −0.02em): the year on a year
  rule. Chronology is the structure the shelf is ordered by, so it is drawn at a
  scale that carries across a viewport rather than set in the page's smallest type.
- **Title** (600, 0.8125rem, lh tight, balanced): a book title in an entry's record
  band. Small on purpose — the jacket above it is the identifying object.
- **Body** (400, 0.9375rem / 0.875rem, lh relaxed, soft ink, capped ~34–38rem):
  the empty-shelf guidance and the signed-out description. Body copy is rare here;
  this surface is a record, not an article.
- **Label** (600, 0.6875rem, `wdth` 88, 0.14em tracking, caps): the band voice —
  author name, "Add", "Reread", the tally, a year's book count.
- **Meta** (500, 0.6875rem, soft ink, tabular): dates, "Unrated", counts, the
  reading span.

### Named Rules

**The One Family Rule.** Archivo alone. New weight, new width, new tracking, new
case — never a new face. A second family breaks the system this entire surface is
built on.

**The Tabular Record Rule.** `font-variant-numeric: tabular-nums` is set on `body`
and inherited everywhere. This page is a column of dates and ratings, and
proportional digits make that column ripple.

**The Band Voice Rule.** Condensed tracked-out caps are the voice of *content
carried on a band* — an author, a state, a count. They are never used as a kicker or
eyebrow above a heading, and never as body copy.

## Layout

The page is a full-bleed vertical stack: masthead, then year-grouped shelf sections.
There is no centred max-width container and no side gutters at the page level —
bands run edge to edge, which is what makes them read as printed bands rather than
as cards.

**Page padding** is 16px, widening to 24px at ≥640px. **Section rhythm** between year
groups is 40px; a year rule sits 12px above its grid. **Band padding** inside a cell
is 8px vertical / 10px horizontal; masthead bands run 20–32px vertical.

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

**Both viewports are primary.** Neither the 390px nor the 1440px layout is the
fallback; a change that only holds on one of them is not finished.

### Named Rules

**The Edge-to-Edge Rule.** Bands span the full viewport width. Never inset a band
inside a container to make it look like a card.

**The Ruled Signature Rule.** An incomplete row shows ruled empty slots. Never
centre a short row, never stretch cells to fill it, and never insert placeholder
cards to square it off.

## Elevation & Depth

**There is no elevation.** No `box-shadow` exists anywhere in the build, and none may
be added. Depth is entirely tonal and structural: paper against sunk paper, ink
against paper, a 15%-alpha hairline against both. A jacket sits in a sunk-paper well;
that recession is the only "depth" the system has, and it is a colour step, not a
light source.

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
and inside cells, 1px solid ink around the "Add" cell and above/below a year rule,
and a fixed 2:3 jacket frame that never crops. The single non-rectangular shape in
the system is the drawn rating mark. Icons are authored SVG paths at 1.5px stroke
with square line caps — never an icon font, never an emoji, never a glyph character.

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
  opacity right.
- **Band two:** paper; the reader's name at display scale left, the reading span in
  tabular soft ink right. The span is structural: it holds the name field's right
  edge so the band is not one word floating in a thousand pixels of paper.
- **Band three:** ink ground, paper text, the tally in label type ("11 books logged"
  / "Nothing logged yet").

### Year Rule

A full-width ruled band on sunk paper, bordered top and bottom in solid ink: the year
at headline scale left, the group's book count in soft-ink label type right. It is a
band, not a hairline, because chronology is the shelf's organising structure.

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
moves. No other transition on the page changes anything but colour.

## Do's and Don'ts

### Do:
- **Do** build every new object out of the three bands — colour, field, record — at
  whatever scale the object needs.
- **Do** pass every band colour through `conditionBand()` and every band foreground
  through `readableOn()`. Contrast is decided by the helper, never by eye.
- **Do** keep hairlines at `{colors.rule}` (ink at 15%) and reserve solid ink borders
  for the primary action and the year rule.
- **Do** set numbers in tabular figures; the record is a column of dates and ratings.
- **Do** use Archivo's width axis for voice: wide for the wordmark (`wdth` 118),
  condensed for band labels (`wdth` 88).
- **Do** design empty and no-cover states as real settings with real copy — an
  unfilled slot is ruled, a coverless book gets a typographic jacket.
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
- **Don't** use the condensed tracked-out caps as a kicker or eyebrow above a heading;
  that voice belongs to content carried on a band.
- **Don't** use a glyph character, an icon font, or an emoji as an icon or a rating
  mark. Icons are authored SVG paths.
- **Don't** invent entries, ratings, reviews, counts, or activity to populate a
  design. The production database is empty; every state must be honest to that.
- **Don't** add a second animated moment. If something must move, replace the band
  wipe rather than joining it.

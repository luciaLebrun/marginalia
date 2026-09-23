---
version: 1
slug: "src-app-search-page-tsx"
primary_target: "src/app/search/page.tsx"
related_targets: ["src/components/SearchField.tsx","src/components/SearchResults.tsx","src/components/SearchResult.tsx","src/components/ShowMore.tsx"]
---

Scope: `/search` — find the book just finished and pick it. The first step of
capture, reached from the diary's "Log a book" cell. Signed-in only. Visitor
mode: Operate.

Audience and job: the reader, on phone or laptop, moments after closing a book.
Success is type, Enter, recognise the jacket, tap. Every second here counts
against "capture must be faster than the impulse to skip it".

Since MRG-068 the query is **two lines, title and author**, and either alone is
a search. Not a preference: both APIs take the two apart, and measured live
2026-09-19 the free-text form returned no Le Guin at all for "the dispossessed"
and no edition of Dune for "dune herbert", while the scoped form returns each
first. The cost accepted with it is that a second line now stands between the
reader and the grid, and that scoped search is stricter — a mistyped title
matches nothing rather than drifting to something near it, so the empty result
names the way out.

Constraints that bind: results come through `searchBooks()` from **both**
Google Books and Open Library, merged (MRG-063, MRG-067) — Google leads the
grid, Open Library holds the slots below it. A single result set can therefore
mix the two sources, and the surface may not say which is which. Covers come by CoverID from Open
Library and by URL from Google, which offers one size rather than a ladder; a
coverless result is the common case (3 of 5 in the Dune fixture), not the edge.
A source is slow (1–3s) and periodically down, and an outage must read as
"unavailable", never as a 500 and never as "no results" — and only both sources
failing is an outage. Tests run from fixtures, never the live API.

## Direction contract

THESIS: Search is the shelf before the book is on it. Results are the same
tri-band cell as a diary entry with the colour withheld — colour is what a book
earns by being logged. Refuses the category default: a live-updating dropdown
of text rows with thumbnails, and a store-style results page with filters.

OWN-WORLD: the incumbent tri-band world, unchanged. Wordmark band; the Field Row
(value at the field step over a band-voice label, on a ruled line, no box);
an outline button; an ink record band; the shelf grid. Result cells: ink band
with paper author, 2:3 sunk-paper jacket well, paper record band with title and
first-published year. State as printed marks: hairline at rest, solid ink on
hover and focus. No colour on any result.

STORY: The reader understands the field is already waiting for them, types, and
presses Enter. They recognise their book by its jacket in a grid that already
looks like their shelf, and take it.

FIRST VIEWPORT: Wordmark band edge to edge. Beneath it, two search field rows
stacked inside one 34rem measure — "Title" then "Author", each a value at the
field step on a ruled line — and an outline "Search" button closing the measure
at its right edge. Neither is autofocused: dropped for Sonar S9379 after review
— iOS ignores it without a tap, and it moves a screen reader past the page's
context. On a blank query, and only then, one line of guidance sits under the
Author rule as the Field Row's own hint — "A title, an author, or both.", in
soft ink at 0.8125rem, with both inputs pointing at it — so the rule governing
the pair is read before the submit rather than after it. Then a full-width ink
band carrying the state ("5 books" / "No search yet" on a blank query). A full
page offers whichever line is still empty ("First 20 — add the author to narrow
it", "First 20 — add a title to narrow it") and, with both filled, says only
"First 20 of more". The band must never claim an ordering: the merge orders by
SOURCE, not by closeness, so "closest first" and its kin are forbidden here —
Google leads the grid because it is steadier under load, not because it ranks
better.
Then the shelf grid of result cells, 2 columns at 390, 6 at 1440, starting
immediately below the band. Under a full grid, 24px down with its left edge on
the page padding, an Outline Button "Show 20 more" (MRG-073). The band's
"First N" follows the count — "First 40 — add the author to narrow it" — and
the no-ordering rule binds at 40 and 60 exactly as at 20. Blank query: the field and one line of guidance,
nothing else.

FORM: an extension of the established tri-band world (seed 400639f1), not a new
direction. No concept roll: a narrow request inside a settled world, with the
three open decisions (link target, result band, query model) answered by the
user in shape.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Decisions confirmed with the user

- Results link to `/book/[olWorkKey]` now; that 404s until MRG-015.
- Result top band is ink, no colour.
- Query is a GET form, URL-backed (`/search?title=&author=`), not
  search-as-you-type.
- Title and author are separate lines, stacked at every width, both capped at
  the same 34rem measure (user's call, 2026-09-19). Side by side on desktop was
  offered and declined.
- Scoped search stays strict: an empty result says so and names the way out,
  rather than silently retrying as a loose free-text search (user's call,
  2026-09-19).
- The way out of an empty result must be one that can *succeed*. Both sources
  AND the two terms, so a one-line miss is never told to add the other line —
  that narrows an already-empty search. One line filled: correct it or shorten
  it. Both filled: dropping the title is the only rescue, and it is a link
  ("search “herbert” alone") rather than an instruction, because clearing a
  field by hand on a phone is the most expensive thing this surface can ask at
  the moment capture is already going badly.
- The guidance is guidance, not a caption: it is on the page only while the
  query is blank. Once either line is filled the reader has followed it.

- **Show more (MRG-073, 2026-09-22):** an Outline Button link, chosen over a
  full-width ink band; steps of 20, capped at 60 (user's calls). Constraints
  that bind it:
  - `?shown=` is URL-backed and only a whole multiple of 20 up to 60 counts;
    anything else is the first page.
  - The merge fills **page by page** (12 Google / 8 Open Library each), so
    page 1 never changes and books only ever append — into the partial row's
    ruled slots, then below. Merging one block would reshuffle the top.
  - Google serves at most 20 per request whatever `maxResults` says (measured
    live), so it is paged by `startIndex`.
  - `prefetch` off: the control never spends upstream calls by scrolling into
    view. `scroll` off: the reader stays put. `shown` is left out of the
    Suspense key, so the books on screen stay while more arrive.
  - **Focus:** keyboard activation moves focus to the first new result (#21,
    #41) without scrolling; the band's `<output>` announces the new count. A
    pointer click moves nothing.
  - **Never removed** (Printed State Rule): at the cap, or when a step comes
    back short, it stays ruled through (hairline border, struck label at 50%,
    a native disabled `<button>`) with one soft-ink line beside it — "Sixty is the most a
    search shows — add the author to narrow it" (the band's offer, by which
    line is empty; no offer with both filled), or "That is every book the
    search found." when the sources are spent — never "both sources": one may
    be down and merged as nothing, and the surface never names a source.

## States

Blank (both lines empty, the hint present, band says "No search yet") ·
searching (both lines stay, band says "Searching…" over the ruled empty grid,
no skeleton cards) · results 1–20 · exactly 20 (narrowing offer worded by which
line is still empty) · title only · author only · show more offered (a full page at 20 or 40) ·
finding more ("Finding more…" in place, width held, flood kept under the
pointer or focus) · show more ruled through at the cap (60) · ruled through
because the sources are spent (a short page after a step) · a short first page
(no control at all) · no results · unavailable (soft ink on sunk paper, not alarm — nothing
was refused) · signed out → `/` · no handle → `/claim`.

## Unresolved

- None blocking. MRG-021 (search unavailable state) closed with the first build.
- MRG-069 adds a language choice (English default, English/French) on top of
  these two lines — a third control in this row, still to be placed.

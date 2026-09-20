---
version: 1
slug: "src-app-search-page-tsx"
primary_target: "src/app/search/page.tsx"
related_targets: ["src/components/SearchField.tsx","src/components/SearchResults.tsx","src/components/SearchResult.tsx"]
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
immediately below the band. Blank query: the field and one line of guidance,
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

## States

Blank (both lines empty, the hint present, band says "No search yet") ·
searching (both lines stay, band says "Searching…" over the ruled empty grid,
no skeleton cards) · results 1–20 · exactly 20 (narrowing offer worded by which
line is still empty) · title only · author only · no results · unavailable (soft ink on sunk paper, not alarm — nothing
was refused) · signed out → `/` · no handle → `/claim`.

## Unresolved

- None blocking. MRG-021 (search unavailable state) closed with the first build.
- MRG-069 adds a language choice (English default, English/French) on top of
  these two lines — a third control in this row, still to be placed.

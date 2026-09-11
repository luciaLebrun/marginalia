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

Constraints that bind: results come only from Open Library through
`searchBooks()`; covers by CoverID only, and a coverless result is the common
case (3 of 5 in the Dune fixture), not the edge. Open Library is slow (1–3s)
and periodically down, and an outage must read as "unavailable", never as a 500
and never as "no results". Tests run from fixtures, never the live API.

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

FIRST VIEWPORT: Wordmark band edge to edge. Beneath it, the search field row:
"Search" label, the query at the field step on a ruled line capped at 34rem,
autofocused, with an outline "Search" button beside it. Then a full-width ink
band carrying the count ("5 books" / "First 20 — add the author to narrow it").
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
- Query is a GET form, URL-backed (`/search?q=`), not search-as-you-type.

## States

Blank · searching (field stays, band says "Searching Open Library…" over the
ruled empty grid, no skeleton cards) · results 1–20 · exactly 20 (narrowing
hint) · no results · unavailable (soft ink on sunk paper, not alarm — nothing
was refused) · signed out → `/` · no handle → `/claim`.

## Unresolved

- None blocking. MRG-021 (search unavailable state) closes with this build.

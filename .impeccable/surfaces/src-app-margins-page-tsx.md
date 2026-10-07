---
version: 1
slug: "src-app-margins-page-tsx"
primary_target: "src/app/margins/page.tsx"
related_targets: ["src/components/MarginsView.tsx","src/components/PassageSheet.tsx","src/components/BookTitlePage.tsx","src/app/dev/margins/page.tsx"]
---

Scope: Margins (MRG-110) — `/margins`, the reader's private journal of passages
kept from books, plus the "Keep a passage" sheet on the book page. Visitor
mode: Read. Inherits both established worlds: Tri-band at ≥40rem, Now Reading
below (see src-app-page-tsx.md); no new tokens.

Audience and job: the reader alone (private, never on the profile, never a
feed). They keep a passage mid-book or after, from that book's page; later they
come here to reread the words they kept. Newest first. A passage = words
(required, ≤1,500 chars), optional page, optional note (≤280). Belongs to the
book, not a read. Edit and delete allowed (guarded remove, as a read's).

Constraints: no invented passages in shipped states (PRODUCT.md); the empty
state is honest and points at a book's page. Earned Colour Rule holds: a
passage from a book not on the shelf floods ink, not jacket colour.

## Direction contract

THESIS: The words lead. Margins is a reader's commonplace book: the latest passage owns the first viewport as a quotation, the rest follow as one quiet column. Refuses the quote-card wall and the cover grid.

OWN-WORLD: Inherited. Phone: night ground, latest passage on its book's flood, words at display scale, jacket only a small stamp. Laptop: Tri-band — book-colour band, words at headline on paper, hairline-ruled column.

STORY: The reader sees the last thing they kept, recognises the book by its colour and stamp, and scrolls back through what struck them.

FIRST VIEWPORT: Phone: flood field with the latest words in display type, "Title · p. 214" and the note under it, small jacket stamp. Below, earlier passages, each words then a stamp line. The bar's second slot is Margins.

FORM: Spotlight and journal, dealt card 6 of my ordered list, chosen by the user; seed fa5d3e75.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

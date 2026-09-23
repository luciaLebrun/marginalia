/**
 * A book's category, for grouping the shelf (MRG-072). One label per book,
 * worked out once when the book is opened and stored on its row.
 *
 * The vocabulary is Google's BISAC paths cut to their **second level**:
 * "Fiction / Science Fiction / General" is "Science Fiction". The top level
 * alone would put nearly every novel under "Fiction", which sorts nothing.
 * Open Library has no such scheme, only long, multilingual, free-form
 * subjects, so those are mapped by keyword onto the same labels.
 *
 * Measured live 2026-09-24: only Google's `/volumes/{id}` carries the full
 * path. Its search endpoint cuts categories to the top level, and about half
 * of all editions (French ones especially) have none at all.
 */

/** Pure. "Fiction / Science Fiction / General" → "Science Fiction". */
function bisacLabel(path: string): { label: string; specific: boolean } | null {
  const [top, second] = path.split("/").map((part) => part.trim());
  if (!top) return null;
  if (second && second !== "General") return { label: second, specific: true };
  return { label: top, specific: false };
}

/**
 * Pure. The label from Google's `volumeInfo.categories`.
 *
 * A book with several paths keeps one, the first with a real second level, so
 * "Fiction / General, Fiction / Literary" is "Literary" rather than "Fiction".
 */
export function categoryFromBisac(categories: unknown): string | undefined {
  if (!Array.isArray(categories)) return undefined;
  const labels = categories
    .filter((c): c is string => typeof c === "string")
    .map(bisacLabel)
    .filter((l) => l !== null);
  return (labels.find((l) => l.specific) ?? labels[0])?.label;
}

/**
 * Open Library subject keywords onto BISAC labels, in tiers. Open Library
 * tags a book with every genre anyone has filed it under — Earthsea carries
 * "Science fiction" as well as three fantasy subjects, Dune a "Fantasy
 * fiction" as well as four science-fiction ones — so within a tier the label
 * the most subjects name wins, ties going to the earlier rule.
 *
 * The tiers run fiction genres, then bare "Fiction", then non-fiction: a
 * novel is also often tagged with the non-fiction subjects it touches
 * ("Philosophical novels", "History"), and those must not outvote it.
 *
 * ponytail: a keyword count, not a classifier. It covers the common genres;
 * add a rule when a real book lands in the wrong group or in "Uncategorised".
 */
const SUBJECT_TIERS: [RegExp, string][][] = [
  [
    [/\bscience fiction\b|\bscience-fiction\b/, "Science Fiction"],
    [/\bfantasy\b/, "Fantasy"],
    [/\bromance\b|\blove stories\b/, "Romance"],
    [/\bdetective\b|\bmystery\b|\bmysteries\b/, "Mystery & Detective"],
    [/\bthrillers?\b|\bsuspense\b/, "Thrillers"],
    [/\bhorror\b/, "Horror"],
    [/\bhistorical fiction\b/, "Historical"],
    [/\bcomic books?\b|\bgraphic novels?\b|\bcomics\b/, "Comics & Graphic Novels"],
  ],
  [[/^fiction\b/, "Fiction"]],
  [
    [/\bpoetry\b/, "Poetry"],
    [/\bbiography\b|\bautobiography\b|\bmemoirs?\b/, "Biography & Autobiography"],
    [/\bphilosophy\b/, "Philosophy"],
    [/\bhistory\b/, "History"],
    [/\bpsychology\b/, "Psychology"],
    [/\bscience\b/, "Science"],
  ],
];

/** Pure. The label from Open Library's `subjects`. */
export function categoryFromSubjects(subjects: unknown): string | undefined {
  if (!Array.isArray(subjects)) return undefined;
  const folded = subjects
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.toLowerCase().trim());
  for (const tier of SUBJECT_TIERS) {
    let best: { label: string; hits: number } | undefined;
    for (const [rule, label] of tier) {
      const hits = folded.filter((s) => rule.test(s)).length;
      if (hits > (best?.hits ?? 0)) best = { label, hits };
    }
    if (best) return best.label;
  }
  return undefined;
}

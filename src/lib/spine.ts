/**
 * The bedside stack's geometry (MRG-059): how a saved book lies in the pile.
 * Pure and free of any database import, because the stack is a client
 * component and must not pull the driver into the browser.
 */

const SPINE_MIN_REM = 3.5;
const SPINE_MAX_REM = 6;
const SPINE_UNKNOWN_REM = 4.5;
// Most books a reader saves run 200 to 700 pages; mapping that span to the
// whole height range is what makes a thick book visibly thick.
const THIN_BOOK = 200;
const THICK_BOOK = 700;

/**
 * A spine's height in rem, from the book's length: a thick book sits thick in
 * the pile. Clamped so a pamphlet stays a spine and a doorstop stays on the
 * page; a book with no page count takes a middling spine rather than none.
 * Rounded to quarter-rems so neighbouring spines of similar books match.
 */
export function spineHeightRem(pageCount: number | null): number {
  if (pageCount === null || !Number.isFinite(pageCount) || pageCount <= 0) {
    return SPINE_UNKNOWN_REM;
  }
  const clamped = Math.min(Math.max(pageCount, THIN_BOOK), THICK_BOOK);
  const share = (clamped - THIN_BOOK) / (THICK_BOOK - THIN_BOOK);
  return Math.round((SPINE_MIN_REM + share * (SPINE_MAX_REM - SPINE_MIN_REM)) * 4) / 4;
}

/**
 * How far off true a spine lies, as a step from 0 to 3. Stable on the work
 * key, so the pile never reshuffles between visits — a list that rearranges
 * itself reads as broken, not as real.
 */
export function spineOffsetStep(olWorkKey: string): 0 | 1 | 2 | 3 {
  let hash = 0;
  for (let i = 0; i < olWorkKey.length; i++) {
    hash = (hash * 31 + (olWorkKey.codePointAt(i) ?? 0)) >>> 0;
  }
  return (hash % 4) as 0 | 1 | 2 | 3;
}

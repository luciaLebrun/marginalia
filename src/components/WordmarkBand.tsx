import { CATEGORY_BANDS, readableOn } from "@/lib/color";

const BAND = CATEGORY_BANDS[0];

/**
 * The masthead's colour band on its own, for pages that have no reader to name
 * yet. Extracted so the wordmark is defined once rather than copied.
 */
export function WordmarkBand() {
  return (
    <div
      className="flex items-baseline justify-between gap-4 px-4 py-5 sm:px-6 sm:py-7"
      style={{ background: BAND, color: readableOn(BAND) }}
    >
      <p className="band-wordmark text-[1rem] sm:text-[1.375rem]">Marginalia</p>
      <p className="band-label opacity-80">A reading diary</p>
    </div>
  );
}

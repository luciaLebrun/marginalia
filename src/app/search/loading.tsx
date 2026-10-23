import { LoadingFrame, ShelfFrame } from "@/components/LoadingFrame";
import { WordmarkBand } from "@/components/WordmarkBand";

/** The real heading depends on `?log=1`, which a loading file cannot read, so
 * it is ruled rather than guessed. */
export default function Loading() {
  return (
    <LoadingFrame>
      <WordmarkBand />
      <div aria-hidden="true" className="px-5 pt-4 sm:hidden">
        <div className="h-[2.25rem] border-b-2 border-rule" />
      </div>
      {/* SearchField's own form, line for line, so the shelf below does not
          move when it lands: two labelled lines, the hint, the button's slot. */}
      <div aria-hidden="true" className="border-b border-rule px-4 py-5 sm:px-6">
        <div className="max-w-[34rem] space-y-5">
          {["Title", "Author"].map((label) => (
            <div key={label}>
              <p className="band-label text-ink-soft">{label}</p>
              <div className="mt-2 h-[2.5rem] border-b-2 border-rule" />
            </div>
          ))}
          <div className="-mt-3 h-[1.375rem]" />
          <div className="flex justify-end">
            <div className="h-[2.625rem] w-[5.5rem]" />
          </div>
        </div>
      </div>
      <ShelfFrame />
    </LoadingFrame>
  );
}

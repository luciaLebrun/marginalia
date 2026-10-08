import { LoadingFrame } from "@/components/LoadingFrame";
import { WordmarkBand } from "@/components/WordmarkBand";

export default function Loading() {
  return (
    <LoadingFrame bar={false}>
      <WordmarkBand />
      <div aria-hidden="true" className="px-4 py-10 sm:px-6">
        {/* The card's ink head band and one input rule. */}
        <div className="max-w-[26rem] border border-ink bg-paper">
          <div className="h-[2.0625rem] bg-ink" />
          <div className="px-3 py-5">
            <div className="h-[2.5rem] border-b-2 border-rule" />
          </div>
        </div>
      </div>
    </LoadingFrame>
  );
}

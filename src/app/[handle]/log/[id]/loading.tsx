import { LoadingFrame } from "@/components/LoadingFrame";
import { WordmarkBand } from "@/components/WordmarkBand";

/** A shared review is public: no bar, and not the profile's frame. The jacket
 * and title are drawn as the book page's frame draws them. */
export default function Loading() {
  return (
    <LoadingFrame bar={false}>
      <WordmarkBand />
      <div aria-hidden="true" className="grid gap-6 px-4 pt-6 pb-10 sm:grid-cols-[min(24rem,33%)_minmax(0,1fr)] sm:gap-10 sm:px-6 sm:pt-8">
        <div className="mx-auto w-3/5 max-w-[24rem] sm:mx-0 sm:w-full">
          <div className="aspect-[2/3] border border-rule bg-paper-sunk" />
        </div>
        <div className="h-[2.25rem] max-w-[34rem] border-b-2 border-rule sm:h-[3.5rem]" />
      </div>
    </LoadingFrame>
  );
}

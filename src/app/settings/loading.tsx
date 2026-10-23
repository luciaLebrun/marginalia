import { LoadingFrame, RowsFrame } from "@/components/LoadingFrame";
import { WordmarkBand } from "@/components/WordmarkBand";

export default function Loading() {
  return (
    <LoadingFrame>
      <WordmarkBand />
      <h1 className="px-4 py-6 text-[2.25rem] leading-[0.95] font-semibold tracking-[-0.02em] sm:px-6 sm:py-8 sm:text-[3.5rem]">
        Your account
      </h1>
      <RowsFrame rows={4} />
    </LoadingFrame>
  );
}

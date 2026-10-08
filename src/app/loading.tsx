import { FloodFrame, HeadFrame, LoadingFrame, ShelfFrame } from "@/components/LoadingFrame";

/**
 * The diary's, and the fallback for any segment without its own. `/book`,
 * `/claim` and `/dev` have theirs, so nothing else is drawn as a diary.
 */
export default function Loading() {
  return (
    <LoadingFrame>
      <FloodFrame jacket />
      <div className="m-hidden">
        <HeadFrame />
      </div>
      <ShelfFrame />
    </LoadingFrame>
  );
}

import { BookOpening } from "@/components/BookStates";
import { LoadingFrame } from "@/components/LoadingFrame";
import { WordmarkBand } from "@/components/WordmarkBand";

/**
 * The page's own frame, for the moment before it can decide whether to stream
 * one (session and stored-book lookup). Without this the root diary frame
 * would show here.
 */
export default function Loading() {
  return (
    <LoadingFrame>
      <div className="m-hidden">
        <WordmarkBand />
      </div>
      <BookOpening />
    </LoadingFrame>
  );
}

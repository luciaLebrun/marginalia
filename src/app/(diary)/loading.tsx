import { FloodFrame, HeadFrame, LoadingFrame, ShelfFrame } from "@/components/LoadingFrame";

/**
 * The diary's alone: the (diary) group keeps it from wrapping every other
 * route. In particular `/book` has no loading file, so a stored book renders
 * whole and its jacket flies from the shelf rather than landing on a frame.
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

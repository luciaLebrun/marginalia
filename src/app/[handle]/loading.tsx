import { HeadFrame, LoadingFrame, ShelfFrame } from "@/components/LoadingFrame";

/** A visitor has no bar on a profile and the session is not known here, so the
 * bar is drawn for the signed-in majority; it is the real one, and a visitor's
 * page replaces it within the same render. */
export default function Loading() {
  return (
    <LoadingFrame>
      <HeadFrame />
      <ShelfFrame />
    </LoadingFrame>
  );
}

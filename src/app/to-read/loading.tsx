import { HeadFrame, LoadingFrame, ShelfFrame } from "@/components/LoadingFrame";

export default function Loading() {
  return (
    <LoadingFrame>
      <HeadFrame name="To read" />
      <ShelfFrame />
    </LoadingFrame>
  );
}

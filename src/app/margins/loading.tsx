import { FloodFrame, HeadFrame, LoadingFrame } from "@/components/LoadingFrame";

export default function Loading() {
  return (
    <LoadingFrame>
      <FloodFrame lines={3} />
      <div className="m-hidden">
        <HeadFrame name="Margins" />
      </div>
    </LoadingFrame>
  );
}

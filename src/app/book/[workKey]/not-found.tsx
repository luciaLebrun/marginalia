import { BookNotFound } from "@/components/BookStates";
import { WordmarkBand } from "@/components/WordmarkBand";

/** Rendered in place of the whole page, so it carries its own wordmark. */
export default function NotFound() {
  return (
    <main className="flex-1">
      <WordmarkBand />
      <BookNotFound />
    </main>
  );
}

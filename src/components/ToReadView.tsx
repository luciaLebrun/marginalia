import type { ComponentProps } from "react";

import { Masthead } from "./Masthead";
import { ToReadStack } from "./ToReadStack";
import { DIARY_LINK } from "@/lib/masthead-link";
import type { ToReadBook } from "@/lib/to-read";

/** Shared with the development harness, which has no session. */
export function ToReadView({ books, action }: Readonly<{ books: ToReadBook[]; action?: ComponentProps<typeof ToReadStack>["action"] }>) {
  const noun = books.length === 1 ? "book" : "books";
  return (
    <main className="flex-1">
      <Masthead
        name="To read"
        span={`${books.length} ${noun}`}
        count={books.length}
        tally={books.length === 0 ? "Saved from a book’s page" : "Newest saved on top"}
        link={DIARY_LINK}
      />
      <ToReadStack books={books} action={action} />
    </main>
  );
}

"use client";

import { useState } from "react";

import { ToReadView } from "@/components/ToReadView";
import type { ToReadState } from "@/app/actions";
import type { ToReadBook } from "@/lib/to-read";

/** Dev harness only (MRG-079): a take-off that works, so focus-after can be driven. */
export function RemovableToRead({ books: initial }: Readonly<{ books: ToReadBook[] }>) {
  const [books, setBooks] = useState(initial);
  const action = async (_previous: ToReadState, formData: FormData): Promise<ToReadState> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const bookId = String(formData.get("bookId"));
    setBooks((current) => current.filter((book) => book.bookId !== bookId));
    return { saved: false, bookId, error: null, signedOut: false };
  };
  return <ToReadView books={books} action={action} />;
}

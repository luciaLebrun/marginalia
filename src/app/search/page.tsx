import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SearchField } from "@/components/SearchField";
import { SearchPending, SearchResults } from "@/components/SearchResults";
import { WordmarkBand } from "@/components/WordmarkBand";
import { getAuth } from "@/lib/auth";
import { parseQuery } from "@/lib/search";

/**
 * Finding the book just finished — the first step of logging it.
 *
 * Signed-in only: the door is the one surface open to anybody, and there is
 * nothing to do with a search result without a diary to put it in.
 */
export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect("/");
  if (!session.user.username) redirect("/claim");

  const query = parseQuery((await searchParams).q);

  return (
    <main className="flex-1">
      <WordmarkBand />
      <h1 className="sr-only">Search for a book</h1>
      <SearchField query={query} />
      {/* Keyed on the query so every new search shows its pending state rather
          than holding the previous results on screen while Open Library works. */}
      <Suspense key={query} fallback={<SearchPending />}>
        <SearchResults query={query} />
      </Suspense>
    </main>
  );
}

export async function generateMetadata({
  searchParams,
}: PageProps<"/search">): Promise<Metadata> {
  const query = parseQuery((await searchParams).q);
  return { title: query ? `“${query}” — Search — Marginalia` : "Search — Marginalia" };
}

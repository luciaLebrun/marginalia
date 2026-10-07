import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { BottomBar } from "@/components/BottomBar";
import { Place } from "@/components/Place";
import { SearchField } from "@/components/SearchField";
import { SearchPending, SearchResults } from "@/components/SearchResults";
import { WordmarkBand } from "@/components/WordmarkBand";
import { getAuth } from "@/lib/auth";
import { parseQuery, parseShown, queryPhrase, isBlank } from "@/lib/search";

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

  const params = await searchParams;
  const query = parseQuery(params);

  // The bar's Log slot lands here with ?log=1: the same search, asked as the
  // question the reader is actually answering.
  const logging = params.log === "1" && isBlank(query);

  return (
    <>
    <Place>
    <main className="flex-1">
      <WordmarkBand />
      <h1 className="px-5 pt-4 text-[2.25rem] leading-[0.95] font-bold tracking-[-0.03em] text-balance [font-stretch:108%] sm:sr-only">
        {logging ? "What did you just finish?" : "Search for a book"}
      </h1>
      <SearchField query={query} />
      {/* Keyed on the query so every new search shows its pending state rather
          than holding the previous results on screen while the sources work.
          `shown` is left out of the key on purpose: showing more keeps the
          books already on screen while the next ones arrive. */}
      <Suspense key={`${query.title}|${query.author}`} fallback={<SearchPending />}>
        <SearchResults query={query} shown={parseShown(params.shown)} />
      </Suspense>
    </main>
    </Place>
    <BottomBar />
    </>
  );
}

export async function generateMetadata({
  searchParams,
}: PageProps<"/search">): Promise<Metadata> {
  const query = parseQuery(await searchParams);
  return {
    title: isBlank(query)
      ? "Search — Marginalia"
      : `${queryPhrase(query)} — Search — Marginalia`,
  };
}

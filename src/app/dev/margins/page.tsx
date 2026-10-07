import { notFound } from "next/navigation";

import { getDevReader, NoDevReader } from "@/app/dev/dev-reader";
import { MarginsView } from "@/components/MarginsView";
import { getPassages } from "@/lib/passage";

/**
 * Development harness for `/margins`, which is signed-in only. Renders the
 * real view for the seeded dev reader (`pnpm seed:dev` keeps three short
 * passages). `?state=empty` draws the first-run page, `?state=one` only the
 * latest passage, and `?state=long` puts an invented worst case first — an
 * unbroken word, a bare link and a long paragraph — to prove nothing widens
 * the page. Render-only: its sheets reach the real actions, which refuse
 * without a session. It 404s in production.
 */
export default async function DevMarginsPage({ searchParams }: PageProps<"/dev/margins">) {
  if (process.env.NODE_ENV === "production") notFound();

  const reader = await getDevReader();
  if (!reader) return <NoDevReader />;

  const { state } = await searchParams;
  const passages = await getPassages(reader.id);
  if (state === "empty") return <MarginsView passages={[]} />;
  if (state === "one") return <MarginsView passages={passages.slice(0, 1)} />;
  if (state === "long" && passages[0]) {
    const words = `Antidisestablishmentarianismincomprehensibilities, then https://example.org/a/link/without/any/spaces/that/keeps/going/and/going. ${"A sentence that runs on for a while. ".repeat(20)}`.trim();
    const note = "Anoteofasinglewordthatisfarlongerthananyphonecouldeverholdonone line.";
    return <MarginsView passages={[{ ...passages[0], id: "long", words, note }, ...passages]} />;
  }
  return <MarginsView passages={passages} />;
}

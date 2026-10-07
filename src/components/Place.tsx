import { ViewTransition } from "react";

/**
 * A page's way in and out. Navigations tagged by their links decide the move:
 * deeper slides from the right, back from the left, a place in the bar
 * crossfades up, and a book's page rises over the shelf. Untagged navigations
 * (browser back, a refresh) do not slide; the jacket morph still plays.
 */
const MOVES = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  "nav-swap": "nav-swap",
  "sheet-up": "sheet-up",
  default: "none",
};

export function Place({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ViewTransition enter={MOVES} exit={MOVES} default="none">
      {children}
    </ViewTransition>
  );
}

/** A jacket's name across pages, so the shelf's and the book page's pair. */
export function jacketName(sourceKey: string): string {
  return `jacket-${sourceKey.replaceAll(/[^a-zA-Z0-9_-]/g, "-")}`;
}

/** The jacket that travels between the shelf and its book page. */
export function Jacket({
  sourceKey,
  children,
}: Readonly<{ sourceKey: string | null; children: React.ReactNode }>) {
  if (!sourceKey) return children;
  return (
    <ViewTransition name={jacketName(sourceKey)} share="jacket" default="none">
      {children}
    </ViewTransition>
  );
}

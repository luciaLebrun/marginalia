"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

import { Cover } from "./Cover";
import type { DiaryEntry } from "./Entry";
import { bookPath } from "@/lib/client-safe";
import { bandColor, readableOn } from "@/lib/color";
import { spineOffsetStep } from "@/lib/spine";
import styles from "./Shelf3D.module.css";

/**
 * The diary as a library shelf (MRG-085 mock): every book stands spine out,
 * and choosing one pulls it off the shelf and turns it to show its jacket.
 *
 * Pure CSS 3D — each book is a box of four faces under one perspective — so
 * it costs no library, no canvas and no WebGL, and runs on any browser that
 * draws the flat shelf. The one exception to the Flat Ink Rule lives here,
 * by the author's choice: this view is lit.
 *
 * The spine is the toggle; the jacket, once facing the reader, is the link to
 * the book page. Escape, or choosing the book again, puts it back.
 */
export function Shelf3D({ entries }: Readonly<{ entries: DiaryEntry[] }>) {
  const [pulled, setPulled] = useState<string | null>(null);

  useEffect(() => {
    if (!pulled) return;
    const putBack = (event: KeyboardEvent) => event.key === "Escape" && setPulled(null);
    globalThis.addEventListener("keydown", putBack);
    return () => globalThis.removeEventListener("keydown", putBack);
  }, [pulled]);

  return (
    <ol className={styles.shelf} aria-label="Your shelf, newest read first">
      {entries.map((entry) => (
        <Book
          key={entry.id}
          entry={entry}
          pulled={pulled === entry.id}
          toggle={() => setPulled(pulled === entry.id ? null : entry.id)}
        />
      ))}
    </ol>
  );
}

function Book({
  entry,
  pulled,
  toggle,
}: Readonly<{ entry: DiaryEntry; pulled: boolean; toggle: () => void }>) {
  const band = bandColor(entry.coverColor, entry.sourceKey);
  const step = spineOffsetStep(entry.sourceKey);
  const author = entry.authors[0];

  // ponytail: thickness and height come from a stable hash of the work key;
  // swap in the real page count (spineHeightRem) once the diary query has it.
  const geometry = {
    "--band": band,
    "--ink-on-band": readableOn(band),
    "--thick": `${2.1 + step * 0.35}rem`,
    "--tall": `${0.9 + ((step + 1) % 4) * 0.035}`,
  } as CSSProperties;

  return (
    <li className={styles.slot} style={geometry} data-pulled={pulled || undefined}>
      <div className={styles.book}>
        <button
          type="button"
          className={`${styles.face} ${styles.spine}`}
          aria-expanded={pulled}
          aria-label={author ? `${entry.title} by ${author}` : entry.title}
          onClick={toggle}
        >
          <span className={styles.spineTitle}>{entry.title}</span>
          {author && <span className={styles.spineAuthor}>{author}</span>}
        </button>

        <Link
          href={bookPath(entry.sourceKey)}
          className={`${styles.face} ${styles.jacket}`}
          tabIndex={pulled ? 0 : -1}
          aria-hidden={!pulled}
          aria-label={`Open ${entry.title}`}
        >
          <Cover
            coverId={entry.coverId}
            coverUrl={entry.coverUrl}
            title={entry.title}
            authors={entry.authors}
            sizes="10rem"
          />
        </Link>

        <span aria-hidden="true" className={`${styles.face} ${styles.pages}`} />
        <span aria-hidden="true" className={`${styles.face} ${styles.back}`} />
      </div>
    </li>
  );
}

/**
 * A search as the reader typed it: a title, an author, or both (MRG-068).
 *
 * The two travel apart all the way down to each source's API, because both
 * take them apart: Google as `intitle:` / `inauthor:`, Open Library as its
 * `title` and `author` parameters. Joining them into one string and hoping the
 * ranker guesses which word is which is what made "dune herbert" return a book
 * about soil.
 */
export interface BookQuery {
  title: string;
  author: string;
}

/** A book as it appears in a search result grid. */
export interface BookSummary {
  /**
   * The book's key, and its URL segment. Source-tagged, because there are now
   * two sources: a Google Books volume is "gb:B1hSG45JCX4C", an Open Library
   * work stays bare, "OL45804W", so every link made before Google became
   * primary still opens.
   */
  sourceKey: string;
  title: string;
  subtitle?: string;
  authors: string[];
  firstPublishYear?: number;
  /** Open Library numeric CoverID. The ONLY safe input to an OL cover URL. */
  coverId?: number;
  /** An absolute jacket URL, for a source that addresses covers by URL (Google). */
  coverUrl?: string;
  isbn13?: string;
  editionCount?: number;
}

/** A book with everything we persist. */
export interface BookDetail extends BookSummary {
  olEditionKey?: string;
  pageCount?: number;
  description?: string;
  /** One shelf category, e.g. "Science Fiction" (MRG-072). See category.ts. */
  category?: string;
  source: "google" | "openlibrary" | "openlibrary+google";
}

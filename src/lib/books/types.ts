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
  source: "google" | "openlibrary" | "openlibrary+google";
}

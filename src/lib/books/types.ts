/** A book as it appears in a search result grid. */
export interface BookSummary {
  /** Open Library work key, stored bare: "OL45804W". */
  olWorkKey: string;
  title: string;
  subtitle?: string;
  authors: string[];
  firstPublishYear?: number;
  /** Open Library numeric CoverID. The ONLY safe input to a cover URL. */
  coverId?: number;
  isbn13?: string;
  editionCount?: number;
}

/** A book with everything we persist. */
export interface BookDetail extends BookSummary {
  olEditionKey?: string;
  pageCount?: number;
  description?: string;
  source: "openlibrary" | "openlibrary+google";
}

/**
 * A slip date. `read_at` is a calendar date stored at UTC midnight, so it is
 * formatted in UTC — in a local zone west of Greenwich it would print as the
 * day before.
 *
 * Its own module, free of any database import, because the log sheet prints
 * the same words in the browser that the slip will print once the read is
 * saved.
 */
const SLIP_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function slipDate(readAt: Date | null): string {
  return readAt ? SLIP_DATE.format(readAt) : "Undated";
}

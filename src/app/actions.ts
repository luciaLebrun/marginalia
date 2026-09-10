"use server";

import { markDiarySeen } from "@/lib/diary";

/**
 * Stamp the reader's last-seen time. Scoped to the id it is given, which is
 * safe here because it writes only a timestamp and leaks nothing back — but
 * once real sessions exist this must take the id from the session instead of
 * from its caller.
 */
export async function markSeenAction(userId: string): Promise<void> {
  await markDiarySeen(userId);
}

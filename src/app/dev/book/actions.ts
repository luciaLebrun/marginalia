"use server";

import type { FavouriteState } from "@/app/actions";

/**
 * The book harness's stand-in for `toggleFavouriteAction` (MRG-071): it writes
 * nothing, waits long enough for the pending state to be seen, and answers as
 * the real action does on success — so the control's pending, printed and
 * focus-after states can be driven without a Google session.
 *
 * A server action is an endpoint in every build, so it refuses in production
 * rather than relying on its page 404ing.
 */
export async function toggleDevFavouriteAction(
  _previous: FavouriteState,
  formData: FormData,
): Promise<FavouriteState> {
  if (process.env.NODE_ENV === "production") throw new Error("Not available.");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return { favourite: formData.get("intent") === "add", error: null, signedOut: false };
}

"use server";

import { revalidatePath } from "next/cache";

import { DEV_READER_ID } from "@/app/dev/dev-reader";
import { moveFavourite } from "@/lib/favourites";

/**
 * The diary harness's stand-in for `moveFavouriteAction` (MRG-071), so
 * arranging can be driven and reviewed without a Google session.
 *
 * A server action is an endpoint in every build, this one included, so it
 * refuses outright in production rather than relying on its page 404ing. It
 * only ever moves the seeded dev reader's favourites, and takes nothing from
 * the form but the book and the position.
 */
export async function moveDevFavouriteAction(formData: FormData): Promise<void> {
  if (process.env.NODE_ENV === "production") throw new Error("Not available.");

  const bookId = String(formData.get("bookId") ?? "");
  const to = Number(formData.get("to"));
  if (bookId && Number.isInteger(to) && (await moveFavourite(DEV_READER_ID, bookId, to))) {
    revalidatePath("/dev/shelf");
  }
}

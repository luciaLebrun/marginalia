"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/lib/auth";
import { markDiarySeen } from "@/lib/diary";
import { claimUsername } from "@/lib/profile";
import { handlePath, usernameError } from "@/lib/username";

/**
 * Stamp the reader's last-seen time. Scoped to the id it is given, which is
 * safe here because it writes only a timestamp and leaks nothing back — but
 * once real sessions exist this must take the id from the session instead of
 * from its caller.
 */
export async function markSeenAction(userId: string): Promise<void> {
  await markDiarySeen(userId);
}

export interface ClaimState {
  error: string | null;
}

/**
 * Whose account this action may name.
 *
 * The session decides, always — a server action is a public endpoint, so an id
 * passed in by the caller would let anyone name anyone else's unclaimed
 * account. The development harness has no session, so it may pass an id, but
 * only outside production and only for the seeded local reader.
 */
async function resolveClaimant(formData: FormData): Promise<string | null> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (session) return session.user.id;

  if (process.env.NODE_ENV === "production") return null;

  const devUserId = String(formData.get("devUserId") ?? "");
  return devUserId.startsWith("dev-") ? devUserId : null;
}

/** Claim a username for the signed-in reader. */
export async function claimUsernameAction(
  _previous: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const userId = await resolveClaimant(formData);
  if (!userId) return { error: "Sign in to claim a username." };

  const input = String(formData.get("username") ?? "");

  // Say why before touching the database, so the reader gets a reason rather
  // than a generic refusal.
  const shapeError = usernameError(input);
  if (shapeError) return { error: shapeError };

  const result = await claimUsername(userId, input);

  if (result.ok) redirect(handlePath(result.username));

  switch (result.reason) {
    case "taken":
      return { error: "Someone already has that one." };
    case "already-claimed":
      return { error: "You have already claimed a username." };
    default:
      return { error: "That username will not work." };
  }
}

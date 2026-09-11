"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { accountSchema, deleteAccount } from "@/lib/account";
import { getAuth } from "@/lib/auth";
import { markDiarySeen } from "@/lib/diary";
import {
  INVITE_COOKIE,
  INVITE_COOKIE_MAX_AGE,
  createInviteCodes,
  isInviteCodeUsable,
  normalizeInviteCode,
} from "@/lib/invite";
import { isOwner } from "@/lib/owner";
import { claimUsername, updateAccount } from "@/lib/profile";
import { createRead } from "@/lib/read";
import { isLogReadField, readSchema, type LogReadField } from "@/lib/read-schema";
import {
  handlePath,
  normalizeUsername,
  usernameError,
} from "@/lib/username";

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

/* -------------------------------------------------------------------------- */
/* The door                                                                    */
/* -------------------------------------------------------------------------- */

export interface DoorState {
  error: string | null;
}

/**
 * Send someone to Google, optionally carrying an invite code.
 *
 * Google gives us no way to attach a form field to its callback, so a validated
 * code is stashed in a short-lived httpOnly cookie and read back in Better
 * Auth's `user.create.before` hook. That hook is the gate; this is only the
 * courier.
 *
 * The code is checked for usability *before* the round trip on purpose. It is a
 * weak oracle — someone can learn that a code they already hold is spent — and
 * the alternative is worse: a friend with a typo would be bounced through
 * Google, have their sign-up aborted, and land back here with a burned session
 * and no idea why. With 29^8 codes and single figures of them live, guessing is
 * not the threat model; mistyping is.
 *
 * An existing member needs no code at all: `enforceInvite` runs only when a
 * user row is being created.
 */
export async function beginSignInAction(
  _previous: DoorState,
  formData: FormData,
): Promise<DoorState> {
  const raw = String(formData.get("code") ?? "").trim();

  if (raw.length > 0) {
    const normalized = normalizeInviteCode(raw);
    if (!normalized) {
      return { error: "An invite code is eight characters, like K7QM-3XPT." };
    }
    if (!(await isInviteCodeUsable(normalized))) {
      return { error: "That code is not valid, or somebody has already used it." };
    }

    (await cookies()).set(INVITE_COOKIE, normalized, {
      httpOnly: true,
      // Lax, not Strict: the cookie has to survive Google redirecting the
      // browser back to us, which Strict would drop.
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: INVITE_COOKIE_MAX_AGE,
    });
  }

  const { url } = await getAuth().api.signInSocial({
    body: { provider: "google", callbackURL: "/" },
  });

  if (!url) return { error: "Could not reach Google just now. Try again." };

  // Outside the try/catch shape of the rest: redirect() signals by throwing.
  redirect(url);
}

/* -------------------------------------------------------------------------- */
/* The account sheet                                                           */
/* -------------------------------------------------------------------------- */

export interface AccountState {
  error: string | null;
  /** Field-scoped, so an error lands on the row that caused it. */
  field: "name" | "username" | "bio" | null;
  saved: boolean;
}

/** The signed-in reader, or null. Never trust an id sent by the caller. */
async function requireReader() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

/**
 * Commit the whole sheet at once.
 *
 * One action for name, handle and bio, because the surface promises one commit
 * — and one UPDATE underneath, so there is no state in which half of it landed.
 */
export async function saveAccountAction(
  _previous: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const reader = await requireReader();
  if (!reader) return { error: "Sign in first.", field: null, saved: false };

  const parsed = accountSchema.safeParse({
    name: formData.get("name") ?? "",
    username: formData.get("username") ?? "",
    bio: formData.get("bio") ?? "",
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = String(issue.path[0] ?? "");
    return {
      error: issue.message,
      field: field === "name" || field === "username" || field === "bio" ? field : null,
      saved: false,
    };
  }

  const result = await updateAccount(reader.id, parsed.data);

  if (!result.ok) {
    switch (result.reason) {
      case "taken":
        return { error: "Someone already has that one.", field: "username", saved: false };
      case "invalid":
        return { error: "That username will not work.", field: "username", saved: false };
      default:
        return { error: "That account no longer exists.", field: null, saved: false };
    }
  }

  // The handle is a public address, and the diary the reader is looking at may
  // be at the old one. Re-render whatever is showing them.
  revalidatePath("/settings");
  revalidatePath("/");
  if (reader.username) revalidatePath(handlePath(reader.username));
  revalidatePath(handlePath(result.username));

  return { error: null, field: null, saved: true };
}

/* -------------------------------------------------------------------------- */
/* Invitations                                                                 */
/* -------------------------------------------------------------------------- */

export interface MintState {
  error: string | null;
}

/**
 * Mint one invite code. Owner only.
 *
 * The check is here rather than only in the page, because a server action is a
 * public endpoint: hiding the button hides nothing.
 */
export async function mintInviteAction(): Promise<MintState> {
  const reader = await requireReader();
  if (!reader) return { error: "Sign in first." };
  if (!isOwner(reader.email)) return { error: "Only the owner can issue invitations." };

  await createInviteCodes(reader.id, 1);
  revalidatePath("/settings");
  return { error: null };
}

/* -------------------------------------------------------------------------- */
/* Deleting the account                                                        */
/* -------------------------------------------------------------------------- */

export interface DeleteState {
  error: string | null;
}

/**
 * Erase this reader and everything they wrote.
 *
 * Guarded by typing the handle back, the convention this project's named craft
 * bar (GitHub, Vercel) uses for exactly this: it is the one confirmation that
 * cannot be dismissed by reflex, because it cannot be satisfied without reading.
 */
export async function deleteAccountAction(
  _previous: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  const reader = await requireReader();
  if (!reader) return { error: "Sign in first." };

  const typed = normalizeUsername(String(formData.get("confirm") ?? ""));
  if (!reader.username || typed !== reader.username) {
    return { error: `Type ${reader.username ?? "your handle"} exactly to confirm.` };
  }

  await deleteAccount(reader.id);

  // The session row is gone with the user, but the browser still holds its
  // cookie. Clearing it here means the next request is anonymous rather than
  // carrying a token that resolves to nothing.
  await getAuth().api.signOut({ headers: await headers() });

  redirect("/");
}

/* -------------------------------------------------------------------------- */
/* The log sheet                                                               */
/* -------------------------------------------------------------------------- */

export interface LogReadState {
  error: string | null;
  /** Field-scoped, so a refusal lands on the row that caused it. */
  field: LogReadField | null;
  /** The session is gone: the sheet offers the way back in, not just a refusal. */
  signedOut: boolean;
  /**
   * How many reads this sheet has saved. The sheet is keyed on it, so each
   * save remounts it closed and clean while a refusal leaves the typing alone.
   */
  saved: number;
}

/**
 * Log one read of a book into the signed-in reader's diary.
 *
 * The reader comes from the session and never from the form — a server action
 * is a public endpoint, and an id in the form would let anyone write into
 * anyone's diary. The book id does come from the form; the foreign key decides
 * whether it is real, and a reader can only ever write into their own diary.
 */
export async function logReadAction(
  previous: LogReadState,
  formData: FormData,
): Promise<LogReadState> {
  const reader = await requireReader();
  if (!reader) {
    // Says that nothing was saved, and why — "sign in first" alone leaves the
    // reader wondering whether the read went through.
    return {
      ...previous,
      error: "Not saved: you’re signed out. Sign in again to log this read.",
      field: null,
      signedOut: true,
    };
  }

  const parsed = readSchema.safeParse({
    bookId: formData.get("bookId") ?? "",
    readAt: formData.get("readAt") ?? "",
    rating: formData.get("rating") ?? "",
    review: formData.get("review") ?? "",
    isReread: formData.get("isReread") === "on",
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = String(issue.path[0] ?? "");
    return {
      ...previous,
      error: issue.message,
      field: isLogReadField(field) ? field : null,
      signedOut: false,
    };
  }

  const result = await createRead(reader.id, parsed.data);
  if (!result.ok) {
    return {
      ...previous,
      error: "Not saved: this book is no longer here. Find it again from search.",
      field: null,
      signedOut: false,
    };
  }

  // The slip this was logged from, the diary, and the public profile all show
  // it. Every book page, because the sheet does not know its own address.
  revalidatePath("/book/[workKey]", "page");
  revalidatePath("/");
  if (reader.username) revalidatePath(handlePath(reader.username));

  return { error: null, field: null, signedOut: false, saved: previous.saved + 1 };
}

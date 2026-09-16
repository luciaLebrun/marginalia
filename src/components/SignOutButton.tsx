"use client";

import { useFormStatus } from "react-dom";

import { signOutAction } from "@/app/actions";

/** Ending the session on this device. A plain form, so it works before hydration too. */
export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="band-label border border-ink px-3 py-2.5 transition-colors hover:bg-band-fiction focus-visible:bg-band-fiction disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

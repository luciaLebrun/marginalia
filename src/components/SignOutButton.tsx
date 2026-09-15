"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { signOut } from "@/lib/auth-client";

/**
 * Ending the session on this device. Not a form action: Better Auth clears the
 * session cookie through its own client, and the router refresh is what makes
 * the server re-render as anonymous.
 */
export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await signOut();
        router.replace("/");
        router.refresh();
      }}
      className="band-label border border-ink px-3 py-2.5 transition-colors hover:bg-band-fiction focus-visible:bg-band-fiction disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

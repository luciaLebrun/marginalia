"use client";

import { useEffect } from "react";

import { markSeenAction } from "@/app/actions";

/**
 * Records that the reader has now seen their diary, after paint.
 *
 * Deliberately not done during render: a server component must not mutate
 * while rendering, and React may render it more than once. Doing it here also
 * means the entries this visit marked new stay inked for this visit and are
 * quiet on the next one.
 */
export function MarkSeen({ userId }: Readonly<{ userId: string }>) {
  useEffect(() => {
    void markSeenAction(userId);
  }, [userId]);

  return null;
}

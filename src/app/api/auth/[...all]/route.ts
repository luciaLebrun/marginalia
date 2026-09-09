import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "@/lib/auth";

// getAuth() is called per request, not at module scope, so that `next build`
// never needs real credentials.
export const GET = async (request: Request) =>
  toNextJsHandler(getAuth()).GET(request);

export const POST = async (request: Request) =>
  toNextJsHandler(getAuth()).POST(request);

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { oAuthProxy } from "better-auth/plugins";
import { cookies } from "next/headers";

import { getDb, schema } from "@/db";
import { INVITE_COOKIE, attributeInviteCode, enforceInvite } from "./invite";
import { trustedOrigins } from "./trusted-origins";

/**
 * Built lazily for the same reason as getDb(): `next build` runs with
 * placeholder credentials, and nothing may touch the database at module scope.
 */
let cached: ReturnType<typeof create> | undefined;

function create() {
  return betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema,
      // The neon-http driver speaks one HTTP request per statement and cannot
      // hold a transaction open. Better Auth sequences the operations instead.
      transaction: false,
    }),

    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,

    // Google only. No password auth: nothing to store, nothing to leak, and no
    // reset flow to build. See docs/adr/0003.
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      },
    },

    user: {
      additionalFields: {
        // Claimed after first sign-in, so null until the user picks one.
        // Unique in the database; a unique index permits many NULLs.
        username: { type: "string", required: false, input: false },
        bio: { type: "string", required: false, input: false },
        // Read on every diary render to decide which entries are new. Must be
        // declared here or the session will not carry it.
        lastSeenAt: { type: "date", required: false, input: false },
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days — this is a low-stakes diary
      updateAge: 60 * 60 * 24, // refresh at most daily
    },

    databaseHooks: {
      user: {
        create: {
          /**
           * The signup gate. Google will happily authenticate anyone on earth,
           * so this is the only thing standing between a stranger and an
           * account. It runs before the user row exists; throwing here aborts
           * the whole sign-up.
           */
          async before(user) {
            // The email comes from Google, not from the form, so the bootstrap
            // check inside enforceInvite is testing a verified address.
            await enforceInvite(
              (await cookies()).get(INVITE_COOKIE)?.value,
              user.email,
            );
            return { data: user };
          },

          /** Record who used the code, now that we have an id for them. */
          async after(user) {
            const code = (await cookies()).get(INVITE_COOKIE)?.value;
            if (code) await attributeInviteCode(code, user.id);
          },
        },
      },
    },

    trustedOrigins: trustedOrigins(),

    plugins: [
      /*
       * Lets a preview deployment sign in through Google without its own
       * redirect URI. Google is sent to BETTER_AUTH_URL — the one origin
       * registered for this environment — and the result is forwarded back to
       * whichever deployment started the flow, which the plugin reads from
       * Vercel's own VERCEL_URL.
       *
       * It carries an encrypted, short-lived (60s) payload between the two
       * origins, signed with BETTER_AUTH_SECRET, and it is skipped entirely
       * when the request already arrives at the production URL. It exists for
       * testing feature branches; it does nothing in production.
       */
      oAuthProxy(),

      // Must stay last: it lets server actions set cookies Better Auth issues.
      nextCookies(),
    ],
  });
}

export function getAuth() {
  cached ??= create();
  return cached;
}

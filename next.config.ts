import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * The dev overlay's floating badge sits bottom-left, exactly where this
   * project's controls do — it occludes "Sign out" at laptop width and an
   * invite row at 360. Since every screenshot this project reviews is taken
   * against `next dev`, leaving it on means reviewing an obstructed page.
   * Errors still surface in the console and in the terminal.
   */
  devIndicators: false,

  /*
   * A self-contained server under .next/standalone, so the Docker image ships
   * only what `next start` needs rather than every node_module (MRG-081).
   */
  output: "standalone",

  /*
   * The client router cache keeps a dynamic page for 30s, so Back to a tab you
   * just left is instant instead of a refetch (the default is 0). Still
   * experimental in Next 16. Safe only because every server action revalidates
   * the routes showing what it wrote — revalidatePath purges this cache — and
   * sign-out clears the session cookie in an action, which purges it too. A new
   * action must do the same (MRG-121).
   */
  experimental: { staleTimes: { dynamic: 30 } },

  /*
   * Vercel's production deployment is retired: production is the VM at
   * marginalia.dpdns.org (MRG-081), so every page there redirects to it. Only
   * production builds get this — Vercel sets VERCEL_ENV at build time, so
   * previews serve the app (MRG-095), and the VM (no VERCEL_ENV) is untouched.
   * /api/auth/* stays live on Vercel production: it is the one Google callback
   * registered for previews, and the OAuth proxy relays sign-ins from there.
   */
  redirects() {
    if (process.env.VERCEL_ENV !== "production") return Promise.resolve([]);
    const destination = "https://marginalia.dpdns.org";
    return Promise.resolve([
      { source: "/", destination: `${destination}/`, permanent: true },
      { source: "/:path((?!api/auth/).*)", destination: `${destination}/:path`, permanent: true },
    ]);
  },
};

export default nextConfig;

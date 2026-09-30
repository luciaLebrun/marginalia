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
};

export default nextConfig;

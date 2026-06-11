import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Dev uses its own build dir (see the dev script) so a production
  // `next build` can run while `next dev` is up without corrupting it.
  distDir: process.env.NEXT_DIST_DIR || ".next"
};

export default nextConfig;

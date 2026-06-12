import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Dev uses its own build dir (see the dev script) so a production
  // `next build` can run while `next dev` is up without corrupting it.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async redirects() {
    // Training Pipeline merged into Course Performance per client review.
    return [{ source: "/pipeline", destination: "/courses", permanent: false }];
  }
};

export default nextConfig;

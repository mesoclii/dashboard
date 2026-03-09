import path from "path";
import type { NextConfig } from "next";

const rootDir = path.resolve(__dirname);

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  outputFileTracingRoot: rootDir,
  experimental: {
    serverMinification: false,
    webpackBuildWorker: false,
    turbopackFileSystemCacheForBuild: true,
  },
  turbopack: {
    root: rootDir,
  },
  async redirects() {
    return [
      {
        source: "/dashboard/engines",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/dashboard/engines/:engineId",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

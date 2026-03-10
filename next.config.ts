import path from "path";
import type { NextConfig } from "next";

const rootDir = path.resolve(__dirname);

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
  staticPageGenerationTimeout: 120,
  outputFileTracingRoot: rootDir,
  experimental: {
    serverMinification: false,
    webpackBuildWorker: false,
    turbopackFileSystemCacheForBuild: true,
    workerThreads: false,
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

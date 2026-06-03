import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/kangeki",
  assetPrefix: "/kangeki",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

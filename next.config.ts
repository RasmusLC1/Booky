import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['files.edgestore.dev'], // Add the EdgeStore domain
  },
};

export default nextConfig;

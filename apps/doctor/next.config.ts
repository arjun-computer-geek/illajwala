import type { NextConfig } from "next";

const sharedTranspile = [
  "@illajwala/ui",
  "@illajwala/types",
  "@illajwala/api-client",
  "@illajwala/utils",
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: sharedTranspile,
  experimental: {
    serverActions: {
      allowedOrigins: ["*.illajwala.com"],
    },
  },
};

export default nextConfig;


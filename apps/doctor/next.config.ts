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
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["*.illajwala.com"],
    },
  },
};

export default nextConfig;


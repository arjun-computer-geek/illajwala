import type { NextConfig } from "next";

const sharedTranspile = [
  "@illajwala/ui",
  "@illajwala/types",
  "@illajwala/api-client",
  "@illajwala/utils",
];

const nextConfig: NextConfig = {
  transpilePackages: sharedTranspile,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "avatar.vercel.sh",
      },
    ],
  },
};

export default nextConfig;

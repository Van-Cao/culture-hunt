import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permit the local Wi-Fi preview used by phones, including its dev WebSocket.
  allowedDevOrigins: ["192.168.1.107"],
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  outputFileTracingIncludes: {
    "/api/palace/recognize": ["./public/images/palace-exterior.webp", "./public/images/palace/*.webp"],
    "/api/vision": ["./public/images/palace-exterior.webp", "./public/images/palace/*.webp"],
  },
  outputFileTracingExcludes: { "/*": ["./.culture-hunt/**/*"] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

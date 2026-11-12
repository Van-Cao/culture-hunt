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

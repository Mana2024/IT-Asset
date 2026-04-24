import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      "better-sqlite3": { browser: "./lib/db/empty.ts" },
    },
  },
};

export default nextConfig;

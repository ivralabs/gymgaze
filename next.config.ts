import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @sparticuz/chromium needs to be externalized so its binary path resolves on Vercel
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  // Ensure the chromium binary files are traced into the serverless bundle
  outputFileTracingIncludes: {
    "/api/rate-card/pdf": [
      "./node_modules/@sparticuz/chromium/**/*",
    ],
  },
};

export default nextConfig;

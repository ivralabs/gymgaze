import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @sparticuz/chromium needs to be externalized so its binary path resolves correctly on Vercel
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
};

export default nextConfig;

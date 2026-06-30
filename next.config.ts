import type { NextConfig } from "next";

// Server-side only — never exposed to the browser.
// Local: http://localhost:3001
// Vercel: your Railway public URL (from Railway → Settings → Networking)
const backendUrl = process.env.API_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;

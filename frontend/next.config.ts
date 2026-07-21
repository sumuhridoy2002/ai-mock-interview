import type { NextConfig } from "next";

/** Laravel origin for dev proxy rewrites (server-side only). */
const backendOrigin =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
  "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendOrigin}/api/v1/:path*`,
      },
      {
        source: "/broadcasting/:path*",
        destination: `${backendOrigin}/broadcasting/:path*`,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

/** Laravel origin for dev proxy — must be 127.0.0.1 (IPv4), not localhost (::1). */
const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

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

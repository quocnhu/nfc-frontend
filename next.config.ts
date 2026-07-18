import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${process.env.BACKEND_URL || "http://localhost:4000"}/api/:path*`,
      },
      {
        source: "/upload/userdata/file",
        destination: `${process.env.BACKEND_URL || "http://localhost:4000"}/api/upload/userdata/file`,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/:path*`,
      },
      {
        source: "/upload/userdata/file",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/upload/userdata/file`,
      },
    ];
  },
};

export default nextConfig;

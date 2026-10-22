import type { NextConfig } from "next";

const mediaHostname = process.env.MEDIA_HOSTNAME?.trim();

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "passionategrace.org",
      },
      ...(mediaHostname
        ? [{ protocol: "https" as const, hostname: mediaHostname, pathname: "/**" }]
        : []),
      {
        protocol: "http",
        hostname: "localhost",
        port: "9002",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8002",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
      },
    ],
  },
  async rewrites() {
    const backendUrl = (process.env.BACKEND_API_URL || "http://localhost:8000").replace(/\/$/, "");
    return [
      {
        source: "/media/:path*",
        destination: `${backendUrl}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;

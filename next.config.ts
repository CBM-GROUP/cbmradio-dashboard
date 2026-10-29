import type { NextConfig } from "next";

const mediaHostname = process.env.MEDIA_HOSTNAME?.trim()
  .replace(/^https?:\/\//i, "")
  .split("/")[0];

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
      {
        protocol: "https",
        hostname: "apicbmradio.cbmgroupco.com",
        pathname: "/**",
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
};

export default nextConfig;

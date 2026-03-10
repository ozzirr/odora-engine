import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rmnbfnaapibtyfxuacde.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "media.parfumo.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

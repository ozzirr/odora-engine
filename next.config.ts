import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.21"],
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
      {
        protocol: "https",
        hostname: "fimgs.net",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);

import type { MetadataRoute } from "next";

import { isLaunchGateEnabled } from "@/lib/launch-gate";
import { toAbsoluteUrl } from "@/lib/metadata";
import { getBaseSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  if (isLaunchGateEnabled()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      sitemap: toAbsoluteUrl("/sitemap.xml"),
      host: getBaseSiteUrl(),
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: toAbsoluteUrl("/sitemap.xml"),
    host: getBaseSiteUrl(),
  };
}

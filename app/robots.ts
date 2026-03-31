import type { MetadataRoute } from "next";

import { isLaunchGateEnabled } from "@/lib/launch-gate";

export default function robots(): MetadataRoute.Robots {
  if (isLaunchGateEnabled()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
  };
}

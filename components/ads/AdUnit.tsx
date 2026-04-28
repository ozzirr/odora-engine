"use client";

import { useEffect, useRef } from "react";

import { ADSENSE_CLIENT_ID, ADSENSE_SCRIPT_LOADED_EVENT } from "@/lib/privacy/consent";
import { useMarketingConsent } from "@/lib/privacy/use-marketing-consent";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

type AdUnitProps = {
  slot: string;
  format?: string;
  layout?: string;
  layoutKey?: string;
  style?: React.CSSProperties;
  className?: string;
  fullWidthResponsive?: boolean;
};

function AdUnit({
  slot,
  format = "fluid",
  layout,
  layoutKey,
  style,
  className,
  fullWidthResponsive,
}: AdUnitProps) {
  const hasMarketingConsent = useMarketingConsent();
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!hasMarketingConsent) {
      return;
    }

    const pushAd = () => {
      if (pushedRef.current) {
        return;
      }

      try {
        (window.adsbygoogle = window.adsbygoogle ?? []).push({});
        pushedRef.current = true;
      } catch {
        // Retry when the AdSense script reports that it finished loading.
      }
    };

    pushAd();
    window.addEventListener(ADSENSE_SCRIPT_LOADED_EVENT, pushAd);

    return () => window.removeEventListener(ADSENSE_SCRIPT_LOADED_EVENT, pushAd);
  }, [hasMarketingConsent]);

  if (!hasMarketingConsent) {
    return null;
  }

  return (
    <ins
      className={`adsbygoogle ${className ?? ""}`.trim()}
      style={{ display: "block", ...style }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      {...(layout ? { "data-ad-layout": layout } : {})}
      {...(layoutKey ? { "data-ad-layout-key": layoutKey } : {})}
      {...(fullWidthResponsive ? { "data-full-width-responsive": "true" } : {})}
    />
  );
}

export function AdInArticle() {
  return (
    <AdUnit
      slot="6750721733"
      layout="in-article"
      format="fluid"
      style={{ textAlign: "center" }}
    />
  );
}

export function AdInFeed() {
  return (
    <AdUnit
      slot="7336833065"
      layoutKey="-g9+h+76-w3+wv"
      format="fluid"
    />
  );
}

"use client";

import Script from "next/script";

import { ADSENSE_CLIENT_ID, ADSENSE_SCRIPT_LOADED_EVENT } from "@/lib/privacy/consent";
import { useMarketingConsent } from "@/lib/privacy/use-marketing-consent";

export function AdsenseScript() {
  const hasMarketingConsent = useMarketingConsent();

  if (!hasMarketingConsent) {
    return null;
  }

  return (
    <Script
      id="google-adsense"
      async
      strategy="lazyOnload"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
      onLoad={() => window.dispatchEvent(new Event(ADSENSE_SCRIPT_LOADED_EVENT))}
    />
  );
}

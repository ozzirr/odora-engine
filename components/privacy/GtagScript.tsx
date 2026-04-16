"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

import {
  GA_MEASUREMENT_ID,
  PRIVACY_CONSENT_UPDATED_EVENT,
  readStoredConsent,
  type ConsentState,
} from "@/lib/privacy/consent";

function getAnalyticsConsent() {
  if (typeof document === "undefined") {
    return false;
  }

  return readStoredConsent(document.cookie).analytics;
}

export function GtagScript() {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    setConsent(getAnalyticsConsent());

    const handleConsentUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<ConsentState>;
      setConsent(customEvent.detail.analytics);
    };

    window.addEventListener(PRIVACY_CONSENT_UPDATED_EVENT, handleConsentUpdated);
    return () => window.removeEventListener(PRIVACY_CONSENT_UPDATED_EVENT, handleConsentUpdated);
  }, []);

  if (!consent) {
    return null;
  }

  return (
    <>
      <Script
        id="google-gtag"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script id="google-gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}

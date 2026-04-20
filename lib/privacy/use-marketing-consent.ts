"use client";

import { useEffect, useState } from "react";

import {
  PRIVACY_CONSENT_UPDATED_EVENT,
  readStoredConsent,
  type ConsentState,
} from "@/lib/privacy/consent";

function getMarketingConsent() {
  if (typeof document === "undefined") {
    return false;
  }

  return readStoredConsent(document.cookie).marketing;
}

export function useMarketingConsent() {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    setConsent(getMarketingConsent());

    const handleConsentUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<ConsentState>;
      setConsent(customEvent.detail.marketing);
    };

    window.addEventListener(PRIVACY_CONSENT_UPDATED_EVENT, handleConsentUpdated);
    return () => window.removeEventListener(PRIVACY_CONSENT_UPDATED_EVENT, handleConsentUpdated);
  }, []);

  return consent;
}

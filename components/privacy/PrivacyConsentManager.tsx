"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/Button";
import {
  CONSENT_COOKIE_NAME,
  PRIVACY_CONSENT_UPDATED_EVENT,
  persistConsentInBrowser,
  readStoredConsent,
  type ConsentState,
  getCookieValue,
} from "@/lib/privacy/consent";

function getBrowserConsentState() {
  if (typeof document === "undefined") {
    return {
      consent: null,
      hasStoredConsent: false,
    };
  }

  return {
    consent: readStoredConsent(document.cookie),
    hasStoredConsent: getCookieValue(document.cookie, CONSENT_COOKIE_NAME) !== null,
  };
}

export function PrivacyConsentManager() {
  const t = useTranslations("privacyPreferences.banner");
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [hasStoredConsent, setHasStoredConsent] = useState(false);

  useEffect(() => {
    const syncConsent = () => {
      const nextState = getBrowserConsentState();
      setConsent(nextState.consent);
      setHasStoredConsent(nextState.hasStoredConsent);
    };

    syncConsent();

    const handleConsentUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<ConsentState>;
      setConsent(customEvent.detail);
      setHasStoredConsent(true);
    };

    window.addEventListener(PRIVACY_CONSENT_UPDATED_EVENT, handleConsentUpdated);
    return () => window.removeEventListener(PRIVACY_CONSENT_UPDATED_EVENT, handleConsentUpdated);
  }, []);

  if (!consent) {
    return null;
  }

  const updateMarketingConsent = (marketing: boolean) => {
    const nextConsent = persistConsentInBrowser({
      analytics: consent.analytics,
      marketing,
    });

    setConsent(nextConsent);
    setHasStoredConsent(true);
  };

  return (
    <>
      {hasStoredConsent ? null : (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:px-6">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-[#dfcfbc] bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(246,238,228,0.98))] p-4 shadow-[0_28px_70px_-40px_rgba(43,32,22,0.45)] backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#8a7763]">
                  {t("eyebrow")}
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[#21180f]">{t("title")}</h2>
                <p className="mt-2 text-sm leading-6 text-[#685747]">{t("description")}</p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => updateMarketingConsent(false)}
                >
                  {t("rejectButton")}
                </Button>
                <Button className="w-full sm:w-auto" onClick={() => updateMarketingConsent(true)}>
                  {t("acceptButton")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

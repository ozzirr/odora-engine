"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/Button";
import { APP_FLOATING_LAYER_CLASS } from "@/lib/chrome";
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

  const dismissBanner = () => {
    updateMarketingConsent(false);
  };

  return (
    <>
      {hasStoredConsent ? null : (
        <div className={`fixed inset-x-0 bottom-0 ${APP_FLOATING_LAYER_CLASS} px-4 pb-4 sm:px-6`}>
          <div className="mx-auto max-w-4xl rounded-[1.75rem] border border-[#dfcfbc] bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(246,238,228,0.98))] p-4 shadow-[0_28px_70px_-40px_rgba(43,32,22,0.45)] backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div className="max-w-2xl">
                <h2 className="text-base font-semibold text-[#21180f]">{t("title")}</h2>
                <p className="mt-1 text-sm leading-6 text-[#685747]">{t("description")}</p>
              </div>

              <button
                type="button"
                aria-label={t("closeAriaLabel")}
                onClick={dismissBanner}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#8a7763] transition-colors hover:bg-white/70 hover:text-[#3a2e24]"
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path
                    d="M6 6L14 14M14 6L6 14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="mt-3 flex justify-start">
                <Button
                  size="sm"
                  className="min-w-[110px]"
                  onClick={() => updateMarketingConsent(true)}
                >
                  {t("acceptButton")}
                </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

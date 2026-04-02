"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/Button";
import { APP_HEADER_OFFSET_CLASS, APP_OVERLAY_LAYER_CLASS } from "@/lib/chrome";
import { Link } from "@/lib/navigation";
import {
  CONSENT_COOKIE_NAME,
  getPrivacyServices,
  getCookieValue,
  persistConsentInBrowser,
  privacyCategories,
  PRIVACY_CONSENT_UPDATED_EVENT,
  readStoredConsent,
  type ConsentCategory,
  type ConsentState,
} from "@/lib/privacy/consent";
import { cn } from "@/lib/utils";

type PrivacyPreferencesProps = {
  className?: string;
};

const statusClasses: Record<ConsentCategory, string> = {
  necessary: "border-[#d5e2d8] bg-[#eef6ef] text-[#214438]",
  analytics: "border-[#d7dfeb] bg-[#eef3f8] text-[#28415c]",
  marketing: "border-[#eadfd5] bg-[#f7f1eb] text-[#7b5f44]",
};

export function PrivacyPreferences({ className }: PrivacyPreferencesProps) {
  const t = useTranslations("privacyPreferences");
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    const syncConsent = () => {
      if (typeof document === "undefined") {
        return;
      }

      const hasStoredConsent = getCookieValue(document.cookie, CONSENT_COOKIE_NAME) !== null;
      setConsent(hasStoredConsent ? readStoredConsent(document.cookie) : readStoredConsent(null));
    };

    syncConsent();

    const handleConsentUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<ConsentState>;
      setConsent(customEvent.detail);
    };

    window.addEventListener(PRIVACY_CONSENT_UPDATED_EVENT, handleConsentUpdated);
    return () => window.removeEventListener(PRIVACY_CONSENT_UPDATED_EVENT, handleConsentUpdated);
  }, []);

  const updateMarketingConsent = (marketing: boolean) => {
    if (!consent) {
      return;
    }

    const nextConsent = persistConsentInBrowser({
      analytics: consent.analytics,
      marketing,
    });

    setConsent(nextConsent);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "rounded-full border border-[#dfcfbc] bg-white/72 px-4 py-3 text-sm text-[#3f3126] transition-all hover:border-[#ceb89d] hover:bg-white hover:text-[#1f1914]",
          className,
        )}
      >
        {t("openButton")}
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className={cn(
                `fixed inset-x-0 bottom-0 ${APP_HEADER_OFFSET_CLASS} overflow-hidden bg-[rgba(24,20,16,0.24)] px-4 py-5 backdrop-blur-[18px] sm:px-6 sm:py-10`,
                APP_OVERLAY_LAYER_CLASS,
              )}
              onClick={() => setOpen(false)}
            >
              <div className="flex min-h-full items-start justify-center sm:items-center">
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={titleId}
                  aria-describedby={descriptionId}
                  onClick={(event) => event.stopPropagation()}
                  className="flex max-h-[calc(100dvh-2.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-[#ded0bf] bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(246,238,228,0.98))] shadow-[0_36px_110px_-48px_rgba(34,25,18,0.5)]"
                >
                  <div className="shrink-0 border-b border-[#eadfce] px-5 py-5 sm:px-6 sm:py-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="max-w-2xl">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#8a7763]">
                          {t("eyebrow")}
                        </p>
                        <h2 id={titleId} className="mt-2 font-display text-3xl text-[#21180f]">
                          {t("title")}
                        </h2>
                        <p id={descriptionId} className="mt-3 text-sm leading-7 text-[#685747]">
                          {t("description")}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        aria-label={t("closeAriaLabel")}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#decfbd] bg-white/80 text-[#3a2e24] transition-colors hover:bg-white"
                      >
                        <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
                          <path
                            d="M5 5L15 15M15 5L5 15"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 [-webkit-overflow-scrolling:touch] sm:px-6 sm:py-6">
                    <div className="space-y-4">
                      <div className="grid gap-3">
                        {privacyCategories.map((category) => {
                          const services = getPrivacyServices(category.key);
                          const statusLabel =
                            category.key === "marketing"
                              ? t(
                                  consent?.marketing
                                    ? "categories.marketing.enabledStatusLabel"
                                    : "categories.marketing.disabledStatusLabel",
                                )
                              : t(`categories.${category.key}.statusLabel`);

                          return (
                            <section
                              key={category.key}
                              className="rounded-[1.5rem] border border-[#e7dac9] bg-white/78 p-4 shadow-[0_20px_48px_-40px_rgba(47,35,24,0.42)]"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="max-w-2xl">
                                  <h3 className="text-base font-semibold text-[#261d16]">
                                    {t(`categories.${category.key}.title`)}
                                  </h3>
                                  <p className="mt-2 text-sm leading-7 text-[#685747]">
                                    {t(`categories.${category.key}.description`)}
                                  </p>
                                </div>
                                <span
                                  className={cn(
                                    "rounded-full border px-3 py-1 text-xs font-semibold",
                                    statusClasses[category.key],
                                  )}
                                >
                                  {statusLabel}
                                </span>
                              </div>

                              <div className="mt-4 space-y-2">
                                {services.length ? (
                                  services.map((service) => (
                                    <div
                                      key={service.id}
                                      className="rounded-[1.1rem] border border-[#efe5d8] bg-[#fcfaf6] px-4 py-3"
                                    >
                                      <p className="text-sm font-medium text-[#2b2119]">
                                        {t(`services.${service.id}.label`)}
                                        <span className="ml-1 text-[#7e6854]">· {service.provider}</span>
                                      </p>
                                      <p className="mt-1 text-sm leading-6 text-[#6c5948]">
                                        {t(`services.${service.id}.purpose`)}
                                      </p>
                                      <p className="mt-2 text-xs leading-5 text-[#7c6653]">
                                        {t(`services.${service.id}.storage`)}
                                      </p>
                                      {service.cookieNames.length ? (
                                        <p className="mt-1 text-xs leading-5 text-[#7c6653]">
                                          {t("technicalIdentifiersPrefix")}{" "}
                                          {service.cookieNames.join(", ")}
                                        </p>
                                      ) : null}
                                    </div>
                                  ))
                                ) : (
                                  <div className="rounded-[1.1rem] border border-dashed border-[#eadfcf] bg-[#fcfaf6] px-4 py-3 text-sm leading-6 text-[#6c5948]">
                                    {t("emptyCategory")}
                                  </div>
                                )}
                              </div>
                            </section>
                          );
                        })}
                      </div>

                      <div className="rounded-[1.5rem] border border-[#e7dac9] bg-white/78 p-4 shadow-[0_20px_48px_-40px_rgba(47,35,24,0.42)]">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#8a7763]">
                          {t("controls.title")}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-[#685747]">
                          {t("controls.description")}
                        </p>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <Button
                            variant={consent?.marketing ? "primary" : "secondary"}
                            className="w-full sm:w-auto"
                            onClick={() => updateMarketingConsent(true)}
                          >
                            {t("controls.allowMarketing")}
                          </Button>
                          <Button
                            variant={consent?.marketing ? "secondary" : "primary"}
                            className="w-full sm:w-auto"
                            onClick={() => updateMarketingConsent(false)}
                          >
                            {t("controls.disableMarketing")}
                          </Button>
                        </div>
                        <p className="mt-3 text-xs leading-5 text-[#7c6653]">
                          {t(
                            consent?.marketing
                              ? "controls.currentEnabled"
                              : "controls.currentDisabled",
                          )}
                        </p>
                      </div>

                      <div className="rounded-[1.5rem] border border-[#e7dac9] bg-[linear-gradient(180deg,rgba(253,249,243,0.94),rgba(247,240,231,0.98))] p-4">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#8a7763]">
                          {t("summaryTitle")}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-[#685747]">
                          {t("summaryDescription")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 border-t border-[#eadfce] bg-[linear-gradient(180deg,rgba(255,252,247,0.96),rgba(246,238,228,0.98))] px-5 py-4 sm:px-6 sm:py-5">
                    <div className="grid gap-3">
                      <Link
                        href="/privacy"
                        onClick={() => setOpen(false)}
                        className="rounded-full border border-[#dfcfbc] bg-white/72 px-4 py-3 text-sm text-[#3f3126] transition-all hover:border-[#ceb89d] hover:bg-white hover:text-[#1f1914]"
                      >
                        {t("links.privacyPolicy")}
                      </Link>
                      <Link
                        href="/cookie-policy"
                        onClick={() => setOpen(false)}
                        className="rounded-full border border-[#dfcfbc] bg-white/72 px-4 py-3 text-sm text-[#3f3126] transition-all hover:border-[#ceb89d] hover:bg-white hover:text-[#1f1914]"
                      >
                        {t("links.cookiePolicy")}
                      </Link>
                      <Button
                        variant="secondary"
                        className="w-full sm:ml-auto sm:w-auto"
                        onClick={() => setOpen(false)}
                      >
                        {t("closeButton")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

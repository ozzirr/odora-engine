"use client";

import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Link } from "@/lib/navigation";
import {
  getPrivacyServices,
  privacyCategories,
  type ConsentCategory,
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
  const [open, setOpen] = useState(false);
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
        Preferenze privacy
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-[rgba(24,20,16,0.24)] px-4 py-5 backdrop-blur-[18px] sm:px-6 sm:py-10"
          onClick={() => setOpen(false)}
        >
          <div className="flex min-h-full items-end justify-center sm:items-center">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-[#ded0bf] bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(246,238,228,0.98))] shadow-[0_36px_110px_-48px_rgba(34,25,18,0.5)]"
            >
              <div className="border-b border-[#eadfce] px-5 py-5 sm:px-6 sm:py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="max-w-2xl">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#8a7763]">
                      Privacy
                    </p>
                    <h2 id={titleId} className="mt-2 font-display text-3xl text-[#21180f]">
                      Preferenze privacy
                    </h2>
                    <p id={descriptionId} className="mt-3 text-sm leading-7 text-[#685747]">
                      Usiamo solo ciò che serve davvero per far funzionare Odora e leggere metriche
                      aggregate. Nessun cookie di marketing o profilazione è attivo al momento.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Chiudi preferenze privacy"
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

              <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
                <div className="grid gap-3">
                  {privacyCategories.map((category) => {
                    const services = getPrivacyServices(category.key);

                    return (
                      <section
                        key={category.key}
                        className="rounded-[1.5rem] border border-[#e7dac9] bg-white/78 p-4 shadow-[0_20px_48px_-40px_rgba(47,35,24,0.42)]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="max-w-2xl">
                            <h3 className="text-base font-semibold text-[#261d16]">{category.title}</h3>
                            <p className="mt-2 text-sm leading-7 text-[#685747]">
                              {category.description}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-semibold",
                              statusClasses[category.key],
                            )}
                          >
                            {category.statusLabel}
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
                                  {service.label}
                                  <span className="ml-1 text-[#7e6854]">· {service.provider}</span>
                                </p>
                                <p className="mt-1 text-sm leading-6 text-[#6c5948]">
                                  {service.purpose}
                                </p>
                                <p className="mt-2 text-xs leading-5 text-[#7c6653]">
                                  {service.storage}
                                </p>
                                {service.cookieNames.length ? (
                                  <p className="mt-1 text-xs leading-5 text-[#7c6653]">
                                    Cookie / identificativi tecnici: {service.cookieNames.join(", ")}
                                  </p>
                                ) : null}
                              </div>
                            ))
                          ) : (
                            <div className="rounded-[1.1rem] border border-dashed border-[#eadfcf] bg-[#fcfaf6] px-4 py-3 text-sm leading-6 text-[#6c5948]">
                              Nessuno strumento attivo in questa categoria.
                            </div>
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>

                <div className="rounded-[1.5rem] border border-[#e7dac9] bg-[linear-gradient(180deg,rgba(253,249,243,0.94),rgba(247,240,231,0.98))] p-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#8a7763]">
                    In breve
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#685747]">
                    Se in futuro attiveremo strumenti opzionali di analytics avanzati, marketing o
                    remarketing, aggiorneremo questa interfaccia e chiederemo un consenso esplicito
                    prima del caricamento.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <Link
                    href="/privacy"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-[#dfcfbc] bg-white/72 px-4 py-3 text-sm text-[#3f3126] transition-all hover:border-[#ceb89d] hover:bg-white hover:text-[#1f1914]"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/cookie-policy"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-[#dfcfbc] bg-white/72 px-4 py-3 text-sm text-[#3f3126] transition-all hover:border-[#ceb89d] hover:bg-white hover:text-[#1f1914]"
                  >
                    Cookie Policy
                  </Link>
                  <Button
                    variant="secondary"
                    className="sm:ml-auto"
                    onClick={() => setOpen(false)}
                  >
                    Chiudi
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

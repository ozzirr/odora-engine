"use client";

import { useTranslations } from "next-intl";

import { Container } from "@/components/layout/Container";
import { PrivacyPreferences } from "@/components/privacy/PrivacyPreferences";
import { Link } from "@/lib/navigation";

export function Footer() {
  const t = useTranslations("layout.footer");
  const currentYear = new Date().getFullYear();
  const navLinks = [
    { href: "/" as const, label: t("nav.home") },
    { href: "/finder" as const, label: t("nav.finder") },
    { href: "/brands" as const, label: t("nav.brands") },
    { href: "/blog" as const, label: t("nav.blog") },
  ];
  const legalLinks = [
    { href: "/privacy" as const, label: t("legalLinks.privacy") },
    { href: "/cookie-policy" as const, label: t("legalLinks.cookiePolicy") },
    { href: "/terms" as const, label: t("legalLinks.terms") },
    { href: "/affiliate-disclosure" as const, label: t("legalLinks.affiliateDisclosure") },
    { href: "/contact" as const, label: t("legalLinks.contact") },
  ];

  return (
    <footer className="mt-20 border-t border-[#ede4d8] bg-[linear-gradient(180deg,#f6f0e5_0%,#fbf8f2_100%)]">
      <Container className="py-10 sm:py-12">
        <div className="rounded-[var(--radius-card-lg)] border border-[#ede4d8] bg-[linear-gradient(180deg,rgba(255,252,247,0.92),rgba(246,238,228,0.95))] p-5 shadow-[var(--shadow-card)] sm:p-7">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)]">
            <div className="rounded-[var(--radius-card)] border border-[#ede4d8] bg-white/72 p-5 sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#907b66]">
                {t("navigation")}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-center justify-between rounded-full border border-[#ede4d8] bg-[#fcfaf6] px-4 py-3 text-[13.5px] font-medium text-[#3f3126] transition-all hover:border-[#d4c4ae] hover:bg-white hover:text-[#1e1813]"
                  >
                    <span>{link.label}</span>
                    <span
                      className="transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 text-[#a69580]">
                        <path
                          d="M4 12L12 4M6 4H12V10"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[var(--radius-card)] border border-[#ede4d8] bg-[linear-gradient(180deg,rgba(248,242,234,0.92),rgba(242,233,221,0.88))] p-5 sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#907b66]">
                {t("legal")}
              </p>
              <div className="mt-4 flex flex-col gap-2.5">
                {legalLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-[#ede4d8] bg-white/72 px-4 py-3 text-[13.5px] text-[#3f3126] transition-all hover:border-[#d4c4ae] hover:bg-white hover:text-[#1e1813]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-5 border-t border-[#ede4d8] pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#907b66]">
                  {t("privacyControlsTitle")}
                </p>
                <div className="mt-2.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[13.5px] leading-6 text-[#6b5a49]">
                    {t("privacyControlsDescription")}
                  </p>
                  <PrivacyPreferences className="w-full shrink-0 text-left sm:w-auto" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-[#ede4d8] pt-5 text-[12px] text-[#907b66]">
            <p>{t("copyright", { year: currentYear })}</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}

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
    { href: "/perfumes" as const, label: t("nav.perfumes") },
    { href: "/finder" as const, label: t("nav.finder") },
    { href: "/top" as const, label: t("nav.top") },
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
    <footer className="mt-20 border-t border-[#e8dfd2] bg-[linear-gradient(180deg,#f6f0e5_0%,#fbf8f2_100%)]">
      <Container className="py-8 sm:py-10">
        <div className="rounded-[2rem] border border-[#e2d6c6] bg-[linear-gradient(180deg,rgba(255,252,247,0.9),rgba(246,238,228,0.96))] p-5 shadow-[0_28px_70px_-48px_rgba(43,32,22,0.34)] sm:p-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)]">
            <div className="rounded-[1.6rem] border border-[#eadfce] bg-white/72 p-4 sm:p-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#8a7763]">
                {t("navigation")}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-center justify-between rounded-full border border-[#e0d2bf] bg-[#fcfaf6] px-4 py-3 text-sm font-medium text-[#3f3126] transition-all hover:border-[#ceb89d] hover:bg-white hover:text-[#1f1914]"
                  >
                    <span>{link.label}</span>
                    <span
                      className="transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 text-[#9b8269]">
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

            <div className="rounded-[1.6rem] border border-[#eadfce] bg-[linear-gradient(180deg,rgba(248,242,234,0.92),rgba(242,233,221,0.88))] p-4 sm:p-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#8a7763]">
                {t("legal")}
              </p>
              <div className="mt-4 flex flex-col gap-2.5">
                {legalLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-[#dfcfbc] bg-white/72 px-4 py-3 text-sm text-[#3f3126] transition-all hover:border-[#ceb89d] hover:bg-white hover:text-[#1f1914]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-5 border-t border-[#e3d6c6] pt-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#8a7763]">
                  {t("privacyControlsTitle")}
                </p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-6 text-[#685747]">
                    {t("privacyControlsDescription")}
                  </p>
                  <PrivacyPreferences className="w-full shrink-0 text-left sm:w-auto" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-[#eadfce] pt-4 text-xs text-[#7c6653] sm:mt-5 sm:pt-5">
            <p>{t("copyright", { year: currentYear })}</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}

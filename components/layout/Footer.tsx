"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { Container } from "@/components/layout/Container";
import { Link } from "@/lib/navigation";

export function Footer() {
  const t = useTranslations("layout.footer");
  const navLinks = [
    { href: "/" as const, label: t("nav.home") },
    { href: "/perfumes" as const, label: t("nav.perfumes") },
    { href: "/finder" as const, label: t("nav.finder") },
    { href: "/top" as const, label: t("nav.top") },
  ];
  const legalLinks = [
    { href: "/privacy" as const, label: t("legalLinks.privacy") },
    { href: "/terms" as const, label: t("legalLinks.terms") },
    { href: "/affiliate-disclosure" as const, label: t("legalLinks.affiliateDisclosure") },
  ];

  return (
    <footer className="mt-20 border-t border-[#e8dfd2] bg-[#f5efe4]">
      <Container className="py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <div className="relative h-20 w-[320px] max-w-full sm:h-24 sm:w-[360px]">
              <Image
                src="/images/odora-logo.png"
                alt="Odora"
                fill
                sizes="(max-width: 640px) 320px, 360px"
                className="object-contain object-left"
              />
            </div>
            <p className="max-w-sm text-sm text-[#5e4f40]">
              {t("description")}
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
              {t("navigation")}
            </p>
            <ul className="space-y-2 text-sm text-[#4f3f31]">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-[#1f1914]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
              {t("legal")}
            </p>
            <ul className="space-y-2 text-sm text-[#4f3f31]">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-[#1f1914]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </footer>
  );
}

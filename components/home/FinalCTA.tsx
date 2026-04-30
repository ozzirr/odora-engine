import { useTranslations } from "next-intl";

import { buttonStyles } from "@/components/ui/Button";
import { Link } from "@/lib/navigation";

export function FinalCTA() {
  const t = useTranslations("home.finalCta");

  return (
    <section className="section-gap">
      <div className="paper-texture relative overflow-hidden rounded-[var(--radius-card-lg)] border border-[#e4d8c8]/80 bg-[#f8f3ea] px-6 py-14 text-center shadow-[0_16px_48px_-24px_rgba(50,35,20,0.3)] sm:px-12 sm:py-18 lg:py-20">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.7),transparent_42%),radial-gradient(circle_at_75%_75%,rgba(225,209,189,0.4),transparent_38%)]" />
        <div className="pointer-events-none absolute inset-5 rounded-[1.6rem] border border-white/30" />
        <div className="pointer-events-none absolute -left-16 -top-12 h-48 w-48 rounded-full bg-white/25 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-[#eadbc6]/35 blur-[80px]" />

        <div className="relative mx-auto max-w-lg">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[#907b66]">
            {t("eyebrow")}
          </p>
          <h2 className="mx-auto mt-5 font-display text-[2.2rem] leading-[1.05] tracking-[-0.01em] text-[#1c1712] sm:text-[2.8rem]">
            {t("title")}
          </h2>
          <p className="mx-auto mt-5 max-w-sm text-[15px] leading-[1.75] text-[#6b5a49]">
            {t("subtitle")}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/finder"
              className={buttonStyles({
                size: "lg",
                className: "min-w-[12rem] shadow-[0_6px_20px_-8px_rgba(30,75,59,0.45)]",
              })}
            >
              {t("primaryCta")}
            </Link>
            <Link
              href="/blog"
              className={buttonStyles({
                variant: "secondary",
                size: "lg",
                className: "min-w-[11rem]",
              })}
            >
              {t("secondaryCta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

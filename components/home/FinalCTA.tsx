import { useTranslations } from "next-intl";

import { buttonStyles } from "@/components/ui/Button";
import { Link } from "@/lib/navigation";

export function FinalCTA() {
  const t = useTranslations("home.finalCta");

  return (
    <section className="mt-24">
      <div className="paper-texture relative overflow-hidden rounded-[2.2rem] border border-[#e4d8c8] bg-[#f8f3ea] px-6 py-12 text-center shadow-[0_30px_80px_-50px_rgba(50,35,20,0.48)] sm:px-10 sm:py-16 lg:py-20">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.7),transparent_40%),radial-gradient(circle_at_75%_75%,rgba(225,209,189,0.5),transparent_35%)]" />
        <div className="pointer-events-none absolute inset-4 rounded-[1.8rem] border border-white/40" />
        <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -right-8 h-56 w-56 rounded-full bg-[#eadbc6]/50 blur-3xl" />

        <div className="relative mx-auto max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7763]">
            {t("eyebrow")}
          </p>
          <h2 className="mx-auto mt-4 font-display text-[2.4rem] leading-[1.02] text-[#1c1712] sm:text-[3.2rem]">
            {t("title")}
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-[15px] leading-7 text-[#5f5041]">
            {t("subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/finder"
              className={buttonStyles({
                size: "lg",
                className: "min-w-[11rem] shadow-[0_8px_24px_-12px_rgba(30,75,59,0.5)]",
              })}
            >
              {t("primaryCta")}
            </Link>
            <Link
              href="/perfumes"
              className={buttonStyles({
                variant: "secondary",
                size: "lg",
                className: "min-w-[10rem]",
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

import { useTranslations } from "next-intl";

import { BuyIcon, CompareIcon, DiscoverIcon } from "@/components/home/HomeIllustrations";
import { SectionTitle } from "@/components/ui/SectionTitle";

const STEPS = [
  { key: "discover", Icon: DiscoverIcon, num: "01" },
  { key: "compare", Icon: CompareIcon, num: "02" },
  { key: "choose", Icon: BuyIcon, num: "03" },
] as const;

export function HowItWorks() {
  const t = useTranslations("home.howItWorks");

  return (
    <section className="mt-24 space-y-8">
      <SectionTitle
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {STEPS.map(({ key, Icon, num }) => (
          <article
            key={key}
            className="premium-card group relative overflow-hidden rounded-[1.75rem] border border-[#e4d8c8] bg-white/80 p-7 shadow-[0_24px_48px_-36px_rgba(50,35,20,0.36)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_56px_-34px_rgba(50,35,20,0.44)]"
          >
            {/* Watermark step number */}
            <span
              className="pointer-events-none absolute right-5 top-3 select-none font-display text-[5.5rem] leading-none text-[#f0e8dd]"
              aria-hidden="true"
            >
              {num}
            </span>

            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-[0.85rem] border border-[#e5d9c9] bg-[#f5ede2] text-[#5a4938] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a8470]">
                {num}
              </p>
              <h3 className="mt-1.5 font-display text-[1.75rem] text-[#1f1914]">
                {t(`steps.${key}.title`)}
              </h3>
              <p className="mt-2.5 max-w-xs text-sm leading-[1.7] text-[#5e4f40]">
                {t(`steps.${key}.description`)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

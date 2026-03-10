import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";

import { MoodIllustration } from "@/components/home/HomeIllustrations";
import { Badge } from "@/components/ui/Badge";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { homepageMoodCards } from "@/lib/homepage";
import { Link } from "@/lib/navigation";

type LinkHref = ComponentProps<typeof Link>["href"];

export function QuickFilters() {
  const t = useTranslations("home.quickFilters");

  return (
    <section className="mt-24 space-y-8">
      <SectionTitle
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {homepageMoodCards.map((filter) => (
          <Link
            key={filter.id}
            href={filter.href as unknown as LinkHref}
            className={`premium-card group relative overflow-hidden rounded-[1.75rem] border border-[#e2d6c6] bg-gradient-to-br ${filter.gradientClass} p-6 shadow-[0_22px_45px_-34px_rgba(50,35,20,0.42)] transition-all duration-300 hover:-translate-y-1`}
          >
            <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-white/30 blur-3xl transition-transform duration-500 group-hover:scale-110" />
            <div className="relative flex h-full flex-col justify-between gap-6">
              <div className="flex items-start justify-between gap-4">
                <Badge variant="outline" className="border-white/60 bg-white/35 text-[#4b3d30]">
                  {t(`tones.${filter.toneKey}`)}
                </Badge>
                <MoodIllustration illustration={filter.illustration} />
              </div>

              <div>
                <p className="text-xl font-semibold text-[#1f1914]">{t(`cards.${filter.id}.label`)}</p>
                <p className="mt-2 max-w-[22rem] text-sm leading-6 text-[#5b4c3f]">
                  {t(`cards.${filter.id}.subtitle`)}
                </p>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7d6853]">
                  {t("openInFinder")}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

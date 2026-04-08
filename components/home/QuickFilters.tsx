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
    <section className="section-gap space-y-10">
      <SectionTitle
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {homepageMoodCards.map((filter) => (
          <Link
            key={filter.id}
            href={filter.href as unknown as LinkHref}
            className={`premium-card group relative overflow-hidden rounded-[var(--radius-card)] border border-[#e2d6c6]/60 bg-gradient-to-br ${filter.gradientClass} p-5 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] sm:p-[1.375rem]`}
          >
            {/* Subtle glow */}
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/20 blur-[56px] transition-transform duration-500 group-hover:scale-125" />

            <div className="relative grid min-h-[10.25rem] grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-3">
              <div className="min-w-0">
                <Badge
                  variant="outline"
                  className="border-white/45 bg-white/25 text-[#4a3c2f] backdrop-blur-[2px]"
                >
                  {t(`tones.${filter.toneKey}`)}
                </Badge>
              </div>
              <div className="justify-self-end">
                <MoodIllustration illustration={filter.illustration} />
              </div>

              <div className="col-span-2 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4">
                <div className="min-w-0">
                  <p className="max-w-[11ch] text-balance font-display text-[2rem] leading-[0.96] text-[#1e1813] sm:max-w-[9ch] sm:text-[1.7rem] lg:text-[1.82rem]">
                    {t(`cards.${filter.id}.label`)}
                  </p>
                  <p className="mt-2 max-w-[22rem] text-[13px] leading-[1.6] text-[#5b4c3f]">
                    {t(`cards.${filter.id}.subtitle`)}
                  </p>
                </div>
              </div>

              <div className="col-span-2 mt-1">
                <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#7d6853] transition-colors group-hover:text-[#3d2e22]">
                  {t("openInFinder")}
                  <span className="translate-x-0 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">
                    →
                  </span>
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

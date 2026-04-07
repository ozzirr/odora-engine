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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {homepageMoodCards.map((filter) => (
          <Link
            key={filter.id}
            href={filter.href as unknown as LinkHref}
            className={`premium-card group relative overflow-hidden rounded-[1.75rem] border border-[#e2d6c6]/80 bg-gradient-to-br ${filter.gradientClass} p-6 shadow-[0_18px_40px_-30px_rgba(50,35,20,0.36)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(50,35,20,0.44)]`}
          >
            {/* Glow */}
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/25 blur-3xl transition-transform duration-500 group-hover:scale-125" />

            <div className="relative flex h-full min-h-[13rem] flex-col justify-between gap-4">
              {/* Top row: tone badge + illustration */}
              <div className="flex items-start justify-between gap-3">
                <Badge
                  variant="outline"
                  className="border-white/55 bg-white/30 text-[#4a3c2f] backdrop-blur-[2px]"
                >
                  {t(`tones.${filter.toneKey}`)}
                </Badge>
                <MoodIllustration illustration={filter.illustration} />
              </div>

              {/* Bottom: label, subtitle, CTA */}
              <div>
                <p className="font-display text-[1.35rem] leading-tight text-[#1f1914]">
                  {t(`cards.${filter.id}.label`)}
                </p>
                <p className="mt-1.5 max-w-[22rem] text-[13px] leading-[1.65] text-[#5b4c3f]">
                  {t(`cards.${filter.id}.subtitle`)}
                </p>
                <p className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7d6853] transition-colors group-hover:text-[#3d2e22]">
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

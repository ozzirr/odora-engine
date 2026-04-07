import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";

import { PerfumeDetailLink } from "@/components/perfumes/PerfumeDetailLink";
import { PerfumeImage } from "@/components/perfumes/PerfumeImage";
import { Badge } from "@/components/ui/Badge";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { HomePerfumeSpotlight } from "@/lib/homepage";
import { getLocalizedTaxonomyLabel } from "@/lib/taxonomy-display";
import { cn } from "@/lib/utils";

type TrendingNowProps = {
  perfumes: HomePerfumeSpotlight[];
};

type LinkHref = ComponentProps<typeof PerfumeDetailLink>["href"];

const TOP3_ACCENT: Record<1 | 2 | 3, { bar: string; rank: string; card: string }> = {
  1: {
    bar: "bg-gradient-to-b from-[#c9a752] to-[#e8c97a]",
    rank: "text-[#b8860b]",
    card: "border-[#dcc87a]/60 shadow-[0_24px_52px_-36px_rgba(184,134,11,0.22)]",
  },
  2: {
    bar: "bg-gradient-to-b from-[#a8a8a8] to-[#c8c8c8]",
    rank: "text-[#8a8a8a]",
    card: "border-[#c0c0c0]/60 shadow-[0_24px_52px_-36px_rgba(140,140,140,0.18)]",
  },
  3: {
    bar: "bg-gradient-to-b from-[#b07840] to-[#cfa06a]",
    rank: "text-[#9a6630]",
    card: "border-[#c8935a]/60 shadow-[0_24px_52px_-36px_rgba(154,102,48,0.18)]",
  },
};

export function TrendingNow({ perfumes }: TrendingNowProps) {
  const t = useTranslations("home.trending");
  const commonT = useTranslations("common");
  const taxonomyT = useTranslations("taxonomy");

  if (perfumes.length === 0) {
    return null;
  }

  return (
    <section className="mt-24 space-y-8">
      <SectionTitle
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="flex flex-col gap-3">
        {perfumes.map((perfume, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;
          const top3Style = isTop3 ? TOP3_ACCENT[rank as 1 | 2 | 3] : null;
          const fragranceFamilyLabel = getLocalizedTaxonomyLabel(
            perfume.fragranceFamily,
            "families",
            taxonomyT,
          );
          const footerAction = perfume.hasOffer ? t("viewOffers") : t("seeProductDetails");

          return (
            <PerfumeDetailLink
              key={`${perfume.brandName}-${perfume.name}`}
              href={perfume.href as unknown as LinkHref}
              perfumeName={perfume.name}
              className={cn(
                "group relative overflow-hidden rounded-[1.75rem] border bg-white transition-all duration-200 hover:-translate-y-0.5",
                isTop3
                  ? top3Style!.card
                  : "border-[#e5ddd2] shadow-[0_16px_40px_-32px_rgba(50,35,20,0.32)] hover:shadow-[0_20px_48px_-30px_rgba(50,35,20,0.4)]",
              )}
            >
              <div className="grid min-h-[11rem] grid-cols-[3.5rem_8rem_minmax(0,1fr)] sm:grid-cols-[4rem_10rem_minmax(0,1fr)]">
                {/* Rank column */}
                <div className="flex flex-col items-center justify-center gap-1 px-1">
                  {isTop3 && (
                    <span className={cn("h-8 w-[2px] rounded-full", top3Style!.bar)} aria-hidden="true" />
                  )}
                  <span
                    className={cn(
                      "font-display tabular-nums",
                      isTop3
                        ? cn("text-[1.75rem] sm:text-[2rem]", top3Style!.rank)
                        : "text-[1.4rem] text-[#c2b5a3] sm:text-[1.6rem]",
                    )}
                  >
                    {rank}
                  </span>
                </div>

                {/* Image column */}
                <div className="relative h-full min-h-[11rem] overflow-hidden bg-[radial-gradient(circle_at_20%_16%,rgba(255,255,255,0.9),transparent_24%),linear-gradient(180deg,#f1e8dc_0%,#e7dbca_100%)]">
                  <PerfumeImage
                    imageUrl={perfume.imageUrl}
                    perfumeName={perfume.name}
                    brandName={perfume.brandName}
                    fragranceFamily={fragranceFamilyLabel}
                    sizes="(max-width: 640px) 8rem, 10rem"
                    imageClassName="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>

                {/* Content column */}
                <div className="flex min-w-0 flex-col justify-between p-4 sm:p-5">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a7763]">
                      {perfume.brandName}
                    </p>
                    <h3 className={cn(
                      "font-display leading-tight text-[#1f1914]",
                      isTop3 ? "text-[1.55rem] sm:text-[1.85rem]" : "text-[1.4rem] sm:text-[1.65rem]",
                    )}>
                      {perfume.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <Badge variant="outline">{fragranceFamilyLabel}</Badge>
                      {perfume.isArabic && (
                        <Badge variant="soft">{commonT("badges.arabic")}</Badge>
                      )}
                      {perfume.isNiche && (
                        <Badge variant="soft">{commonT("badges.niche")}</Badge>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-[#8a7763] transition-colors group-hover:text-[#5a4232]">
                    {footerAction}
                    <span className="translate-x-0 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">→</span>
                  </p>
                </div>
              </div>
            </PerfumeDetailLink>
          );
        })}
      </div>
    </section>
  );
}

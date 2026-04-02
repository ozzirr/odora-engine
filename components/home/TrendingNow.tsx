import type { ComponentProps } from "react";
import { useLocale, useTranslations } from "next-intl";

import { PerfumeDetailLink } from "@/components/perfumes/PerfumeDetailLink";
import { PerfumeImage } from "@/components/perfumes/PerfumeImage";
import { Badge } from "@/components/ui/Badge";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { HomePerfumeSpotlight } from "@/lib/homepage";
import { getLocalizedTaxonomyLabel } from "@/lib/taxonomy-display";
import { formatCurrency } from "@/lib/utils";

type TrendingNowProps = {
  perfumes: HomePerfumeSpotlight[];
};

type LinkHref = ComponentProps<typeof PerfumeDetailLink>["href"];

export function TrendingNow({ perfumes }: TrendingNowProps) {
  const t = useTranslations("home.trending");
  const taxonomyT = useTranslations("taxonomy");
  const locale = useLocale();

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

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {perfumes.map((perfume) => {
          const fragranceFamilyLabel = getLocalizedTaxonomyLabel(
            perfume.fragranceFamily,
            "families",
            taxonomyT,
          );
          const bestPrice = perfume.bestPrice;
          const currency = perfume.currency;
          const footerAction = perfume.hasOffer ? t("viewOffers") : t("seeProductDetails");

          return (
            <PerfumeDetailLink
              key={`${perfume.brandName}-${perfume.name}`}
              href={perfume.href as unknown as LinkHref}
              perfumeName={perfume.name}
              className="premium-card group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[#e2d6c6] bg-white shadow-[0_24px_48px_-36px_rgba(50,35,20,0.44)] transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative h-64 overflow-hidden bg-[radial-gradient(circle_at_20%_16%,rgba(255,255,255,0.9),transparent_24%),linear-gradient(180deg,#f1e8dc_0%,#e7dbca_100%)]">
                <div className="absolute right-4 top-4 z-10">
                  <Badge>{t(`badges.${perfume.badgeKey}`)}</Badge>
                </div>
                <PerfumeImage
                  imageUrl={perfume.imageUrl}
                  perfumeName={perfume.name}
                  brandName={perfume.brandName}
                  fragranceFamily={fragranceFamilyLabel}
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  imageClassName="transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>

              <div className="flex flex-1 flex-col justify-between gap-4 p-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7763]">
                    {perfume.brandName}
                  </p>
                  <h3 className="mt-2 font-display text-[1.7rem] leading-tight text-[#1f1914]">
                    {perfume.name}
                  </h3>
                  <p className="mt-2 text-sm text-[#635343]">{fragranceFamilyLabel}</p>
                </div>

                {bestPrice != null && currency != null ? (
                  <div className="flex items-end justify-between gap-3 rounded-[1.2rem] border border-[#e8dccb] bg-[#fbf8f2] px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
                        {t("bestPrice")}
                      </p>
                      <p className="mt-1 text-lg font-semibold leading-none text-[#1d1712] sm:leading-tight">
                        {formatCurrency(bestPrice, currency, locale as "it" | "en")}
                      </p>
                    </div>
                    <p
                      className="min-w-0 max-w-[42%] truncate text-right text-sm text-[#5d4e3f]"
                      title={perfume.storeName ?? footerAction}
                    >
                      {perfume.storeName ?? footerAction}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-[1.2rem] border border-[#e8dccb] bg-[#fbf8f2] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
                      {t("offers")}
                    </p>
                    <div className="mt-1.5 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <p className="min-w-0 text-sm font-medium leading-snug text-[#5d4e3f]">
                        {footerAction}
                      </p>
                      {perfume.storeName ? (
                        <p className="min-w-0 text-sm leading-snug text-[#5d4e3f] sm:text-right">
                          {perfume.storeName}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </PerfumeDetailLink>
          );
        })}
      </div>
    </section>
  );
}

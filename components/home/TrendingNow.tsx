import type { ComponentProps } from "react";
import { useLocale, useTranslations } from "next-intl";

import { PerfumeImage } from "@/components/perfumes/PerfumeImage";
import { Badge } from "@/components/ui/Badge";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { HomePerfumeSpotlight } from "@/lib/homepage";
import { Link } from "@/lib/navigation";
import { formatCurrency } from "@/lib/utils";

type TrendingNowProps = {
  perfumes: HomePerfumeSpotlight[];
};

type LinkHref = ComponentProps<typeof Link>["href"];

export function TrendingNow({ perfumes }: TrendingNowProps) {
  const t = useTranslations("home.trending");
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

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {perfumes.map((perfume) => (
          <Link
            key={`${perfume.brandName}-${perfume.name}`}
            href={perfume.href as unknown as LinkHref}
            className="premium-card group overflow-hidden rounded-[1.75rem] border border-[#e2d6c6] bg-white shadow-[0_24px_48px_-36px_rgba(50,35,20,0.44)] transition-all duration-300 hover:-translate-y-1"
          >
            <div className="relative h-64 overflow-hidden bg-[radial-gradient(circle_at_20%_16%,rgba(255,255,255,0.9),transparent_24%),linear-gradient(180deg,#f1e8dc_0%,#e7dbca_100%)]">
              <div className="absolute right-4 top-4 z-10">
                <Badge>{t(`badges.${perfume.badgeKey}`)}</Badge>
              </div>
              <PerfumeImage
                imageUrl={perfume.imageUrl}
                perfumeName={perfume.name}
                brandName={perfume.brandName}
                fragranceFamily={perfume.fragranceFamily}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                imageClassName="transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </div>

            <div className="space-y-4 p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7763]">
                  {perfume.brandName}
                </p>
                <h3 className="mt-2 font-display text-[1.7rem] leading-tight text-[#1f1914]">
                  {perfume.name}
                </h3>
                <p className="mt-2 text-sm text-[#635343]">{perfume.fragranceFamily}</p>
              </div>

              <div className="flex items-end justify-between gap-4 rounded-[1.2rem] border border-[#e8dccb] bg-[#fbf8f2] px-4 py-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
                    {perfume.bestPrice != null && perfume.currency ? t("bestPrice") : t("offers")}
                  </p>
                  {perfume.bestPrice != null && perfume.currency ? (
                    <p className="mt-1 text-lg font-semibold text-[#1d1712]">
                      {formatCurrency(perfume.bestPrice, perfume.currency, locale as "it" | "en")}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-[#5d4e3f]">{t("seeProductDetails")}</p>
                  )}
                </div>
                <p className="text-right text-sm text-[#5d4e3f]">
                  {perfume.storeName ?? (perfume.hasOffer ? t("viewOffers") : t("seeProductDetails"))}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

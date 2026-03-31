import { useLocale, useTranslations } from "next-intl";

import { PerfumeDetailLink } from "@/components/perfumes/PerfumeDetailLink";
import { PerfumeImage } from "@/components/perfumes/PerfumeImage";
import { Badge } from "@/components/ui/Badge";
import { computeBestOffer, getBestOfferSummary, type OfferForPricing } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";

export type PerfumeCardItem = {
  id: number;
  slug: string;
  name: string;
  descriptionShort: string;
  imageUrl: string | null;
  gender: string;
  fragranceFamily: string;
  priceRange: string;
  isArabic: boolean;
  isNiche: boolean;
  brand: {
    name: string;
  };
  bestPriceAmount?: number | null;
  bestTotalPriceAmount?: number | null;
  bestCurrency?: string | null;
  bestStoreName?: string | null;
  bestOfferUrl?: string | null;
  bestOfferUpdatedAt?: Date | string | null;
  hasAvailableOffer?: boolean | null;
  offers?: OfferForPricing[];
  notes?: Array<{
    intensity?: number | null;
    note?: {
      name?: string | null;
      slug?: string | null;
    } | null;
  }>;
};

type PerfumeCardProps = {
  perfume: PerfumeCardItem;
  variant?: "default" | "catalog";
};

export function PerfumeCard({ perfume, variant = "default" }: PerfumeCardProps) {
  const t = useTranslations("perfume.card");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const brandName = perfume.brand?.name?.trim() || t("unknownBrand");
  const bestOffer = getBestOfferSummary(perfume) ?? (perfume.offers?.length ? computeBestOffer(perfume.offers) : null);

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#e1d5c5] bg-white shadow-[0_20px_45px_-36px_rgba(50,35,20,0.4)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_52px_-34px_rgba(50,35,20,0.55)]">
      <PerfumeDetailLink
        href={{ pathname: "/perfumes/[slug]", params: { slug: perfume.slug } }}
        perfumeName={perfume.name}
      >
        <div className="relative h-56 w-full bg-[#efe7dc]">
          <PerfumeImage
            imageUrl={perfume.imageUrl}
            perfumeName={perfume.name}
            brandName={brandName}
            fragranceFamily={perfume.fragranceFamily}
            sizes="(max-width: 1024px) 50vw, 25vw"
            imageClassName="transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      </PerfumeDetailLink>

      <div className="space-y-3 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[#8a7763]">{brandName}</p>
          <PerfumeDetailLink
            href={{ pathname: "/perfumes/[slug]", params: { slug: perfume.slug } }}
            perfumeName={perfume.name}
          >
            <h3
              className={`mt-1 font-display text-[#1f1914] transition-colors hover:text-[#6c5946] ${
                variant === "catalog" ? "text-[1.7rem] leading-[1.12]" : "text-2xl"
              }`}
            >
              {perfume.name}
            </h3>
          </PerfumeDetailLink>
        </div>

        {variant === "default" ? (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{perfume.fragranceFamily}</Badge>
            <Badge variant="outline">{t("viewOffers")}</Badge>
            {bestOffer ? (
              <Badge variant="default">
                {t("from")} {formatCurrency(bestOffer.bestPrice, bestOffer.bestCurrency, locale as "it" | "en")}
              </Badge>
            ) : null}
            {perfume.isArabic ? <Badge variant="soft">{commonT("badges.arabic")}</Badge> : null}
            {perfume.isNiche ? <Badge variant="soft">{commonT("badges.niche")}</Badge> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

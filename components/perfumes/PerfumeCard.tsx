import { useLocale, useTranslations } from "next-intl";

import { PerfumeDetailLink } from "@/components/perfumes/PerfumeDetailLink";
import { PerfumeImage } from "@/components/perfumes/PerfumeImage";
import { Badge } from "@/components/ui/Badge";
import { getPerfumeShortText } from "@/lib/perfume-text";
import { computeBestOffer, getBestOfferSummary, type OfferForPricing } from "@/lib/pricing";
import { getLocalizedTaxonomyLabel } from "@/lib/taxonomy-display";
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
  ratingInternal?: number | null;
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
  variant?: "default" | "catalog" | "featured" | "finder" | "compact";
};

export function PerfumeCard({ perfume, variant = "default" }: PerfumeCardProps) {
  const t = useTranslations("perfume.card");
  const commonT = useTranslations("common");
  const taxonomyT = useTranslations("taxonomy");
  const locale = useLocale();
  const brandName = perfume.brand?.name?.trim() || t("unknownBrand");
  const bestOffer = getBestOfferSummary(perfume) ?? (perfume.offers?.length ? computeBestOffer(perfume.offers) : null);
  const fragranceFamilyLabel = getLocalizedTaxonomyLabel(perfume.fragranceFamily, "families", taxonomyT);
  const summary = getPerfumeShortText({
    ...perfume,
    fragranceFamily: fragranceFamilyLabel,
    notes: (perfume.notes ?? []).map((item) => ({
      ...item,
      note: item.note
        ? {
            ...item.note,
            name: getLocalizedTaxonomyLabel(item.note.slug, "notes", taxonomyT) || item.note.name,
          }
        : item.note,
    })),
  });
  const ratingValue =
    typeof perfume.ratingInternal === "number" && Number.isFinite(perfume.ratingInternal)
      ? perfume.ratingInternal.toFixed(1)
      : null;

  if (variant === "finder") {
    return (
      <article className="group relative overflow-hidden rounded-[1.75rem] border border-[#e1d5c5] bg-white shadow-[0_20px_45px_-36px_rgba(50,35,20,0.4)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_52px_-34px_rgba(50,35,20,0.55)]">
        <div className="grid min-h-[12.5rem] grid-cols-[8.5rem_minmax(0,1fr)] sm:grid-cols-[10rem_minmax(0,1fr)] xl:grid-cols-[9.25rem_minmax(0,1fr)]">
          <div className="relative h-full min-h-[12.5rem] overflow-hidden bg-white">
            <PerfumeImage
              imageUrl={perfume.imageUrl}
              perfumeName={perfume.name}
              brandName={brandName}
              fragranceFamily={fragranceFamilyLabel}
              sizes="(max-width: 640px) 8.5rem, 11rem"
              imageClassName="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </div>

          <div className="flex min-w-0 flex-col justify-between p-4 sm:p-5 xl:p-4">
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-[11px] uppercase tracking-[0.16em] text-[#8a7763] sm:text-xs">
                  {brandName}
                </p>
                {ratingValue ? (
                  <span className="shrink-0 rounded-full bg-[#1f1914] px-3 py-1 text-[11px] font-semibold text-[#f8f4ed]">
                    {t("ratingShort", { value: ratingValue })}
                  </span>
                ) : null}
              </div>

              <div>
                <h3 className="font-display text-[2rem] leading-[0.98] text-[#1f1914] sm:text-[2.05rem] xl:text-[1.95rem]">
                  {perfume.name}
                </h3>
                {summary ? (
                  <p className="mt-2 text-sm leading-5 text-[#635343]">
                    {summary}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{fragranceFamilyLabel}</Badge>
                {perfume.isArabic ? <Badge variant="soft">{commonT("badges.arabic")}</Badge> : null}
                {perfume.isNiche ? <Badge variant="soft">{commonT("badges.niche")}</Badge> : null}
                {bestOffer ? (
                  <Badge variant="default">
                    {t("from")} {formatCurrency(bestOffer.bestPrice, bestOffer.bestCurrency, locale as "it" | "en")}
                  </Badge>
                ) : null}
              </div>

              <p className="inline-flex items-center text-sm font-medium text-[#4f3f31]">
                {t("viewOffers")}
              </p>
            </div>
          </div>
        </div>

        <PerfumeDetailLink
          href={{ pathname: "/perfumes/[slug]", params: { slug: perfume.slug } }}
          perfumeName={perfume.name}
          className="absolute inset-0 z-10 rounded-[1.75rem]"
        >
          <span className="sr-only">
            {t("viewFragrance")} {perfume.name}
          </span>
        </PerfumeDetailLink>
      </article>
    );
  }

  if (variant === "featured") {
    return (
      <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-[#ede4d8] bg-white shadow-[var(--shadow-card)] transition-all duration-250 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]">
        <PerfumeDetailLink
          href={{ pathname: "/perfumes/[slug]", params: { slug: perfume.slug } }}
          perfumeName={perfume.name}
        >
          <div className="relative h-52 w-full overflow-hidden bg-white sm:h-60 lg:h-64">
            <PerfumeImage
              imageUrl={perfume.imageUrl}
              perfumeName={perfume.name}
              brandName={brandName}
              fragranceFamily={fragranceFamilyLabel}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              imageClassName="object-contain object-center transition-transform duration-400 group-hover:scale-[1.02]"
            />
          </div>
        </PerfumeDetailLink>

        <div className="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
          <div className="space-y-2.5">
            <p className="line-clamp-3 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-[#907b66] sm:text-[10px]">
              {brandName}
            </p>
            <PerfumeDetailLink
              href={{ pathname: "/perfumes/[slug]", params: { slug: perfume.slug } }}
              perfumeName={perfume.name}
            >
              <h3 className="line-clamp-3 font-display text-[1.1rem] leading-[1.04] text-[#1e1813] transition-colors hover:text-[#6c5946] sm:text-[1.35rem]">
                {perfume.name}
              </h3>
            </PerfumeDetailLink>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">{fragranceFamilyLabel}</Badge>
            {bestOffer ? (
              <Badge variant="default">
                {t("from")} {formatCurrency(bestOffer.bestPrice, bestOffer.bestCurrency, locale as "it" | "en")}
              </Badge>
            ) : null}
            {perfume.isArabic ? <Badge variant="soft">{commonT("badges.arabic")}</Badge> : null}
            {perfume.isNiche ? <Badge variant="soft">{commonT("badges.niche")}</Badge> : null}
          </div>
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#ede4d8] bg-white shadow-[0_14px_32px_-28px_rgba(50,35,20,0.38)] transition-all duration-200 active:scale-[0.99] sm:hover:-translate-y-1 sm:hover:shadow-[var(--shadow-card-hover)]">
        <PerfumeDetailLink
          href={{ pathname: "/perfumes/[slug]", params: { slug: perfume.slug } }}
          perfumeName={perfume.name}
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-b from-[#f8f3eb] to-[#eee4d7]">
            <PerfumeImage
              imageUrl={perfume.imageUrl}
              perfumeName={perfume.name}
              brandName={brandName}
              fragranceFamily={fragranceFamilyLabel}
              sizes="(max-width: 640px) 48vw, 25vw"
              imageClassName="object-contain object-center p-2 transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </div>
        </PerfumeDetailLink>

        <div className="p-3">
          <p className="line-clamp-1 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[#907b66]">
            {brandName}
          </p>
          <PerfumeDetailLink
            href={{ pathname: "/perfumes/[slug]", params: { slug: perfume.slug } }}
            perfumeName={perfume.name}
          >
            <h3 className="mt-1 line-clamp-2 font-display text-[1.05rem] leading-[1.05] text-[#1e1813] transition-colors hover:text-[#6c5946]">
              {perfume.name}
            </h3>
          </PerfumeDetailLink>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-[#ede4d8] bg-white shadow-[var(--shadow-card)] transition-all duration-250 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]">
      <PerfumeDetailLink
        href={{ pathname: "/perfumes/[slug]", params: { slug: perfume.slug } }}
        perfumeName={perfume.name}
      >
        <div className="relative h-60 w-full overflow-hidden bg-gradient-to-b from-[#f5ede2] to-[#ebe1d4]">
          <PerfumeImage
            imageUrl={perfume.imageUrl}
            perfumeName={perfume.name}
            brandName={brandName}
            fragranceFamily={fragranceFamilyLabel}
            sizes="(max-width: 1024px) 50vw, 25vw"
            imageClassName="transition-transform duration-400 group-hover:scale-[1.04]"
          />
        </div>
      </PerfumeDetailLink>

      <div className="flex flex-1 flex-col justify-between gap-4 p-5 sm:p-6">
        <div className="space-y-3">
          <p className="line-clamp-3 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#907b66]">
            {brandName}
          </p>
          <PerfumeDetailLink
            href={{ pathname: "/perfumes/[slug]", params: { slug: perfume.slug } }}
            perfumeName={perfume.name}
          >
            <h3
              className={`line-clamp-4 font-display text-[#1e1813] transition-colors hover:text-[#6c5946] ${
                variant === "catalog" ? "text-[1.6rem] leading-[1.12]" : "text-[1.35rem] leading-[1.15]"
              }`}
            >
              {perfume.name}
            </h3>
          </PerfumeDetailLink>
        </div>

        {variant === "default" ? (
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">{fragranceFamilyLabel}</Badge>
          </div>
        ) : null}
      </div>
    </article>
  );
}

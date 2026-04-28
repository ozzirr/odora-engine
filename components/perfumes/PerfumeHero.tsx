import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";

import { MobilePerfumeCtaBar } from "@/components/perfumes/MobilePerfumeCtaBar";
import { PerfumeImage } from "@/components/perfumes/PerfumeImage";
import { PriceCard } from "@/components/perfumes/PriceCard";
import { Badge } from "@/components/ui/Badge";
import { getAmazonProductUrl } from "@/lib/amazon";
import { type AppLocale } from "@/lib/i18n";
import { getPerfumeShortText } from "@/lib/perfume-text";
import type { ComputedBestOffer } from "@/lib/pricing";
import { Link } from "@/lib/navigation";
import { getLocalizedTaxonomyLabel } from "@/lib/taxonomy-display";
import { cn } from "@/lib/utils";

type PerfumeHeroProps = {
  perfume: {
    slug: string;
    name: string;
    descriptionShort: string;
    descriptionLong?: string;
    imageUrl: string | null;
    gender: string;
    fragranceFamily: string;
    isArabic: boolean;
    isNiche: boolean;
    ratingInternal: number | null;
    longevityScore: number | null;
    sillageScore: number | null;
    versatilityScore: number | null;
    amazonUrl?: string | null;
    brand: {
      name: string;
      slug?: string | null;
    };
    notes?: Array<{
      intensity?: number | null;
      note?: {
        name?: string | null;
        slug?: string | null;
      } | null;
    }>;
    moods?: Array<{
      weight?: number | null;
      mood?: {
        name?: string | null;
        slug?: string | null;
      } | null;
    }>;
    occasions?: Array<{
      weight?: number | null;
      occasion?: {
        name?: string | null;
        slug?: string | null;
      } | null;
    }>;
  };
  listAction?: ReactNode;
  bestOffer: ComputedBestOffer | null;
  reviewCount: number;
};

function MetricItem({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-[1rem] border border-[#deceb9] bg-white/78 px-3 py-3 text-center shadow-[0_16px_34px_-32px_rgba(53,39,27,0.26)]">
      <p className="text-[9px] font-medium uppercase leading-[1.15] tracking-[0.1em] text-[#8a7763]">{label}</p>
      <p className="mt-1 text-lg font-semibold leading-none text-[#1f1914]">
        {value ?? "-"}
        <span className="ml-1 text-[13px] font-medium text-[#6f5d4b]">/ 10</span>
      </p>
    </div>
  );
}

function RatingBlock({
  rating,
  reviewCount,
  metrics,
}: {
  rating: number | null;
  reviewCount: number;
  metrics: Array<{ label: string; value: number | null }>;
}) {
  if (!rating && metrics.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[1.35rem] border border-[#dfd1be] bg-[#fffdf9]/88 p-3 shadow-[0_18px_42px_-36px_rgba(53,39,27,0.32)] sm:p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7763]">Odora score</p>
          <p className="mt-1 text-[2rem] font-semibold leading-none text-[#1f1914]">
            {rating ? (rating * 2).toFixed(1) : "-"}
            <span className="ml-1 text-base font-medium text-[#6f5d4b]">/10</span>
          </p>
        </div>
        <p className="pb-1 text-sm font-medium text-[#5b4c3d]">
          {reviewCount > 0 ? `${reviewCount.toLocaleString("it-IT")} recensioni` : "Recensioni in crescita"}
        </p>
      </div>
      {metrics.length > 0 ? (
        <div
          className={cn(
            "mt-3 grid gap-2.5",
            metrics.length === 1 ? "grid-cols-1" : metrics.length === 2 ? "grid-cols-2" : "grid-cols-3",
          )}
        >
          {metrics.map((metric) => (
            <MetricItem key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PerfumeHero({ perfume, listAction, bestOffer, reviewCount }: PerfumeHeroProps) {
  const t = useTranslations("perfume.hero");
  const commonT = useTranslations("common");
  const taxonomyT = useTranslations("taxonomy");
  const locale = useLocale() as AppLocale;
  const brandName = perfume.brand?.name?.trim() || t("unknownBrand");
  const localizedFragranceFamily = getLocalizedTaxonomyLabel(perfume.fragranceFamily, "families", taxonomyT);
  const summary = getPerfumeShortText({
    ...perfume,
    fragranceFamily: localizedFragranceFamily,
  });
  const amazonUrl = getAmazonProductUrl({
    amazonUrl: perfume.amazonUrl,
    brandName,
    perfumeName: perfume.name,
    locale,
    perfumeSlug: perfume.slug,
  });
  const metrics = [
    { label: t("metrics.longevity"), value: perfume.longevityScore },
    { label: t("metrics.sillage"), value: perfume.sillageScore },
    { label: t("metrics.versatility"), value: perfume.versatilityScore },
  ].filter((metric) => metric.value !== null);
  return (
    <>
      <section className="overflow-hidden rounded-[2rem] border border-[#ddd0be] bg-[linear-gradient(180deg,rgba(255,253,249,0.98),rgba(247,240,231,0.98))] p-4 shadow-[0_26px_70px_-48px_rgba(50,35,20,0.42)] sm:p-5 lg:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(20rem,0.86fr)_minmax(0,1.14fr)] lg:items-stretch">
          <div className="relative h-[15.5rem] overflow-hidden rounded-[1.45rem] border border-[#ddcfbc] bg-white shadow-[0_18px_36px_-28px_rgba(53,39,27,0.28)] sm:h-[24rem] lg:h-auto lg:min-h-[30rem] lg:rounded-[1.6rem]">
            <PerfumeImage
              imageUrl={perfume.imageUrl}
              perfumeName={perfume.name}
              brandName={brandName}
              fragranceFamily={localizedFragranceFamily}
              priority
              sizes="(max-width: 1024px) 100vw, 42vw"
              imageClassName="object-cover"
            />
          </div>

          <div className="flex min-w-0 flex-col justify-center space-y-5">
            <div className="min-w-0">
              {perfume.brand?.slug ? (
                <Link
                  href={{ pathname: "/brands/[slug]", params: { slug: perfume.brand.slug } }}
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7763] hover:text-[#1f1914] transition-colors"
                >
                  {brandName}
                </Link>
              ) : (
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7763]">{brandName}</p>
              )}
              <h1 className="mt-1.5 font-display text-[2.4rem] leading-[0.92] text-[#1f1914] sm:text-[3.4rem] lg:text-[4rem]">
                {perfume.name}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5b4c3d]">{summary}</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{localizedFragranceFamily}</Badge>
                {perfume.isArabic ? <Badge variant="soft">{commonT("badges.arabic")}</Badge> : null}
                {perfume.isNiche ? <Badge variant="soft">{commonT("badges.niche")}</Badge> : null}
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,0.82fr)_minmax(19rem,1fr)] xl:items-stretch">
                <PriceCard
                  bestOffer={bestOffer}
                  amazonUrl={amazonUrl}
                  className="xl:col-start-2 xl:row-span-2 xl:row-start-1"
                />
                <div className="xl:col-start-1 xl:row-start-1">
                  <RatingBlock rating={perfume.ratingInternal} reviewCount={reviewCount} metrics={metrics} />
                </div>
                {listAction ? (
                  <div className="xl:col-start-1 xl:row-start-2 [&>button]:!bg-[#f0e9de] [&>button]:!text-[#2a2018] [&>button]:border [&>button]:border-[#e2d6c4] [&>button]:shadow-none [&>button:hover]:!bg-[#e8dece] [&>a]:!bg-[#f0e9de] [&>a]:!text-[#2a2018] [&>a]:border [&>a]:border-[#e2d6c4] [&>a]:shadow-none [&>a:hover]:!bg-[#e8dece]">
                    {listAction}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <MobilePerfumeCtaBar
        amazonUrl={amazonUrl}
      />
    </>
  );
}

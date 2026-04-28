import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";

import { MobilePerfumeCtaBar } from "@/components/perfumes/MobilePerfumeCtaBar";
import { PerfumeImage } from "@/components/perfumes/PerfumeImage";
import { PriceCard } from "@/components/perfumes/PriceCard";
import { Badge } from "@/components/ui/Badge";
import { buttonStyles } from "@/components/ui/Button";
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
      <section className="rounded-[1.7rem] border border-[#ddd0be] bg-[#fffdf9] p-4 shadow-[0_26px_70px_-48px_rgba(50,35,20,0.42)] sm:p-5 lg:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="relative h-[20rem] overflow-hidden rounded-[1.25rem] border border-[#ddcfbc] bg-white shadow-[0_18px_36px_-28px_rgba(53,39,27,0.28)] sm:h-[25rem] lg:h-[31rem]">
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

          <div className="min-w-0 lg:py-2">
            <div className="mt-6 min-w-0 lg:mt-0">
              {perfume.brand?.slug ? (
                <Link
                  href={{ pathname: "/brands/[slug]", params: { slug: perfume.brand.slug } }}
                  className="text-sm font-semibold text-[#1f1914] hover:text-[#1e4b3b] transition-colors"
                >
                  {brandName}
                </Link>
              ) : (
                <p className="text-sm font-semibold text-[#1f1914]">{brandName}</p>
              )}
              <h1 className="mt-1 font-display text-[2.6rem] leading-[0.94] text-[#1f1914] sm:text-[3.25rem] lg:text-[4rem]">
                {perfume.name}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5b4c3d]">{summary}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">{localizedFragranceFamily}</Badge>
              {perfume.isArabic ? <Badge variant="soft">{commonT("badges.arabic")}</Badge> : null}
              {perfume.isNiche ? <Badge variant="soft">{commonT("badges.niche")}</Badge> : null}
            </div>

            <div className="mt-4">
              <RatingBlock rating={perfume.ratingInternal} reviewCount={reviewCount} metrics={metrics} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {listAction ? <div>{listAction}</div> : null}
              <a
                href={amazonUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonStyles({
                  className:
                    "h-12 w-full bg-[#ff9f0a] !text-[#23170c] shadow-[0_18px_35px_-24px_rgba(255,159,10,0.74)] hover:bg-[#f09100] hover:!text-[#23170c]",
                })}
              >
                {locale === "it" ? "Scopri su Amazon" : "View on Amazon"}
              </a>
            </div>

            <div className="mt-4">
              <PriceCard bestOffer={bestOffer} amazonUrl={amazonUrl} />
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

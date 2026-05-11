import type { ReactNode } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { MobilePerfumeCtaBar } from "@/components/perfumes/MobilePerfumeCtaBar";
import { PerfumeImage } from "@/components/perfumes/PerfumeImage";
import { Badge } from "@/components/ui/Badge";
import { buttonStyles } from "@/components/ui/Button";
import { getAmazonProductUrl } from "@/lib/amazon";
import { type AppLocale } from "@/lib/i18n";
import { getPerfumeShortText } from "@/lib/perfume-text";
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
  reviewCount: number;
};

function MetricItem({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#e4d8c8] bg-white/68 px-2 py-2 text-center shadow-[0_12px_28px_-26px_rgba(53,39,27,0.32)]">
      <p className="truncate text-[9px] font-semibold uppercase leading-none tracking-[0.1em] text-[#8a7763]">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold leading-none text-[#1f1914]">
        {value ?? "-"}
        <span className="ml-1 text-[12px] font-medium text-[#6f5d4b]">/10</span>
      </p>
    </div>
  );
}

function calculateOdoraCommunityScore(metrics: Array<{ value: number | null }>) {
  const values = metrics
    .map((metric) => metric.value)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function RatingBlock({
  score,
  label,
  metrics,
}: {
  score: number | null;
  label: string;
  metrics: Array<{ label: string; value: number | null }>;
}) {
  if (score == null && metrics.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#dfd1be] bg-[radial-gradient(circle_at_18%_18%,rgba(217,183,127,0.16),transparent_32%),linear-gradient(180deg,#fffdf9_0%,#fbf5ec_100%)] p-3 shadow-[0_18px_42px_-36px_rgba(53,39,27,0.34)] sm:p-4">
      <div className="pointer-events-none absolute right-3 top-3 h-14 w-14 rounded-full border border-[#e7dac8]/70 bg-white/34" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="max-w-[11rem] text-[10px] font-semibold uppercase leading-[1.35] tracking-[0.16em] text-[#8a7763] sm:max-w-none">
            {label}
          </p>
          <p className="mt-1 text-[2.35rem] font-semibold leading-none tracking-[-0.02em] text-[#1f1914] sm:text-[2.55rem]">
            {score != null ? score.toFixed(1) : "-"}
            <span className="ml-1 text-lg font-medium tracking-normal text-[#6f5d4b]">/10</span>
          </p>
        </div>
      </div>
      {metrics.length > 0 ? (
        <div
          className={cn(
            "relative mt-3 grid gap-2",
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

function AmazonWordmark({ className }: { className?: string }) {
  return (
    <Image
      src="/images/logo_amazon.webp"
      alt="Amazon"
      width={110}
      height={34}
      className={cn("brightness-0 invert", className)}
    />
  );
}

export function PerfumeHero({ perfume, listAction, reviewCount }: PerfumeHeroProps) {
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
  const odoraCommunityScore = calculateOdoraCommunityScore(metrics);
  const popularityBadge =
    reviewCount >= 10
      ? t("badges.communityFavorite")
      : reviewCount > 0
        ? t("badges.earlyRatings")
        : perfume.isNiche
          ? t("badges.popular")
          : null;
  return (
    <>
      <section data-perfume-hero="true" className="rounded-2xl border border-[#ddd0be] bg-[#fffdf9] p-3 shadow-[0_26px_70px_-48px_rgba(50,35,20,0.42)] sm:p-5 lg:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="relative h-[18rem] overflow-hidden rounded-2xl border border-[#ddcfbc] bg-[linear-gradient(180deg,#ffffff_0%,#f3eadf_100%)] shadow-[0_18px_38px_-26px_rgba(53,39,27,0.34)] sm:h-[25rem] lg:h-[31rem]">
            <div aria-hidden="true" className="absolute inset-x-8 bottom-5 h-16 rounded-full bg-[#d9c7b1]/45 blur-2xl" />
            <PerfumeImage
              imageUrl={perfume.imageUrl}
              perfumeName={perfume.name}
              brandName={brandName}
              fragranceFamily={localizedFragranceFamily}
              priority
              sizes="(max-width: 1024px) 100vw, 42vw"
              imageClassName="object-contain object-center p-3 transition-transform duration-300 lg:p-5"
            />
          </div>

          <div className="min-w-0 lg:py-2">
            <div className="min-w-0 lg:mt-0">
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
              <div className="mt-1 flex flex-wrap items-start gap-2">
                <h1 className="min-w-0 flex-1 font-display text-3xl leading-[0.98] text-[#1f1914] sm:text-[3.25rem] lg:text-[4rem]">
                  {perfume.name}
                </h1>
                {popularityBadge ? (
                  <span className="mt-1 rounded-full border border-[#d7e4d8] bg-[#edf4ee] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1e4b3b]">
                    {popularityBadge}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5b4c3d]">{summary}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">{localizedFragranceFamily}</Badge>
              {perfume.isArabic ? <Badge variant="soft">{commonT("badges.arabic")}</Badge> : null}
              {perfume.isNiche ? <Badge variant="soft">{commonT("badges.niche")}</Badge> : null}
            </div>

            <div className="mt-3">
              <RatingBlock
                score={odoraCommunityScore}
                label={t("score.label")}
                metrics={metrics}
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <a
                href={amazonUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonStyles({
                  className:
                    "h-12 w-full bg-[#ff9f0a] !text-[#23170c] hover:bg-[#f09100] hover:!text-[#23170c]",
                })}
              >
                <span className="inline-flex items-center gap-2">
                  <span>{locale === "it" ? "Acquista su" : "Buy on"}</span>
                  <span className="inline-flex min-w-[92px] items-center justify-center">
                    <AmazonWordmark className="h-[24px] w-auto object-contain translate-y-[1px]" />
                  </span>
                </span>
              </a>
              {listAction ? <div>{listAction}</div> : null}
            </div>
          </div>
        </div>
      </section>

      <MobilePerfumeCtaBar
        compareHref="#price-offers"
        listAction={listAction}
      />
    </>
  );
}

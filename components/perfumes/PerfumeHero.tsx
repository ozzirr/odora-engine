import type { ComponentProps } from "react";
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
import { type ComputedBestOffer } from "@/lib/pricing";
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
  bestOffer: ComputedBestOffer | null;
};

type LinkHref = ComponentProps<typeof Link>["href"];

function AmazonWordmark({ className }: { className?: string }) {
  return (
    <Image
      src="/images/logo_amazon.webp"
      alt="Amazon"
      width={110}
      height={34}
      className={`brightness-0 invert ${className ?? ""}`}
    />
  );
}

function MetricItem({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-[1.15rem] border border-[#deceb9] bg-white/78 px-2.5 py-2.5 text-center shadow-[0_16px_34px_-32px_rgba(53,39,27,0.26)]">
      <p className="text-[9px] font-medium uppercase leading-[1.15] tracking-[0.1em] text-[#8a7763]">{label}</p>
      <p className="mt-1 text-lg font-semibold leading-none text-[#1f1914]">
        {value ?? "-"}
        <span className="ml-1 text-[13px] font-medium text-[#6f5d4b]">/ 10</span>
      </p>
    </div>
  );
}

export function PerfumeHero({ perfume, bestOffer }: PerfumeHeroProps) {
  const t = useTranslations("perfume.hero");
  const amazonT = useTranslations("perfume.amazon");
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
  const hasBestOffer = Boolean(bestOffer?.bestUrl);
  return (
    <>
      <section className="overflow-hidden rounded-[2rem] border border-[#ddd0be] bg-[linear-gradient(180deg,rgba(255,253,249,0.96),rgba(246,238,228,0.98))] p-4 shadow-[0_22px_54px_-38px_rgba(50,35,20,0.34)] sm:p-5 lg:p-6">
        <div className="space-y-3 sm:space-y-4">
          <div className="grid items-start gap-4 grid-cols-[7.25rem_minmax(0,1fr)] sm:gap-5 sm:grid-cols-[9rem_minmax(0,1fr)] lg:gap-6 lg:grid-cols-[11.25rem_minmax(0,1fr)]">
            <div className="relative h-[11rem] overflow-hidden rounded-[1.45rem] border border-[#ddcfbc] bg-white shadow-[0_18px_36px_-28px_rgba(53,39,27,0.28)] sm:h-[14rem] lg:h-[18rem] lg:rounded-[1.6rem]">
              <PerfumeImage
                imageUrl={perfume.imageUrl}
                perfumeName={perfume.name}
                brandName={brandName}
                fragranceFamily={localizedFragranceFamily}
                priority
                sizes="(max-width: 640px) 7.25rem, (max-width: 1024px) 9rem, 11.25rem"
                imageClassName="object-cover"
              />
            </div>

            <div className="min-w-0 space-y-3 sm:space-y-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7763]">{brandName}</p>
                <h1 className="mt-1.5 font-display text-[1.95rem] leading-[0.94] text-[#1f1914] sm:text-[2.65rem] lg:text-[3.15rem]">
                  {perfume.name}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5b4c3d]">{summary}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{localizedFragranceFamily}</Badge>
                {perfume.isArabic ? <Badge variant="soft">{commonT("badges.arabic")}</Badge> : null}
                {perfume.isNiche ? <Badge variant="soft">{commonT("badges.niche")}</Badge> : null}
                {perfume.ratingInternal ? (
                  <Badge variant="outline">{t("rating", { value: perfume.ratingInternal.toFixed(1) })}</Badge>
                ) : null}
              </div>

              <a
                href={amazonUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonStyles({
                  className:
                    "h-11 w-full bg-[#ffb647] !text-[#23170c] hover:bg-[#f0a62f] hover:!text-[#23170c] sm:hidden",
                })}
              >
                <span className="inline-flex items-center gap-2">
                  <span>{amazonT("ctaPrefix")}</span>
                  <span className="inline-flex min-w-[86px] items-center justify-center">
                    <AmazonWordmark className="h-[20px] w-auto object-contain translate-y-[1px]" />
                  </span>
                </span>
              </a>

              <div className="hidden gap-3 sm:flex sm:flex-col lg:flex-row lg:flex-wrap">
                {hasBestOffer ? (
                  <Link
                    href={bestOffer!.bestUrl as unknown as LinkHref}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonStyles({ className: "h-12 w-full sm:w-full lg:w-auto lg:min-w-[180px] lg:px-6" })}
                  >
                    {t("goToOffer")}
                  </Link>
                ) : null}

                <a
                  href={amazonUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonStyles({
                    className:
                      "h-12 w-full bg-[#ffb647] !text-[#23170c] hover:bg-[#f0a62f] hover:!text-[#23170c] sm:w-full lg:w-auto lg:min-w-[210px] lg:px-6",
                  })}
                >
                  <span className="inline-flex items-center gap-2">
                    <span>{amazonT("ctaPrefix")}</span>
                    <span className="inline-flex min-w-[86px] items-center justify-center">
                      <AmazonWordmark className="h-[22px] w-auto object-contain translate-y-[1px]" />
                    </span>
                  </span>
                </a>
              </div>
            </div>
          </div>

          {metrics.length > 0 ? (
            <div
              className={cn(
                "grid gap-2.5 sm:gap-3",
                metrics.length === 1
                  ? "grid-cols-1"
                  : metrics.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-3",
              )}
            >
              {metrics.map((metric) => (
                <MetricItem key={metric.label} label={metric.label} value={metric.value} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <MobilePerfumeCtaBar
        bestOfferUrl={bestOffer?.bestUrl ?? null}
        amazonUrl={amazonUrl}
      />
    </>
  );
}

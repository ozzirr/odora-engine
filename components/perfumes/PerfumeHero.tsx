import type { ComponentProps } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { BestOfferCard } from "@/components/perfumes/BestOfferCard";
import { PerfumeImage } from "@/components/perfumes/PerfumeImage";
import { Badge } from "@/components/ui/Badge";
import { buttonStyles } from "@/components/ui/Button";
import { getAmazonProductUrl } from "@/lib/amazon";
import { type AppLocale } from "@/lib/i18n";
import { getPerfumeShortText } from "@/lib/perfume-text";
import { Link } from "@/lib/navigation";
import { type ComputedBestOffer } from "@/lib/pricing";
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
    <div className="rounded-xl border border-[#deceb9] bg-white/70 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a7763]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-[#1f1914]">{value ?? "-"} / 10</p>
    </div>
  );
}

export function PerfumeHero({ perfume, bestOffer }: PerfumeHeroProps) {
  const t = useTranslations("perfume.hero");
  const amazonT = useTranslations("perfume.amazon");
  const commonT = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const brandName = perfume.brand?.name?.trim() || t("unknownBrand");
  const summary = getPerfumeShortText(perfume);
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
    <section className="grid gap-6 lg:grid-cols-[1.05fr_1.35fr] lg:gap-8">
      <div className="relative h-[300px] overflow-hidden rounded-2xl border border-[#ddcfbc] bg-[#efe7dc] sm:h-[360px] lg:h-[430px]">
        <PerfumeImage
          imageUrl={perfume.imageUrl}
          perfumeName={perfume.name}
          brandName={brandName}
          fragranceFamily={perfume.fragranceFamily}
          priority
          sizes="(max-width: 1024px) 100vw, 42vw"
        />
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7763]">{brandName}</p>
          <h1 className="mt-2 font-display text-4xl text-[#1f1914] sm:text-5xl">{perfume.name}</h1>
          <p className="mt-2 text-sm text-[#5b4c3d]">{summary}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{perfume.fragranceFamily}</Badge>
          {perfume.isArabic ? <Badge variant="soft">{commonT("badges.arabic")}</Badge> : null}
          {perfume.isNiche ? <Badge variant="soft">{commonT("badges.niche")}</Badge> : null}
          {perfume.ratingInternal ? (
            <Badge variant="outline">{t("rating", { value: perfume.ratingInternal.toFixed(1) })}</Badge>
          ) : null}
        </div>

        {metrics.length > 0 ? (
          <div
            className={cn(
              "grid gap-2 sm:gap-3",
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

        <BestOfferCard bestOffer={bestOffer} showButton={false} className="bg-[#f7efe2]" />

        <div className="space-y-3">
          {bestOffer?.bestUrl ? (
            <Link
              href={bestOffer.bestUrl as unknown as LinkHref}
              target="_blank"
              rel="noreferrer"
              className={buttonStyles({ className: "h-12 w-full sm:w-auto sm:px-6" })}
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
                "h-12 w-full bg-[#ffb647] !text-[#23170c] hover:bg-[#f0a62f] hover:!text-[#23170c] sm:w-auto sm:px-6",
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
    </section>
  );
}

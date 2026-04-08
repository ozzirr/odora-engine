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

const TOP3_ACCENT: Record<1 | 2 | 3, { rank: string; border: string; glow: string }> = {
  1: {
    rank: "text-[#b08c20]",
    border: "border-[#e4d5a8]/70",
    glow: "shadow-[0_22px_52px_-28px_rgba(176,140,32,0.34)]",
  },
  2: {
    rank: "text-[#909090]",
    border: "border-[#d3d3d3]/70",
    glow: "shadow-[0_18px_42px_-28px_rgba(120,120,120,0.28)]",
  },
  3: {
    rank: "text-[#9a6e38]",
    border: "border-[#cfaa85]/70",
    glow: "shadow-[0_18px_42px_-28px_rgba(154,110,56,0.24)]",
  },
};

type PodiumCardProps = {
  perfume: HomePerfumeSpotlight;
  rank: 1 | 2 | 3;
  emphasis?: "hero" | "side";
};

function PodiumCard({ perfume, rank, emphasis = "side" }: PodiumCardProps) {
  const t = useTranslations("home.trending");
  const taxonomyT = useTranslations("taxonomy");
  const accent = TOP3_ACCENT[rank];
  const fragranceFamilyLabel = getLocalizedTaxonomyLabel(
    perfume.fragranceFamily,
    "families",
    taxonomyT,
  );
  const footerAction = perfume.hasOffer ? t("viewOffers") : t("seeProductDetails");

  return (
    <PerfumeDetailLink
      href={perfume.href as unknown as LinkHref}
      perfumeName={perfume.name}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[1.7rem] border bg-white transition-all duration-250 hover:-translate-y-1",
        accent.border,
        accent.glow,
        emphasis === "hero"
          ? "min-h-[28rem] sm:min-h-[33rem]"
          : "min-h-[19rem] sm:min-h-[23rem]",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),transparent_56%),linear-gradient(180deg,#f8efe3_0%,#f3e8da_100%)]",
          emphasis === "hero" ? "h-64 sm:h-72" : "h-44 sm:h-52",
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-4 sm:pt-5">
          <div className="rounded-full border border-white/70 bg-white/72 px-4 py-1.5 shadow-[0_14px_30px_-22px_rgba(53,38,24,0.4)] backdrop-blur-[2px]">
            <span className={cn("font-display text-[1.6rem] leading-none", accent.rank)}>
              {rank}
            </span>
          </div>
        </div>

        <PerfumeImage
          imageUrl={perfume.imageUrl}
          perfumeName={perfume.name}
          brandName={perfume.brandName}
          fragranceFamily={fragranceFamilyLabel}
          sizes={emphasis === "hero" ? "(max-width: 1024px) 92vw, 34vw" : "(max-width: 1024px) 46vw, 24vw"}
          imageClassName="object-contain p-5 pt-12 transition-transform duration-500 group-hover:scale-[1.03] sm:p-6 sm:pt-14"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 p-5 sm:p-6">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#907b66] sm:text-[10.5px]">
              {perfume.brandName}
            </p>
            <h3
              className={cn(
                "font-display text-[#1e1813]",
                emphasis === "hero"
                  ? "text-[2.2rem] leading-[0.96] sm:text-[2.9rem]"
                  : "text-[1.55rem] leading-[1.02] sm:text-[2rem]",
              )}
            >
              {perfume.name}
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{fragranceFamilyLabel}</Badge>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[12.5px] font-semibold tracking-[0.01em] text-[#907b66] transition-colors group-hover:text-[#4a3a2a]">
            {footerAction}
          </p>
          <span
            className="translate-x-0 text-[1rem] text-[#907b66] transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          >
            →
          </span>
        </div>
      </div>
    </PerfumeDetailLink>
  );
}

export function TrendingNow({ perfumes }: TrendingNowProps) {
  const t = useTranslations("home.trending");
  const podium = perfumes.slice(0, 3);

  if (podium.length === 0) {
    return null;
  }

  const second = podium[1];
  const first = podium[0];
  const third = podium[2];

  return (
    <section className="section-gap space-y-10">
      <SectionTitle
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.16fr)_minmax(0,1fr)] lg:items-end lg:gap-4 lg:space-y-0">
        {first ? (
          <div className="lg:order-2">
            <PodiumCard perfume={first} rank={1} emphasis="hero" />
          </div>
        ) : null}

        {(second || third) ? (
          <div className="grid grid-cols-2 gap-4 lg:contents">
            {second ? (
              <div className="lg:order-1 lg:pb-8">
                <PodiumCard perfume={second} rank={2} />
              </div>
            ) : null}

            {third ? (
              <div className="lg:order-3 lg:pb-4">
                <PodiumCard perfume={third} rank={3} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

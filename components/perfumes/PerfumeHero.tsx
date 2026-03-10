import Link from "next/link";

import { BestOfferCard } from "@/components/perfumes/BestOfferCard";
import { PerfumeImage } from "@/components/perfumes/PerfumeImage";
import { Badge } from "@/components/ui/Badge";
import { buttonStyles } from "@/components/ui/Button";
import { getPerfumeShortText } from "@/lib/perfume-text";
import { type ComputedBestOffer } from "@/lib/pricing";
import { formatGender } from "@/lib/utils";

type PerfumeHeroProps = {
  perfume: {
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

function MetricItem({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl border border-[#deceb9] bg-white/70 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a7763]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-[#1f1914]">{value ?? "-"} / 10</p>
    </div>
  );
}

export function PerfumeHero({ perfume, bestOffer }: PerfumeHeroProps) {
  const brandName = perfume.brand?.name?.trim() || "Unknown brand";
  const summary = getPerfumeShortText(perfume);

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
          <Badge>{formatGender(perfume.gender)}</Badge>
          <Badge variant="outline">{perfume.fragranceFamily}</Badge>
          {perfume.isArabic ? <Badge variant="soft">Arabic</Badge> : null}
          {perfume.isNiche ? <Badge variant="soft">Niche</Badge> : null}
          {perfume.ratingInternal ? (
            <Badge variant="outline">Rating {perfume.ratingInternal.toFixed(1)}</Badge>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <MetricItem label="Longevity" value={perfume.longevityScore} />
          <MetricItem label="Sillage" value={perfume.sillageScore} />
          <MetricItem label="Versatility" value={perfume.versatilityScore} />
        </div>

        <BestOfferCard bestOffer={bestOffer} showButton={false} className="bg-[#f7efe2]" />

        {bestOffer?.bestUrl ? (
          <Link
            href={bestOffer.bestUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonStyles({ className: "h-12 w-full sm:w-auto sm:px-6" })}
          >
            View offer
          </Link>
        ) : null}
      </div>
    </section>
  );
}

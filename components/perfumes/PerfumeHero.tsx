import Image from "next/image";

import { Badge } from "@/components/ui/Badge";
import { computeBestOffer, type OfferForPricing } from "@/lib/pricing";
import { formatCurrency, formatGender } from "@/lib/utils";

type PerfumeHeroProps = {
  perfume: {
    name: string;
    descriptionShort: string;
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
    offers: OfferForPricing[];
  };
};

function ScoreBlock({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl border border-[#ddcfbc] bg-[#fcf8f2] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.1em] text-[#8a7763]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#1f1914]">{value ?? "-"}/10</p>
    </div>
  );
}

export function PerfumeHero({ perfume }: PerfumeHeroProps) {
  const bestOffer = computeBestOffer(perfume.offers);

  return (
    <section className="grid gap-8 lg:grid-cols-[1.1fr_1.4fr]">
      <div className="relative h-[380px] overflow-hidden rounded-2xl border border-[#ddcfbc] bg-[#efe7dc] sm:h-[460px]">
        <Image
          src={perfume.imageUrl ?? "/images/perfume-placeholder.svg"}
          alt={perfume.name}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 40vw"
        />
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
            {perfume.brand.name}
          </p>
          <h1 className="mt-2 font-display text-4xl text-[#1f1914] sm:text-5xl">{perfume.name}</h1>
          <p className="mt-3 max-w-2xl text-sm text-[#5b4c3d]">{perfume.descriptionShort}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge>{formatGender(perfume.gender)}</Badge>
          <Badge variant="outline">{perfume.fragranceFamily}</Badge>
          {bestOffer ? (
            <Badge variant="outline">
              from {formatCurrency(bestOffer.bestPrice, bestOffer.bestCurrency)}
            </Badge>
          ) : null}
          {perfume.isArabic ? <Badge variant="soft">Arabic</Badge> : null}
          {perfume.isNiche ? <Badge variant="soft">Niche</Badge> : null}
          {perfume.ratingInternal ? (
            <Badge variant="outline">Internal Rating {perfume.ratingInternal.toFixed(1)}</Badge>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <ScoreBlock label="Longevity" value={perfume.longevityScore} />
          <ScoreBlock label="Sillage" value={perfume.sillageScore} />
          <ScoreBlock label="Versatility" value={perfume.versatilityScore} />
        </div>
      </div>
    </section>
  );
}

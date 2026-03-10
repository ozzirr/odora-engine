import Link from "next/link";

import { PerfumeImage } from "@/components/perfumes/PerfumeImage";
import { Badge } from "@/components/ui/Badge";
import { getPerfumeShortText } from "@/lib/perfume-text";
import { computeBestOffer, type OfferForPricing } from "@/lib/pricing";
import { formatCurrency, formatGender } from "@/lib/utils";

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
};

export function PerfumeCard({ perfume }: PerfumeCardProps) {
  const brandName = perfume.brand?.name?.trim() || "Unknown brand";
  const bestOffer = perfume.offers?.length ? computeBestOffer(perfume.offers) : null;
  const description = getPerfumeShortText(perfume);

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#e1d5c5] bg-white shadow-[0_20px_45px_-36px_rgba(50,35,20,0.4)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_52px_-34px_rgba(50,35,20,0.55)]">
      <Link href={`/perfumes/${perfume.slug}`}>
        <div className="relative h-56 w-full bg-[#efe7dc]">
          <PerfumeImage
            imageUrl={perfume.imageUrl}
            perfumeName={perfume.name}
            brandName={brandName}
            fragranceFamily={perfume.fragranceFamily}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            imageClassName="transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      </Link>

      <div className="space-y-3 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[#8a7763]">{brandName}</p>
          <Link href={`/perfumes/${perfume.slug}`}>
            <h3 className="mt-1 font-display text-2xl text-[#1f1914] transition-colors hover:text-[#6c5946]">
              {perfume.name}
            </h3>
          </Link>
          {description ? <p className="mt-2 text-sm text-[#5d4e3f]">{description}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{perfume.fragranceFamily}</Badge>
          <Badge>{formatGender(perfume.gender)}</Badge>
          {bestOffer ? (
            <Badge variant="default">
              from {formatCurrency(bestOffer.bestPrice, bestOffer.bestCurrency)}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-[#faf6ef]">
              View fragrance
            </Badge>
          )}
          {perfume.isArabic ? <Badge variant="soft">Arabic</Badge> : null}
          {perfume.isNiche ? <Badge variant="soft">Niche</Badge> : null}
        </div>
      </div>
    </article>
  );
}

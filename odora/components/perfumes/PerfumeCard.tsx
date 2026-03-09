import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatGender, formatPriceRange } from "@/lib/utils";

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
  offers?: Array<{
    priceAmount: number;
    currency: string;
  }>;
};

type PerfumeCardProps = {
  perfume: PerfumeCardItem;
};

export function PerfumeCard({ perfume }: PerfumeCardProps) {
  const bestOffer = perfume.offers?.[0];

  return (
    <article className="overflow-hidden rounded-2xl border border-[#e1d5c5] bg-white shadow-[0_20px_45px_-36px_rgba(50,35,20,0.4)]">
      <Link href={`/perfumes/${perfume.slug}`}>
        <div className="relative h-56 w-full bg-[#efe7dc]">
          <Image
            src={perfume.imageUrl ?? "/images/perfume-placeholder.svg"}
            alt={perfume.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
      </Link>

      <div className="space-y-3 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[#8a7763]">{perfume.brand.name}</p>
          <Link href={`/perfumes/${perfume.slug}`}>
            <h3 className="mt-1 font-display text-2xl text-[#1f1914] hover:text-[#6c5946]">
              {perfume.name}
            </h3>
          </Link>
          <p className="mt-2 text-sm text-[#5d4e3f]">{perfume.descriptionShort}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge>{formatGender(perfume.gender)}</Badge>
          <Badge variant="outline">{perfume.fragranceFamily}</Badge>
          <Badge variant="outline">{formatPriceRange(perfume.priceRange)}</Badge>
          {perfume.isArabic ? <Badge variant="soft">Arabic</Badge> : null}
          {perfume.isNiche ? <Badge variant="soft">Niche</Badge> : null}
        </div>

        {bestOffer ? (
          <p className="text-sm font-semibold text-[#2a2018]">
            From {formatCurrency(bestOffer.priceAmount, bestOffer.currency)}
          </p>
        ) : (
          <p className="text-sm text-[#7a6857]">Offers coming soon</p>
        )}
      </div>
    </article>
  );
}

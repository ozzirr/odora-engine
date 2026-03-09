import type { Metadata } from "next";

import { Container } from "@/components/layout/Container";
import { EditorialSection } from "@/components/top/EditorialSection";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { computeBestOffer } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Top Fragrances | Odora",
  description:
    "Explore Odora's curated top fragrances by Arabic style, niche quality, longevity, and value picks.",
};

export const dynamic = "force-dynamic";

async function getTopPageData() {
  if (!isDatabaseConfigured) {
    return [];
  }

  return prisma.perfume.findMany({
    include: {
      brand: true,
      offers: {
        include: {
          store: true,
        },
      },
    },
  });
}

export default async function TopPage() {
  const perfumes = await getTopPageData();

  const topArabic = perfumes
    .filter((perfume) => perfume.isArabic)
    .sort((a, b) => (b.ratingInternal ?? 0) - (a.ratingInternal ?? 0))
    .slice(0, 4);

  const topNiche = perfumes
    .filter((perfume) => perfume.isNiche)
    .sort((a, b) => (b.ratingInternal ?? 0) - (a.ratingInternal ?? 0))
    .slice(0, 4);

  const topLongLasting = perfumes
    .sort((a, b) => (b.longevityScore ?? 0) - (a.longevityScore ?? 0))
    .slice(0, 4);

  const priceCap = 100;
  const topValuePicks = perfumes
    .filter((perfume) => {
      const bestOffer = computeBestOffer(perfume.offers);
      return bestOffer != null && bestOffer.bestTotalPrice <= priceCap;
    })
    .sort((a, b) => {
      const aScore = a.ratingInternal ?? 0;
      const bScore = b.ratingInternal ?? 0;

      if (bScore !== aScore) {
        return bScore - aScore;
      }

      const aPrice = computeBestOffer(a.offers)?.bestTotalPrice ?? Number.POSITIVE_INFINITY;
      const bPrice = computeBestOffer(b.offers)?.bestTotalPrice ?? Number.POSITIVE_INFINITY;
      return aPrice - bPrice;
    })
    .slice(0, 4);

  return (
    <Container className="space-y-12 pt-14 pb-8">
      <div className="rounded-3xl border border-[#dfd1bf] bg-white p-8 sm:p-10">
        <SectionTitle
          eyebrow="Editorial"
          title="Curated fragrance rankings"
          subtitle="Odora highlights fragrances by style, performance, and value so you can discover faster without browsing the entire catalog."
        />
      </div>

      <EditorialSection
        eyebrow="Arabic"
        title="Top Arabic fragrances"
        subtitle="High-impact Arabic signatures with strong character and value."
        perfumes={topArabic}
      />

      <EditorialSection
        eyebrow="Niche"
        title="Best niche perfumes"
        subtitle="Distinctive niche compositions selected for quality and identity."
        perfumes={topNiche}
      />

      <EditorialSection
        eyebrow="Value"
        title={`Best perfumes under €${priceCap}`}
        subtitle="Curated picks that stay under the selected budget range while keeping strong profile quality."
        perfumes={topValuePicks}
      />

      <EditorialSection
        eyebrow="Performance"
        title="Best long-lasting fragrances"
        subtitle="Perfumes ranked by longevity performance for all-day and evening wear."
        perfumes={topLongLasting}
      />
    </Container>
  );
}

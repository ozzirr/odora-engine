import type { Metadata } from "next";

import { Container } from "@/components/layout/Container";
import { EditorialSection } from "@/components/top/EditorialSection";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  getCatalogVisibilityWhere,
  logCatalogQueryError,
  mergePerfumeWhere,
} from "@/lib/catalog";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { computeBestOffer } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Top Fragrances | Odora",
  description:
    "Explore Odora's curated fragrance rankings by style, performance, and value.",
};

export const dynamic = "force-dynamic";

async function getTopPageData() {
  if (!isDatabaseConfigured) {
    return [];
  }

  try {
    return await prisma.perfume.findMany({
      where: mergePerfumeWhere(undefined, getCatalogVisibilityWhere()),
      include: {
        brand: true,
        offers: {
          include: {
            store: true,
          },
        },
      },
    });
  } catch (error) {
    logCatalogQueryError("top:list", error);
    return [];
  }
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

  const topLongLasting = [...perfumes]
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
          subtitle="A sharper way to explore the catalog through standout picks for style, performance, and value."
        />
      </div>

      <EditorialSection
        eyebrow="Arabic"
        title="Top Arabic fragrances"
        subtitle="Bold Arabic signatures with presence, texture, and memorability."
        perfumes={topArabic}
      />

      <EditorialSection
        eyebrow="Niche"
        title="Best niche perfumes"
        subtitle="Distinctive compositions chosen for character, polish, and identity."
        perfumes={topNiche}
      />

      <EditorialSection
        eyebrow="Value"
        title={`Best perfumes under €${priceCap}`}
        subtitle="Smart buys that stay under budget without feeling compromise-driven."
        perfumes={topValuePicks}
      />

      <EditorialSection
        eyebrow="Performance"
        title="Best long-lasting fragrances"
        subtitle="Fragrances selected for the kind of staying power people actually notice."
        perfumes={topLongLasting}
      />
    </Container>
  );
}

import { PriceRange, PrismaClient } from "@prisma/client";

import { computeBestOffer, type OfferForPricing } from "@/lib/pricing";
import { mapPriceRangeFromAmount } from "@/lib/perfume-taxonomy";

type PerfumeOfferForSync = OfferForPricing & {
  id: number;
};

export type PriceSyncStats = {
  perfumesRead: number;
  perfumesWithOffers: number;
  priceRangesUpdated: number;
  bestOffersUpdated: number;
  skippedWithoutOffers: number;
};

export function computePriceRangeFromOffers(
  offers: PerfumeOfferForSync[] | null | undefined,
  fallback: PriceRange = PriceRange.MID,
) {
  const bestOffer = computeBestOffer(offers);
  if (!bestOffer) {
    return fallback;
  }

  return mapPriceRangeFromAmount(bestOffer.bestTotalPrice);
}

export async function syncPerfumePrices(params: {
  prisma: PrismaClient;
  dryRun: boolean;
}) {
  const stats: PriceSyncStats = {
    perfumesRead: 0,
    perfumesWithOffers: 0,
    priceRangesUpdated: 0,
    bestOffersUpdated: 0,
    skippedWithoutOffers: 0,
  };

  const perfumes = await params.prisma.perfume.findMany({
    select: {
      id: true,
      priceRange: true,
      offers: {
        select: {
          id: true,
          priceAmount: true,
          shippingCost: true,
          currency: true,
          availability: true,
          affiliateUrl: true,
          productUrl: true,
          lastCheckedAt: true,
          isBestPrice: true,
        },
      },
    },
  });

  stats.perfumesRead = perfumes.length;

  for (const perfume of perfumes) {
    if (perfume.offers.length === 0) {
      stats.skippedWithoutOffers += 1;
      continue;
    }

    stats.perfumesWithOffers += 1;
    const nextPriceRange = computePriceRangeFromOffers(perfume.offers, perfume.priceRange);
    const bestOffer = computeBestOffer(perfume.offers);
    const bestOfferId = bestOffer?.offer.id;
    const currentBestOfferId = perfume.offers.find((offer) => offer.isBestPrice)?.id;

    if (nextPriceRange !== perfume.priceRange) {
      stats.priceRangesUpdated += 1;
    }

    if (bestOfferId && bestOfferId !== currentBestOfferId) {
      stats.bestOffersUpdated += 1;
    }

    if (params.dryRun) {
      continue;
    }

    await params.prisma.$transaction(async (tx) => {
      if (nextPriceRange !== perfume.priceRange) {
        await tx.perfume.update({
          where: { id: perfume.id },
          data: { priceRange: nextPriceRange },
        });
      }

      if (bestOfferId) {
        await tx.offer.updateMany({
          where: { perfumeId: perfume.id },
          data: { isBestPrice: false },
        });

        await tx.offer.update({
          where: { id: bestOfferId },
          data: { isBestPrice: true },
        });
      }
    });
  }

  return stats;
}

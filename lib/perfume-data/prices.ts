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
  bestOfferSnapshotsUpdated: number;
  skippedWithoutOffers: number;
  updatedPerfumeSlugs: string[];
};

type BestOfferSnapshot = {
  bestPriceAmount: number | null;
  bestTotalPriceAmount: number | null;
  bestCurrency: string | null;
  bestStoreName: string | null;
  bestOfferUrl: string | null;
  bestOfferUpdatedAt: Date | null;
  hasAvailableOffer: boolean;
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

function buildBestOfferSnapshot(
  offers: PerfumeOfferForSync[] | null | undefined,
): BestOfferSnapshot {
  const bestOffer = computeBestOffer(offers);
  const hasAvailableOffer = Boolean(
    offers?.some((offer) => offer.availability && offer.availability !== "OUT_OF_STOCK"),
  );

  if (!bestOffer) {
    return {
      bestPriceAmount: null,
      bestTotalPriceAmount: null,
      bestCurrency: null,
      bestStoreName: null,
      bestOfferUrl: null,
      bestOfferUpdatedAt: null,
      hasAvailableOffer,
    };
  }

  return {
    bestPriceAmount: bestOffer.bestPrice,
    bestTotalPriceAmount: bestOffer.bestTotalPrice,
    bestCurrency: bestOffer.bestCurrency,
    bestStoreName: bestOffer.bestStore,
    bestOfferUrl: bestOffer.bestUrl,
    bestOfferUpdatedAt:
      bestOffer.offer.lastCheckedAt instanceof Date
        ? bestOffer.offer.lastCheckedAt
        : bestOffer.offer.lastCheckedAt
          ? new Date(bestOffer.offer.lastCheckedAt)
          : null,
    hasAvailableOffer,
  };
}

function hasBestOfferSnapshotChanged(
  current: {
    bestPriceAmount: number | null;
    bestTotalPriceAmount: number | null;
    bestCurrency: string | null;
    bestStoreName: string | null;
    bestOfferUrl: string | null;
    bestOfferUpdatedAt: Date | null;
    hasAvailableOffer: boolean;
  },
  next: BestOfferSnapshot,
) {
  return (
    current.bestPriceAmount !== next.bestPriceAmount ||
    current.bestTotalPriceAmount !== next.bestTotalPriceAmount ||
    current.bestCurrency !== next.bestCurrency ||
    current.bestStoreName !== next.bestStoreName ||
    current.bestOfferUrl !== next.bestOfferUrl ||
    current.hasAvailableOffer !== next.hasAvailableOffer ||
    (current.bestOfferUpdatedAt?.getTime() ?? null) !== (next.bestOfferUpdatedAt?.getTime() ?? null)
  );
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
    bestOfferSnapshotsUpdated: 0,
    skippedWithoutOffers: 0,
    updatedPerfumeSlugs: [],
  };
  const updatedPerfumeSlugs = new Set<string>();

  const perfumes = await params.prisma.perfume.findMany({
    select: {
      id: true,
      slug: true,
      priceRange: true,
      bestPriceAmount: true,
      bestTotalPriceAmount: true,
      bestCurrency: true,
      bestStoreName: true,
      bestOfferUrl: true,
      bestOfferUpdatedAt: true,
      hasAvailableOffer: true,
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
    const nextSnapshot = buildBestOfferSnapshot(perfume.offers);
    const snapshotChanged = hasBestOfferSnapshotChanged(
      {
        bestPriceAmount: perfume.bestPriceAmount,
        bestTotalPriceAmount: perfume.bestTotalPriceAmount,
        bestCurrency: perfume.bestCurrency,
        bestStoreName: perfume.bestStoreName,
        bestOfferUrl: perfume.bestOfferUrl,
        bestOfferUpdatedAt: perfume.bestOfferUpdatedAt,
        hasAvailableOffer: perfume.hasAvailableOffer,
      },
      nextSnapshot,
    );

    if (perfume.offers.length === 0) {
      stats.skippedWithoutOffers += 1;
      if (snapshotChanged) {
        stats.bestOfferSnapshotsUpdated += 1;
        updatedPerfumeSlugs.add(perfume.slug);
      }

      if (params.dryRun || !snapshotChanged) {
        continue;
      }

      await params.prisma.perfume.update({
        where: { id: perfume.id },
        data: nextSnapshot,
      });
      continue;
    }

    stats.perfumesWithOffers += 1;
    const nextPriceRange = computePriceRangeFromOffers(perfume.offers, perfume.priceRange);
    const bestOffer = computeBestOffer(perfume.offers);
    const bestOfferId = bestOffer?.offer.id;
    const currentBestOfferId = perfume.offers.find((offer) => offer.isBestPrice)?.id;

    if (nextPriceRange !== perfume.priceRange) {
      stats.priceRangesUpdated += 1;
      updatedPerfumeSlugs.add(perfume.slug);
    }

    if (bestOfferId && bestOfferId !== currentBestOfferId) {
      stats.bestOffersUpdated += 1;
      updatedPerfumeSlugs.add(perfume.slug);
    }

    if (snapshotChanged) {
      stats.bestOfferSnapshotsUpdated += 1;
      updatedPerfumeSlugs.add(perfume.slug);
    }

    if (params.dryRun) {
      continue;
    }

    await params.prisma.$transaction(async (tx) => {
      if (nextPriceRange !== perfume.priceRange) {
        await tx.perfume.update({
          where: { id: perfume.id },
          data: {
            priceRange: nextPriceRange,
            ...(snapshotChanged ? nextSnapshot : {}),
          },
        });
      } else if (snapshotChanged) {
        await tx.perfume.update({
          where: { id: perfume.id },
          data: nextSnapshot,
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
      } else if (currentBestOfferId) {
        await tx.offer.updateMany({
          where: { perfumeId: perfume.id },
          data: { isBestPrice: false },
        });
      }
    });
  }

  stats.updatedPerfumeSlugs = [...updatedPerfumeSlugs];

  return stats;
}

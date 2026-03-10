export type OfferForPricing = {
  id?: number;
  priceAmount: number;
  shippingCost?: number | null;
  currency: string;
  availability?: string;
  affiliateUrl?: string | null;
  productUrl?: string | null;
  lastCheckedAt?: Date | string | null;
  store?: {
    name: string;
  };
};

export type ComputedBestOffer<T extends OfferForPricing = OfferForPricing> = {
  bestStore: string | null;
  bestPrice: number;
  bestCurrency: string;
  bestTotalPrice: number;
  bestUrl: string | null;
  offer: T;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isSupportedCurrency(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z]{3}$/.test(value);
}

export function getOfferUrl(affiliateUrl?: string | null, productUrl?: string | null) {
  const candidates = [affiliateUrl, productUrl];

  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) {
      continue;
    }

    if (value.startsWith("/")) {
      return value;
    }

    try {
      const parsed = new URL(value);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return value;
      }
    } catch {
      // Ignore malformed URL and continue to the next candidate.
    }
  }

  return null;
}

export function formatAvailabilityLabel(value: string | undefined) {
  const availabilityLabel: Record<string, string> = {
    IN_STOCK: "In stock",
    LIMITED: "Limited",
    OUT_OF_STOCK: "Out of stock",
    PREORDER: "Preorder",
  };

  return availabilityLabel[value ?? ""] ?? "Check in store";
}

export function computeBestOffer<T extends OfferForPricing>(
  offers: T[] | null | undefined,
): ComputedBestOffer<T> | null {
  if (!Array.isArray(offers) || offers.length === 0) {
    return null;
  }

  const normalizedOffers = offers.filter((offer) => {
    return isFiniteNumber(offer.priceAmount) && isSupportedCurrency(offer.currency);
  });

  if (normalizedOffers.length === 0) {
    return null;
  }

  const availableOffers = normalizedOffers.filter((offer) => offer.availability !== "OUT_OF_STOCK");
  const candidates = availableOffers.length > 0 ? availableOffers : normalizedOffers;

  const bestOffer = candidates.reduce((currentBest, currentOffer) => {
    const bestTotal = currentBest.priceAmount + (currentBest.shippingCost ?? 0);
    const currentTotal = currentOffer.priceAmount + (currentOffer.shippingCost ?? 0);

    if (currentTotal < bestTotal) {
      return currentOffer;
    }

    if (currentTotal === bestTotal && currentOffer.priceAmount < currentBest.priceAmount) {
      return currentOffer;
    }

    return currentBest;
  });

  return {
    bestStore: bestOffer.store?.name ?? null,
    bestPrice: bestOffer.priceAmount,
    bestCurrency: bestOffer.currency,
    bestTotalPrice: bestOffer.priceAmount + (bestOffer.shippingCost ?? 0),
    bestUrl: getOfferUrl(bestOffer.affiliateUrl, bestOffer.productUrl),
    offer: bestOffer,
  };
}

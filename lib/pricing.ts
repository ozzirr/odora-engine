export type OfferForPricing = {
  id?: number;
  priceAmount: number;
  shippingCost?: number | null;
  currency: string;
  availability?: string;
  affiliateUrl?: string | null;
  productUrl?: string;
  store?: {
    name: string;
  };
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isSupportedCurrency(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z]{3}$/.test(value);
}

export function computeBestOffer<T extends OfferForPricing>(offers: T[] | null | undefined) {
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
    bestUrl: bestOffer.affiliateUrl ?? bestOffer.productUrl ?? null,
    offer: bestOffer,
  };
}

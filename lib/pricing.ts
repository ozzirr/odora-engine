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

export function computeBestOffer<T extends OfferForPricing>(offers: T[]) {
  if (offers.length === 0) {
    return null;
  }

  const availableOffers = offers.filter((offer) => offer.availability !== "OUT_OF_STOCK");
  const candidates = availableOffers.length > 0 ? availableOffers : offers;

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

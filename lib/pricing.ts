export type OfferForPricing = {
  id?: number;
  priceAmount: number;
  shippingCost?: number | null;
  currency: string;
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

export type BestOfferSummary = {
  bestStore: string | null;
  bestPrice: number;
  bestCurrency: string;
  bestTotalPrice: number;
  bestUrl: string | null;
  bestOfferUpdatedAt?: Date | string | null;
  hasAvailableOffer: boolean;
};

export type BestOfferSnapshotSource = Partial<{
  bestPriceAmount: number | null;
  bestTotalPriceAmount: number | null;
  bestCurrency: string | null;
  bestStoreName: string | null;
  bestOfferUrl: string | null;
  bestOfferUpdatedAt: Date | string | null;
  hasAvailableOffer: boolean | null;
}>;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isSupportedCurrency(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z]{3}$/.test(value);
}

const RETAILER_SEARCH_BUILDERS: Array<{
  matches: (hostname: string) => boolean;
  buildUrl: (query: string) => string;
}> = [
  {
    matches: (hostname) => hostname === "sephora.it" || hostname.endsWith(".sephora.it"),
    buildUrl: (query) => `https://www.sephora.it/cerca/?q=${encodeSearchQuery(query, "+")}`,
  },
  {
    matches: (hostname) => hostname === "notino.it" || hostname.endsWith(".notino.it"),
    buildUrl: (query) => `https://www.notino.it/search.asp?exps=${encodeSearchQuery(query, "%20")}`,
  },
  {
    matches: (hostname) => hostname === "douglas.it" || hostname.endsWith(".douglas.it"),
    buildUrl: (query) => `https://www.douglas.it/it/search?q=${encodeSearchQuery(query, "%20")}`,
  },
];

const SEARCH_PARAM_NAMES = ["q", "exps", "k", "query", "search"];
const IGNORED_RETAILER_PATH_SEGMENTS = new Set([
  "it",
  "p",
  "product",
  "products",
  "profumo",
  "profumi",
  "fragranze",
  "fragrance",
  "fragrances",
]);

function encodeSearchQuery(query: string, spaceEncoding: "+" | "%20") {
  return encodeURIComponent(query).replace(/%20/g, spaceEncoding);
}

function normalizeSearchQuery(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/&/g, " ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getQueryFromRetailerUrl(url: URL) {
  for (const paramName of SEARCH_PARAM_NAMES) {
    const value = url.searchParams.get(paramName);
    const normalized = value ? normalizeSearchQuery(value) : "";
    if (normalized) {
      return normalized;
    }
  }

  const segments = url.pathname
    .split("/")
    .map((segment) => normalizeSearchQuery(decodeURIComponent(segment)))
    .filter((segment) => segment && !IGNORED_RETAILER_PATH_SEGMENTS.has(segment));

  const lastSegment = segments.at(-1);
  const previousTokens = new Set(segments.slice(0, -1).flatMap((segment) => segment.split(" ")));
  if (lastSegment && lastSegment.split(" ").some((token) => previousTokens.has(token))) {
    return lastSegment;
  }

  return normalizeSearchQuery(segments.join(" "));
}

function getRetailerSearchUrl(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    const hostname = parsed.hostname.toLowerCase();
    const retailer = RETAILER_SEARCH_BUILDERS.find((builder) => builder.matches(hostname));
    if (!retailer) {
      return null;
    }

    const query = getQueryFromRetailerUrl(parsed);
    if (!query) {
      return null;
    }

    return retailer.buildUrl(query);
  } catch {
    return null;
  }
}

export function getOfferUrl(affiliateUrl?: string | null, productUrl?: string | null) {
  const retailerSearchUrl = getRetailerSearchUrl(productUrl) ?? getRetailerSearchUrl(affiliateUrl);
  if (retailerSearchUrl) {
    return retailerSearchUrl;
  }

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

  const bestOffer = normalizedOffers.reduce((currentBest, currentOffer) => {
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

export function getBestOfferSummary(
  source: BestOfferSnapshotSource | null | undefined,
): BestOfferSummary | null {
  if (
    !source ||
    !isFiniteNumber(source.bestPriceAmount) ||
    !isFiniteNumber(source.bestTotalPriceAmount) ||
    !isSupportedCurrency(source.bestCurrency)
  ) {
    return null;
  }

  return {
    bestStore: source.bestStoreName?.trim() || null,
    bestPrice: source.bestPriceAmount,
    bestCurrency: source.bestCurrency,
    bestTotalPrice: source.bestTotalPriceAmount,
    bestUrl: getOfferUrl(source.bestOfferUrl),
    bestOfferUpdatedAt: source.bestOfferUpdatedAt ?? null,
    hasAvailableOffer: Boolean(source.hasAvailableOffer),
  };
}

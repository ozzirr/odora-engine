import type { Prisma } from "@prisma/client";

import type { PerfumeCardItem } from "@/components/perfumes/PerfumeCard";
import { computeBestOffer } from "@/lib/pricing";

export const homepagePerfumeInclude = {
  brand: true,
  offers: {
    select: {
      id: true,
      priceAmount: true,
      currency: true,
      shippingCost: true,
      availability: true,
      affiliateUrl: true,
      productUrl: true,
      lastCheckedAt: true,
      store: {
        select: {
          name: true,
        },
      },
    },
  },
} satisfies Prisma.PerfumeInclude;

export type HomePerfumeRecord = Prisma.PerfumeGetPayload<{
  include: typeof homepagePerfumeInclude;
}>;

export type HomePerfumeSpotlight = {
  href: string;
  name: string;
  brandName: string;
  imageUrl: string | null;
  fragranceFamily: string;
  bestPrice: number | null;
  currency: string | null;
  storeName: string | null;
  badge: string;
};

const TRENDING_FLAG_KEYS = ["homepageTrending", "isTrending"] as const;
const HERO_FLAG_KEYS = ["featuredHero", "homepageHero"] as const;

function readBooleanFlag(perfume: HomePerfumeRecord, keys: readonly string[]) {
  const rawPerfume = perfume as Record<string, unknown>;
  return keys.some((key) => rawPerfume[key] === true);
}

function getBestOffer(perfume: HomePerfumeRecord) {
  return perfume.offers?.length ? computeBestOffer(perfume.offers) : null;
}

function hasNamedOfferStore(perfume: HomePerfumeRecord) {
  return perfume.offers.some((offer) => Boolean(offer.store?.name));
}

function sortByHomepagePriority(left: HomePerfumeRecord, right: HomePerfumeRecord) {
  const leftHasOffer = getBestOffer(left) ? 1 : 0;
  const rightHasOffer = getBestOffer(right) ? 1 : 0;

  if (rightHasOffer !== leftHasOffer) {
    return rightHasOffer - leftHasOffer;
  }

  const leftRating = left.ratingInternal ?? 0;
  const rightRating = right.ratingInternal ?? 0;

  if (rightRating !== leftRating) {
    return rightRating - leftRating;
  }

  if (right.updatedAt.getTime() !== left.updatedAt.getTime()) {
    return right.updatedAt.getTime() - left.updatedAt.getTime();
  }

  return left.name.localeCompare(right.name);
}

function dedupePerfumes(perfumes: HomePerfumeRecord[]) {
  const seen = new Set<number>();
  return perfumes.filter((perfume) => {
    if (seen.has(perfume.id)) {
      return false;
    }

    seen.add(perfume.id);
    return true;
  });
}

export function isTrendingPerfume(perfume: HomePerfumeRecord) {
  return readBooleanFlag(perfume, TRENDING_FLAG_KEYS);
}

export function selectTrendingPerfumes(perfumes: HomePerfumeRecord[], count = 4) {
  return dedupePerfumes(
    perfumes.filter((perfume) => isTrendingPerfume(perfume)).sort(sortByHomepagePriority),
  ).slice(0, count);
}

export function selectHeroPerfume(
  perfumes: HomePerfumeRecord[],
  trendingPerfumes: HomePerfumeRecord[],
  featuredPerfumes: HomePerfumeRecord[],
) {
  // These dynamic lookups are intentionally string-based so the homepage can
  // start honoring future schema flags such as `featuredHero` or
  // `homepageTrending` as soon as they exist on Perfume.
  const flaggedHero = [...perfumes]
    .filter((perfume) => readBooleanFlag(perfume, HERO_FLAG_KEYS))
    .sort(sortByHomepagePriority)[0];

  if (flaggedHero) {
    return flaggedHero;
  }

  const trendingHero = [...trendingPerfumes].sort(sortByHomepagePriority)[0];
  if (trendingHero) {
    return trendingHero;
  }

  const featuredHero = [...featuredPerfumes].sort(sortByHomepagePriority)[0];
  if (featuredHero) {
    return featuredHero;
  }

  return [...perfumes].sort(sortByHomepagePriority)[0] ?? null;
}

export function selectTrustedStores(perfumes: HomePerfumeRecord[], count = 4) {
  const counts = new Map<string, number>();

  for (const perfume of perfumes) {
    for (const offer of perfume.offers) {
      const rawName = offer.store?.name?.trim();
      if (!rawName) {
        continue;
      }

      const normalizedName = rawName.replace(/\s+italia$/i, "");
      counts.set(normalizedName, (counts.get(normalizedName) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, count)
    .map(([name]) => name);
}

export function toHomeSpotlight(perfume: HomePerfumeRecord, badge = "Best deal"): HomePerfumeSpotlight {
  const bestOffer = getBestOffer(perfume);

  return {
    href: `/perfumes/${perfume.slug}`,
    name: perfume.name,
    brandName: perfume.brand.name,
    imageUrl: perfume.imageUrl,
    fragranceFamily: perfume.fragranceFamily,
    bestPrice: bestOffer?.bestPrice ?? null,
    currency: bestOffer?.bestCurrency ?? null,
    storeName: bestOffer?.bestStore ?? null,
    badge,
  };
}

export function toPerfumeCardItem(perfume: HomePerfumeRecord): PerfumeCardItem {
  return {
    id: perfume.id,
    slug: perfume.slug,
    name: perfume.name,
    descriptionShort: perfume.descriptionShort,
    imageUrl: perfume.imageUrl,
    gender: perfume.gender,
    fragranceFamily: perfume.fragranceFamily,
    priceRange: perfume.priceRange,
    isArabic: perfume.isArabic,
    isNiche: perfume.isNiche,
    brand: perfume.brand,
    offers: perfume.offers,
  };
}

export function sortFeaturedPerfumes(perfumes: HomePerfumeRecord[]) {
  return [...perfumes].sort(sortByHomepagePriority);
}

export function excludePerfumes(
  perfumes: HomePerfumeRecord[],
  excludedPerfumes: HomePerfumeRecord[],
) {
  const excludedIds = new Set(excludedPerfumes.map((perfume) => perfume.id));
  return perfumes.filter((perfume) => !excludedIds.has(perfume.id));
}

export function hasOfferData(perfume: HomePerfumeRecord) {
  return Boolean(getBestOffer(perfume));
}

export function hasStoreCoverage(perfume: HomePerfumeRecord) {
  return hasNamedOfferStore(perfume);
}

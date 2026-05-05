import {
  HomepageCollectionType,
  HomepageSection,
  type Prisma,
} from "@prisma/client";
import { unstable_cache } from "next/cache";

import type { PerfumeCardItem } from "@/components/perfumes/PerfumeCard";
import { PUBLIC_CACHE_TAGS } from "@/lib/cache-tags";
import { DEPLOY_ID } from "@/lib/deploy-id";
import { getCuratedBrandLogoUrl } from "@/lib/brand-logos";
import {
  getCatalogVisibilityWhereForMode,
  logCatalogQueryError,
  resolveCatalogMode,
  type CatalogMode,
} from "@/lib/catalog";
import { getPerfumeShortText } from "@/lib/perfume-text";
import { getBestOfferSummary } from "@/lib/pricing";
import { isDatabaseConfigured, prisma, runPrismaOperations, withDatabaseRetry } from "@/lib/prisma";
import { finderPresets, type FinderPresetQuery } from "@/lib/finder-presets";

export type QuickFilterIllustration =
  | "vanilla"
  | "fresh"
  | "oud"
  | "musk"
  | "rose"
  | "citrus";

export type HomeSpotlightBadgeKey = "heroPick" | "trending" | "spotlight";
export type HomepageMoodCardId =
  | "vanillaLovers"
  | "freshDaily"
  | "arabicSignature"
  | "officeSafe"
  | "dateNight"
  | "summerCitrus";
export type HomepageMoodCardToneKey =
  | "warm"
  | "clean"
  | "bold"
  | "balanced"
  | "magnetic"
  | "bright";

export type HomepageMoodCard = {
  id: HomepageMoodCardId;
  toneKey: HomepageMoodCardToneKey;
  gradientClass: string;
  illustration: QuickFilterIllustration;
  preset: FinderPresetQuery;
  href: string;
};

export type HomeCollectionCard = {
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  href: string;
  type: HomepageCollectionType;
};

export const homepagePerfumeInclude = {
  brand: true,
  notes: {
    select: {
      intensity: true,
      note: {
        select: {
          name: true,
          slug: true,
          noteType: true,
        },
      },
    },
    orderBy: [{ intensity: "desc" }, { id: "asc" }],
    take: 6,
  },
  moods: {
    select: {
      weight: true,
      mood: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    orderBy: [{ weight: "desc" }, { id: "asc" }],
    take: 4,
  },
  occasions: {
    select: {
      weight: true,
      occasion: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    orderBy: [{ weight: "desc" }, { id: "asc" }],
    take: 3,
  },
} satisfies Prisma.PerfumeInclude;

const homepagePlacementInclude = {
  perfume: {
    include: homepagePerfumeInclude,
  },
} satisfies Prisma.PerfumeHomepagePlacementInclude;

const homepageCollectionSelect = {
  title: true,
  slug: true,
  subtitle: true,
  description: true,
  href: true,
  type: true,
} satisfies Prisma.HomepageCollectionSelect;

export type HomePerfumeRecord = Prisma.PerfumeGetPayload<{
  include: typeof homepagePerfumeInclude;
}>;

type HomePlacementRecord = Prisma.PerfumeHomepagePlacementGetPayload<{
  include: typeof homepagePlacementInclude;
}>;

type HomeCollectionRecord = Prisma.HomepageCollectionGetPayload<{
  select: typeof homepageCollectionSelect;
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
  badgeKey: HomeSpotlightBadgeKey;
  hasOffer: boolean;
  isArabic: boolean;
  isNiche: boolean;
};

export type HomepageData = {
  hero: HomePerfumeRecord | null;
  heroSpotlights: HomePerfumeRecord[];
  trending: HomePerfumeRecord[];
  featured: HomePerfumeRecord[];
  collections: HomeCollectionCard[];
  featuredBrands: string[];
};

function getEmptyHomepageData(): HomepageData {
  return {
    hero: null,
    heroSpotlights: [],
    trending: [],
    featured: [],
    collections: [],
    featuredBrands: [],
  };
}

const homepageMoodCardConfig = [
  {
    id: "vanillaLovers" as const,
    toneKey: "warm" as const,
    gradientClass: "from-[#f7eddc] via-[#f2e7d4] to-[#eadcc7]",
    illustration: "vanilla" as const,
    preset: finderPresets["Vanilla Lovers"],
  },
  {
    id: "freshDaily" as const,
    toneKey: "clean" as const,
    gradientClass: "from-[#edf6f2] via-[#e2f1ee] to-[#d7ece8]",
    illustration: "fresh" as const,
    preset: finderPresets["Fresh Daily"],
  },
  {
    id: "arabicSignature" as const,
    toneKey: "bold" as const,
    gradientClass: "from-[#efe5d9] via-[#ead8c6] to-[#dfc5ac]",
    illustration: "oud" as const,
    preset: finderPresets["Arabic Signature"],
  },
  {
    id: "officeSafe" as const,
    toneKey: "balanced" as const,
    gradientClass: "from-[#f5f1ea] via-[#efe9df] to-[#e7dfd4]",
    illustration: "musk" as const,
    preset: finderPresets["Office Safe"],
  },
  {
    id: "dateNight" as const,
    toneKey: "magnetic" as const,
    gradientClass: "from-[#efe3e0] via-[#ead8d6] to-[#ddc3c0]",
    illustration: "rose" as const,
    preset: finderPresets["Date Night"],
  },
  {
    id: "summerCitrus" as const,
    toneKey: "bright" as const,
    gradientClass: "from-[#f7efdc] via-[#f4e4b8] to-[#edd49a]",
    illustration: "citrus" as const,
    preset: finderPresets["Summer Citrus"],
  },
] satisfies Array<Omit<HomepageMoodCard, "href">>;

function buildFinderHref(preset: FinderPresetQuery) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(preset)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `/finder?${query}` : "/finder";
}

export const homepageMoodCards: HomepageMoodCard[] = homepageMoodCardConfig.map((card) => ({
  ...card,
  href: buildFinderHref(card.preset),
}));

function compareHomepagePerfumes(left: HomePerfumeRecord, right: HomePerfumeRecord) {
  const leftHasOffer = left.hasAvailableOffer ? 1 : 0;
  const rightHasOffer = right.hasAvailableOffer ? 1 : 0;

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

function compareHomepagePlacements(left: HomePlacementRecord, right: HomePlacementRecord) {
  if (left.priority !== right.priority) {
    return left.priority - right.priority;
  }

  return compareHomepagePerfumes(left.perfume, right.perfume);
}

function toUniquePerfumes(perfumes: HomePerfumeRecord[]) {
  const seen = new Set<number>();

  return perfumes.filter((perfume) => {
    if (seen.has(perfume.id)) {
      return false;
    }

    seen.add(perfume.id);
    return true;
  });
}

async function getHomepageSectionPerfumes(
  section: HomepageSection,
  take: number | undefined,
  catalogMode: CatalogMode,
): Promise<HomePerfumeRecord[]> {
  const visibilityWhere = getCatalogVisibilityWhereForMode(catalogMode);

  const placements = (await prisma.perfumeHomepagePlacement.findMany({
    where: {
      section,
      ...(visibilityWhere
        ? {
            perfume: {
              is: visibilityWhere,
            },
          }
        : {}),
    },
    include: homepagePlacementInclude,
    orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
    ...(take ? { take } : {}),
  })) as HomePlacementRecord[];

  return toUniquePerfumes(
    placements.sort(compareHomepagePlacements).map((placement) => placement.perfume),
  );
}

async function getHomepageFallbackPerfumes(
  take: number,
  catalogMode: CatalogMode,
): Promise<HomePerfumeRecord[]> {
  const visibilityWhere = getCatalogVisibilityWhereForMode(catalogMode);

  return (await prisma.perfume.findMany({
    where: visibilityWhere ?? undefined,
    include: homepagePerfumeInclude,
    orderBy: [
      { hasAvailableOffer: "desc" },
      { ratingInternal: "desc" },
      { updatedAt: "desc" },
      { name: "asc" },
    ],
    take,
  })) as HomePerfumeRecord[];
}

function minimizeDuplicates(
  perfumes: HomePerfumeRecord[],
  excludedIds: Set<number>,
  desiredCount?: number,
) {
  const unique = toUniquePerfumes(perfumes);
  const withoutOverlap = unique.filter((perfume) => !excludedIds.has(perfume.id));

  if (!desiredCount) {
    return withoutOverlap.length > 0 ? withoutOverlap : unique;
  }

  if (withoutOverlap.length >= desiredCount) {
    return withoutOverlap.slice(0, desiredCount);
  }

  const fallback = [...withoutOverlap];

  for (const perfume of unique) {
    if (fallback.some((item) => item.id === perfume.id)) {
      continue;
    }
    fallback.push(perfume);
    if (fallback.length >= desiredCount) {
      break;
    }
  }

  return fallback.slice(0, desiredCount);
}

function diversifyByFragranceFamily(
  perfumes: HomePerfumeRecord[],
  desiredCount: number,
  maxPerFamily = 2,
) {
  const selected: HomePerfumeRecord[] = [];
  const familyCounts = new Map<string, number>();

  for (const perfume of perfumes) {
    const familyKey = (perfume.fragranceFamily || "").trim().toLowerCase();
    const currentCount = familyCounts.get(familyKey) ?? 0;

    if (currentCount >= maxPerFamily) {
      continue;
    }

    selected.push(perfume);
    familyCounts.set(familyKey, currentCount + 1);

    if (selected.length >= desiredCount) {
      return selected;
    }
  }

  for (const perfume of perfumes) {
    if (selected.some((item) => item.id === perfume.id)) {
      continue;
    }

    selected.push(perfume);

    if (selected.length >= desiredCount) {
      break;
    }
  }

  return selected.slice(0, desiredCount);
}

function toCollectionCard(collection: HomeCollectionRecord): HomeCollectionCard {
  return {
    title: collection.title,
    slug: collection.slug,
    subtitle: collection.subtitle,
    description: collection.description,
    href: collection.href,
    type: collection.type,
  };
}

export async function getHomepageData(): Promise<HomepageData> {
  const catalogMode = resolveCatalogMode();

  if (process.env.NODE_ENV === "development") {
    return getHomepageDataUncached(catalogMode);
  }

  return unstable_cache(
    async () => withDatabaseRetry(() => getHomepageDataUncached(catalogMode)),
    [DEPLOY_ID, "homepage-data", catalogMode],
    {
      revalidate: 3600,
      tags: [PUBLIC_CACHE_TAGS.catalog, PUBLIC_CACHE_TAGS.homepage],
    },
  )();
}

async function getHomepageDataUncached(catalogMode: CatalogMode): Promise<HomepageData> {
  if (!isDatabaseConfigured) {
    return getEmptyHomepageData();
  }

  try {
    const [heroCandidates, trendingCandidates, featuredCandidates, fallbackCandidates, collections, featuredBrands] =
      await runPrismaOperations([
        () => getHomepageSectionPerfumes(HomepageSection.HERO, 4, catalogMode),
        () => getHomepageSectionPerfumes(HomepageSection.TRENDING, 8, catalogMode),
        () => getHomepageSectionPerfumes(HomepageSection.FEATURED, 12, catalogMode),
        () => getHomepageFallbackPerfumes(24, catalogMode),
        () =>
          prisma.homepageCollection.findMany({
            where: {
              isHomepageVisible: true,
            },
            select: homepageCollectionSelect,
            orderBy: [{ homepagePriority: "asc" }, { title: "asc" }],
            take: 6,
          }),
        () => getFeaturedBrandNames(20, catalogMode),
      ]);

    const heroSpotlights = toUniquePerfumes([
      ...heroCandidates,
      ...trendingCandidates,
      ...featuredCandidates,
      ...fallbackCandidates,
    ]).slice(0, 4);

    const hero =
      heroCandidates[0] ??
      trendingCandidates[0] ??
      featuredCandidates[0] ??
      fallbackCandidates[0] ??
      heroSpotlights[0] ??
      null;
    const excludedHeroIds = new Set<number>(hero ? [hero.id] : []);
    const trending = minimizeDuplicates(
      [...trendingCandidates, ...fallbackCandidates],
      excludedHeroIds,
      3,
    );
    const excludedFeaturedIds = new Set<number>(excludedHeroIds);
    const featuredCandidatesWithoutOverlap = minimizeDuplicates(
      [...featuredCandidates, ...fallbackCandidates],
      excludedFeaturedIds,
    );
    const featured = diversifyByFragranceFamily(featuredCandidatesWithoutOverlap, 6, 2);
    return {
      hero,
      heroSpotlights,
      trending,
      featured,
      collections: collections.map(toCollectionCard),
      featuredBrands,
    };
  } catch (error) {
    logCatalogQueryError("home:homepage", error);
    return getEmptyHomepageData();
  }
}

export async function getPopularPerfumeSlugs(limit = 24): Promise<string[]> {
  const catalogMode = resolveCatalogMode();

  return unstable_cache(
    async () => withDatabaseRetry(() => getPopularPerfumeSlugsUncached(catalogMode, limit)),
    [DEPLOY_ID, "popular-perfume-slugs", catalogMode, String(limit)],
    {
      revalidate: 3600,
      tags: [PUBLIC_CACHE_TAGS.catalog, PUBLIC_CACHE_TAGS.perfumeDetail],
    },
  )();
}

async function getPopularPerfumeSlugsUncached(
  catalogMode: CatalogMode,
  limit: number,
): Promise<string[]> {
  if (!isDatabaseConfigured) {
    return [];
  }

  const visibilityWhere = getCatalogVisibilityWhereForMode(catalogMode);

  try {
    const take = Math.max(limit, 12);
    const [homepagePlacements, topRatedPerfumes] = await runPrismaOperations([
      () =>
        prisma.perfumeHomepagePlacement.findMany({
          where: visibilityWhere
            ? {
                perfume: {
                  is: visibilityWhere,
                },
              }
            : undefined,
          select: {
            perfume: {
              select: {
                slug: true,
              },
            },
          },
          orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
          take,
        }),
      () =>
        prisma.perfume.findMany({
          where: {
            ...(visibilityWhere ?? {}),
            ratingInternal: {
              not: null,
            },
          },
          select: {
            slug: true,
          },
          orderBy: [{ ratingInternal: "desc" }, { updatedAt: "desc" }, { name: "asc" }],
          take,
        }),
    ]);

    const dedupedSlugs = new Set<string>();

    for (const record of homepagePlacements) {
      if (record.perfume.slug) {
        dedupedSlugs.add(record.perfume.slug);
      }
      if (dedupedSlugs.size >= limit) {
        break;
      }
    }

    for (const perfume of topRatedPerfumes) {
      dedupedSlugs.add(perfume.slug);
      if (dedupedSlugs.size >= limit) {
        break;
      }
    }

    return [...dedupedSlugs];
  } catch (error) {
    logCatalogQueryError("home:popular-slugs", error);
    return [];
  }
}

const FALLBACK_FEATURED_BRANDS = [
  "Dior",
  "Chanel",
  "Tom Ford",
  "Yves Saint Laurent",
  "Giorgio Armani",
  "Maison Francis Kurkdjian",
  "Xerjoff",
  "Creed",
  "Kilian Paris",
  "Initio",
  "Parfums de Marly",
  "Louis Vuitton",
  "Prada",
  "Versace",
  "Givenchy",
  "Gucci",
  "Hermes",
  "Byredo",
  "Le Labo",
  "Nasomatto",
];

async function getFeaturedBrandNames(limit: number, catalogMode: CatalogMode) {
  const visibilityWhere = getCatalogVisibilityWhereForMode(catalogMode);

  const brands = await prisma.brand.findMany({
    where: visibilityWhere
      ? {
          perfumes: {
            some: visibilityWhere,
          },
        }
      : undefined,
    select: {
      name: true,
      _count: {
        select: {
          perfumes: true,
        },
      },
    },
    orderBy: [{ perfumes: { _count: "desc" } }, { name: "asc" }],
    take: limit,
  });

  const names = brands
    .map((brand) => brand.name.trim())
    .filter(Boolean)
    .filter((name) => getCuratedBrandLogoUrl(name))
    .filter((name, index, array) => array.indexOf(name) === index);

  if (names.length >= Math.min(limit, 6)) {
    return names.slice(0, limit);
  }

  const fallbackNames = FALLBACK_FEATURED_BRANDS.filter((name) => getCuratedBrandLogoUrl(name));
  const mergedNames = [...names];

  for (const fallbackName of fallbackNames) {
    if (!mergedNames.includes(fallbackName)) {
      mergedNames.push(fallbackName);
    }

    if (mergedNames.length >= limit) {
      break;
    }
  }

  return mergedNames;
}

export function toHomeSpotlight(
  perfume: HomePerfumeRecord,
  badgeKey: HomeSpotlightBadgeKey,
): HomePerfumeSpotlight {
  const bestOffer = getBestOfferSummary(perfume);

  return {
    href: `/perfumes/${perfume.slug}`,
    name: perfume.name,
    brandName: perfume.brand.name,
    imageUrl: perfume.imageUrl,
    fragranceFamily: perfume.fragranceFamily,
    bestPrice: bestOffer?.bestPrice ?? null,
    currency: bestOffer?.bestCurrency ?? null,
    storeName: bestOffer?.bestStore ?? null,
    badgeKey,
    hasOffer: bestOffer != null,
    isArabic: perfume.isArabic,
    isNiche: perfume.isNiche,
  };
}

export function toPerfumeCardItem(perfume: HomePerfumeRecord): PerfumeCardItem {
  return {
    id: perfume.id,
    slug: perfume.slug,
    name: perfume.name,
    descriptionShort: getPerfumeShortText(perfume),
    imageUrl: perfume.imageUrl,
    gender: perfume.gender,
    fragranceFamily: perfume.fragranceFamily,
    priceRange: perfume.priceRange,
    isArabic: perfume.isArabic,
    isNiche: perfume.isNiche,
    brand: perfume.brand,
    bestPriceAmount: perfume.bestPriceAmount,
    bestTotalPriceAmount: perfume.bestTotalPriceAmount,
    bestCurrency: perfume.bestCurrency,
    bestStoreName: perfume.bestStoreName,
    bestOfferUrl: perfume.bestOfferUrl,
    bestOfferUpdatedAt: perfume.bestOfferUpdatedAt,
    hasAvailableOffer: perfume.hasAvailableOffer,
    notes: perfume.notes,
  };
}

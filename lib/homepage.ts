import {
  HomepageCollectionType,
  HomepageSection,
  type Prisma,
} from "@prisma/client";

import type { PerfumeCardItem } from "@/components/perfumes/PerfumeCard";
import { getCatalogVisibilityWhere, logCatalogQueryError } from "@/lib/catalog";
import { getPerfumeShortText } from "@/lib/perfume-text";
import { computeBestOffer } from "@/lib/pricing";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

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

type FinderPresetQuery = Partial<{
  preset: string;
  gender: string;
  mood: string;
  season: string;
  occasion: string;
  budget: string;
  preferredNote: string;
  arabicOnly: "true";
  nicheOnly: "true";
}>;

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
};

export type HomepageData = {
  hero: HomePerfumeRecord | null;
  heroSpotlights: HomePerfumeRecord[];
  trending: HomePerfumeRecord[];
  featured: HomePerfumeRecord[];
  collections: HomeCollectionCard[];
  trustedStores: string[];
};

const homepageMoodCardConfig = [
  {
    id: "vanillaLovers" as const,
    toneKey: "warm" as const,
    gradientClass: "from-[#f7eddc] via-[#f2e7d4] to-[#eadcc7]",
    illustration: "vanilla" as const,
    preset: {
      preset: "Vanilla Lovers",
      mood: "cozy",
      preferredNote: "vanilla",
    },
  },
  {
    id: "freshDaily" as const,
    toneKey: "clean" as const,
    gradientClass: "from-[#edf6f2] via-[#e2f1ee] to-[#d7ece8]",
    illustration: "fresh" as const,
    preset: {
      preset: "Fresh Daily",
      mood: "fresh",
      occasion: "daily-wear",
      preferredNote: "bergamot",
    },
  },
  {
    id: "arabicSignature" as const,
    toneKey: "bold" as const,
    gradientClass: "from-[#efe5d9] via-[#ead8c6] to-[#dfc5ac]",
    illustration: "oud" as const,
    preset: {
      preset: "Arabic Signature",
      mood: "bold",
      preferredNote: "oud",
      arabicOnly: "true",
    },
  },
  {
    id: "officeSafe" as const,
    toneKey: "balanced" as const,
    gradientClass: "from-[#f5f1ea] via-[#efe9df] to-[#e7dfd4]",
    illustration: "musk" as const,
    preset: {
      preset: "Office Safe",
      mood: "elegant",
      occasion: "office",
      preferredNote: "musk",
    },
  },
  {
    id: "dateNight" as const,
    toneKey: "magnetic" as const,
    gradientClass: "from-[#efe3e0] via-[#ead8d6] to-[#ddc3c0]",
    illustration: "rose" as const,
    preset: {
      preset: "Date Night",
      mood: "romantic",
      occasion: "date-night",
      preferredNote: "amber",
    },
  },
  {
    id: "summerCitrus" as const,
    toneKey: "bright" as const,
    gradientClass: "from-[#f7efdc] via-[#f4e4b8] to-[#edd49a]",
    illustration: "citrus" as const,
    preset: {
      preset: "Summer Citrus",
      mood: "fresh",
      season: "summer",
      preferredNote: "bergamot",
    },
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
  const leftHasOffer = computeBestOffer(left.offers) ? 1 : 0;
  const rightHasOffer = computeBestOffer(right.offers) ? 1 : 0;

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
): Promise<HomePerfumeRecord[]> {
  const visibilityWhere = getCatalogVisibilityWhere();

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
  if (!isDatabaseConfigured) {
    return {
      hero: null,
      heroSpotlights: [],
      trending: [],
      featured: [],
      collections: [],
      trustedStores: [],
    };
  }

  try {
    const [heroCandidates, trendingCandidates, featuredCandidates, collections] = await Promise.all([
      getHomepageSectionPerfumes(HomepageSection.HERO, 4),
      getHomepageSectionPerfumes(HomepageSection.TRENDING, 8),
      getHomepageSectionPerfumes(HomepageSection.FEATURED, 12),
      prisma.homepageCollection.findMany({
        where: {
          isHomepageVisible: true,
        },
        select: homepageCollectionSelect,
        orderBy: [{ homepagePriority: "asc" }, { title: "asc" }],
        take: 6,
      }),
    ]);

    const heroSpotlights = toUniquePerfumes([
      ...heroCandidates,
      ...trendingCandidates,
      ...featuredCandidates,
    ]).slice(0, 4);

    const hero = heroSpotlights[0] ?? null;
    const excludedHeroIds = new Set<number>(heroSpotlights.map((perfume) => perfume.id));
    const trending = minimizeDuplicates(trendingCandidates, excludedHeroIds, 4);
    const excludedFeaturedIds = new Set<number>([
      ...excludedHeroIds,
      ...trending.map((perfume) => perfume.id),
    ]);
    const featured = minimizeDuplicates(featuredCandidates, excludedFeaturedIds);
    const trustedStores = selectTrustedStores(
      toUniquePerfumes([...heroSpotlights, ...trending, ...featured]),
      4,
    );

    return {
      hero,
      heroSpotlights,
      trending,
      featured,
      collections: collections.map(toCollectionCard),
      trustedStores,
    };
  } catch (error) {
    logCatalogQueryError("home:homepage", error);

    return {
      hero: null,
      heroSpotlights: [],
      trending: [],
      featured: [],
      collections: [],
      trustedStores: [],
    };
  }
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

export function toHomeSpotlight(
  perfume: HomePerfumeRecord,
  badgeKey: HomeSpotlightBadgeKey,
): HomePerfumeSpotlight {
  const bestOffer = computeBestOffer(perfume.offers);

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
    offers: perfume.offers,
    notes: perfume.notes,
  };
}

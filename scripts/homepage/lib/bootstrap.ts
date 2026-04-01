import {
  CatalogStatus,
  HomepageCollectionType,
  HomepageSection,
  type PrismaClient,
} from "@prisma/client";

type BootstrapLogger = Pick<Console, "log">;

type BootstrapOptions = {
  logger?: BootstrapLogger;
  resetExisting?: boolean;
};

type HomepageCandidate = {
  id: number;
  slug: string;
  name: string;
  imageUrl: string | null;
  ratingInternal: number | null;
  catalogStatus: CatalogStatus;
  isArabic: boolean;
  isNiche: boolean;
  offers: Array<{ id: number }>;
};

type PlacementSeed = {
  perfumeId: number;
  section: HomepageSection;
  priority: number;
};

const homepageCollectionSeeds = [
  {
    title: "Vanilla Renaissance",
    slug: "vanilla-renaissance",
    subtitle: "Finder preset",
    description: "Warm vanilla-focused discovery using real Finder filters and live catalog data.",
    href: "/finder?preset=Vanilla+Renaissance&mood=cozy&preferredNote=vanilla",
    type: HomepageCollectionType.FINDER_PRESET,
    isHomepageVisible: true,
    homepagePriority: 10,
  },
  {
    title: "Arabic Icons",
    slug: "arabic-icons",
    subtitle: "Finder preset",
    description: "Arabic-leaning signatures routed through Finder with oud and bold-profile filters.",
    href: "/finder?preset=Arabic+Icons&mood=bold&preferredNote=oud&arabicOnly=true",
    type: HomepageCollectionType.FINDER_PRESET,
    isHomepageVisible: true,
    homepagePriority: 20,
  },
  {
    title: "Quiet Luxury",
    slug: "quiet-luxury",
    subtitle: "Catalog route",
    description: "Clean, polished perfumes from the live catalog with premium positioning.",
    href: "/perfumes?niche=true&sort=rating",
    type: HomepageCollectionType.CATALOG_ROUTE,
    isHomepageVisible: true,
    homepagePriority: 30,
  },
];

async function getHomepageCandidates(prisma: PrismaClient, excludeDemo: boolean) {
  return (await prisma.perfume.findMany({
    where: excludeDemo
      ? {
          catalogStatus: {
            not: CatalogStatus.DEMO,
          },
        }
      : undefined,
    select: {
      id: true,
      slug: true,
      name: true,
      imageUrl: true,
      ratingInternal: true,
      catalogStatus: true,
      isArabic: true,
      isNiche: true,
      offers: {
        select: {
          id: true,
        },
        take: 1,
      },
    },
    orderBy: [{ ratingInternal: "desc" }, { updatedAt: "desc" }, { name: "asc" }],
    take: 40,
  })) as HomepageCandidate[];
}

function uniqueCandidates(candidates: HomepageCandidate[]) {
  const seen = new Set<number>();

  return candidates.filter((candidate) => {
    if (seen.has(candidate.id)) {
      return false;
    }

    seen.add(candidate.id);
    return true;
  });
}

function mergeUniqueCandidates(...candidateGroups: HomepageCandidate[][]) {
  return uniqueCandidates(candidateGroups.flat());
}

function pickPlacements(candidates: HomepageCandidate[]) {
  const withImage = candidates.filter((candidate) => Boolean(candidate.imageUrl));
  const withImageAndOffer = withImage.filter((candidate) => candidate.offers.length > 0);
  const orderedPool =
    withImageAndOffer.length > 0 ? withImageAndOffer : withImage.length > 0 ? withImage : candidates;
  const fallbackPool = withImage.length > 0 ? withImage : candidates;

  const hero = orderedPool[0] ?? fallbackPool[0] ?? null;
  const heroId = hero?.id ?? null;
  const trending = mergeUniqueCandidates(
    withImageAndOffer.filter((candidate) => candidate.id !== heroId),
    fallbackPool.filter((candidate) => candidate.id !== heroId),
  ).slice(0, 4);
  const featuredBase = uniqueCandidates(
    fallbackPool.filter(
      (candidate) =>
        candidate.id !== heroId &&
        !trending.some((trendingCandidate) => trendingCandidate.id === candidate.id),
    ),
  );
  const featured =
    featuredBase.length >= 6
      ? featuredBase.slice(0, 6)
      : uniqueCandidates(
          fallbackPool.filter((candidate) => candidate.id !== heroId),
        ).slice(0, 6);

  const placements: PlacementSeed[] = [];

  if (hero) {
    placements.push({
      perfumeId: hero.id,
      section: HomepageSection.HERO,
      priority: 10,
    });
  }

  placements.push(
    ...trending.map((perfume, index) => ({
      perfumeId: perfume.id,
      section: HomepageSection.TRENDING,
      priority: (index + 1) * 10,
    })),
  );

  placements.push(
    ...featured.map((perfume, index) => ({
      perfumeId: perfume.id,
      section: HomepageSection.FEATURED,
      priority: (index + 1) * 10,
    })),
  );

  return {
    hero,
    trending,
    featured,
    placements,
  };
}

export async function bootstrapHomepageContent(
  prisma: PrismaClient,
  options: BootstrapOptions = {},
) {
  const logger = options.logger ?? console;
  const resetExisting = options.resetExisting ?? true;

  let candidates = await getHomepageCandidates(prisma, true);

  if (candidates.length < 6) {
    candidates = await getHomepageCandidates(prisma, false);
  }

  const selection = pickPlacements(candidates);

  if (resetExisting) {
    await prisma.perfumeHomepagePlacement.deleteMany({
      where: {
        section: {
          in: [HomepageSection.HERO, HomepageSection.TRENDING, HomepageSection.FEATURED],
        },
      },
    });
  }

  for (const placement of selection.placements) {
    await prisma.perfumeHomepagePlacement.upsert({
      where: {
        perfumeId_section: {
          perfumeId: placement.perfumeId,
          section: placement.section,
        },
      },
      update: {
        priority: placement.priority,
      },
      create: placement,
    });
  }

  for (const collection of homepageCollectionSeeds) {
    await prisma.homepageCollection.upsert({
      where: {
        slug: collection.slug,
      },
      update: {
        title: collection.title,
        subtitle: collection.subtitle,
        description: collection.description,
        href: collection.href,
        type: collection.type,
        isHomepageVisible: collection.isHomepageVisible,
        homepagePriority: collection.homepagePriority,
      },
      create: collection,
    });
  }

  logger.log(
    `[homepage] hero=${selection.hero?.slug ?? "none"} trending=${selection.trending.length} featured=${selection.featured.length} collections=${homepageCollectionSeeds.length}`,
  );

  return selection;
}

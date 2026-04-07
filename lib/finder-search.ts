import { type Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { PUBLIC_CACHE_TAGS } from "@/lib/cache-tags";
import { DEPLOY_ID } from "@/lib/deploy-id";
import {
  hasConfiguredFinderPreferences,
  buildFinderWhere,
  matchPerfumesFromPreferences,
  normalizeFinderQueryFilters,
  serializeFinderPreferences,
  type FinderPerfume,
  type FinderPreferences,
} from "@/lib/finder";
import {
  getCatalogVisibilityWhereForMode,
  logCatalogQueryError,
  mergePerfumeWhere,
  resolveCatalogMode,
} from "@/lib/catalog";
import { isDatabaseConfigured, prisma, withDatabaseRetry } from "@/lib/prisma";

export const FINDER_RESULTS_PAGE_SIZE = 20;
const FINDER_MIN_CANDIDATES = 120;
const FINDER_FILTERED_CANDIDATE_CAP = 320;

const finderInclude = {
  brand: true,
  notes: {
    include: {
      note: {
        select: {
          slug: true,
        },
      },
    },
  },
  moods: {
    include: {
      mood: {
        select: {
          slug: true,
        },
      },
    },
  },
  seasons: {
    include: {
      season: {
        select: {
          slug: true,
        },
      },
    },
  },
  occasions: {
    include: {
      occasion: {
        select: {
          slug: true,
        },
      },
    },
  },
} satisfies Prisma.PerfumeInclude;

export type FinderSearchResult = {
  results: FinderPerfume[];
  total: number;
  hasMore: boolean;
  nextOffset: number;
};

async function runFinderSearchUncached(
  preferences: FinderPreferences,
  offset: number,
  limit: number,
) {
  if (!isDatabaseConfigured) {
    return {
      results: [],
      total: 0,
      hasMore: false,
      nextOffset: 0,
    } satisfies FinderSearchResult;
  }

  const catalogMode = resolveCatalogMode();
  const finderWhere = buildFinderWhere(normalizeFinderQueryFilters(preferences));
  const where = mergePerfumeWhere(finderWhere, getCatalogVisibilityWhereForMode(catalogMode));
  const candidateLimit = hasConfiguredFinderPreferences(preferences)
    ? Math.min(Math.max(offset + limit + 80, FINDER_MIN_CANDIDATES), FINDER_FILTERED_CANDIDATE_CAP)
    : FINDER_MIN_CANDIDATES;

  const candidates = (await prisma.perfume.findMany({
    where,
    include: finderInclude,
    orderBy: [{ ratingInternal: "desc" }, { updatedAt: "desc" }, { name: "asc" }],
    take: candidateLimit,
  })) as FinderPerfume[];

  const results = matchPerfumesFromPreferences(preferences, candidates);
  const paginatedResults = results.slice(offset, offset + limit);

  return {
    results: paginatedResults,
    total: results.length,
    hasMore: offset + paginatedResults.length < results.length,
    nextOffset: offset + paginatedResults.length,
  } satisfies FinderSearchResult;
}

export async function getFinderSearch(
  preferences: FinderPreferences,
  offset = 0,
  limit = FINDER_RESULTS_PAGE_SIZE,
) {
  const normalizedOffset = Math.max(0, Math.floor(offset));
  const normalizedLimit = Math.min(Math.max(1, Math.floor(limit)), 40);
  const catalogMode = resolveCatalogMode();
  const serializedPreferences = serializeFinderPreferences(preferences);

  try {
    return await unstable_cache(
      async () =>
        withDatabaseRetry(() =>
          runFinderSearchUncached(preferences, normalizedOffset, normalizedLimit),
        ),
      [DEPLOY_ID, "finder-search", catalogMode, serializedPreferences, String(normalizedOffset), String(normalizedLimit)],
      {
        revalidate: 1800,
        tags: [PUBLIC_CACHE_TAGS.catalog, PUBLIC_CACHE_TAGS.finderResults],
      },
    )();
  } catch (error) {
    logCatalogQueryError("finder:search", error);
    return {
      results: [],
      total: 0,
      hasMore: false,
      nextOffset: normalizedOffset,
    } satisfies FinderSearchResult;
  }
}

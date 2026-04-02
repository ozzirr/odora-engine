import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { PUBLIC_CACHE_TAGS } from "@/lib/cache-tags";
import {
  getCatalogVisibilityWhereForMode,
  logCatalogQueryError,
  mergePerfumeWhere,
  resolveCatalogMode,
  type CatalogMode,
} from "@/lib/catalog";
import {
  applySorting,
  buildPerfumeQuery,
  serializeParsedPerfumeFilters,
  type SearchParamInput,
} from "@/lib/filters";
import { isDatabaseConfigured, prisma, runPrismaOperations } from "@/lib/prisma";

export const PERFUMES_PAGE_SIZE = 20;
export const FREE_CATALOG_PREVIEW_LIMIT = 25;

export type CatalogAccessMode = "full" | "preview";

const perfumeListInclude = {
  brand: true,
  notes: {
    select: {
      intensity: true,
      note: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    orderBy: [{ intensity: "desc" }, { id: "asc" }],
    take: 6,
  },
} satisfies Prisma.PerfumeInclude;

export type PerfumeListItem = Prisma.PerfumeGetPayload<{
  include: typeof perfumeListInclude;
}>;

type GetPerfumesPageOptions = {
  offset?: number;
  limit?: number;
  accessMode?: CatalogAccessMode;
};

function normalizePaginationValue(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value) || value == null) {
    return fallback;
  }

  const normalized = Math.floor(value);
  return normalized >= 0 ? normalized : fallback;
}

function getEmptyPerfumesPageResult(offset: number, limit: number) {
  return {
    perfumes: [] as PerfumeListItem[],
    total: 0,
    hasMore: false,
    selectedFilters: buildPerfumeQuery({}).parsed,
    offset,
    limit,
  };
}

async function getPerfumesPageUncached(
  searchParams: SearchParamInput,
  options: GetPerfumesPageOptions,
  catalogMode: CatalogMode,
) {
  const offset = normalizePaginationValue(options.offset, 0);
  const limit = normalizePaginationValue(options.limit, PERFUMES_PAGE_SIZE);
  const accessMode = options.accessMode ?? "preview";
  const { parsed, where } = buildPerfumeQuery(searchParams);

  if (!isDatabaseConfigured) {
    return {
      ...getEmptyPerfumesPageResult(offset, limit),
      selectedFilters: parsed,
    };
  }

  const mergedWhere = mergePerfumeWhere(where, getCatalogVisibilityWhereForMode(catalogMode));
  const queryLimit =
    accessMode === "preview" ? Math.max(0, Math.min(limit, FREE_CATALOG_PREVIEW_LIMIT - offset)) : limit;

  try {
    const baseQuery: Prisma.PerfumeFindManyArgs = {
      where: mergedWhere,
      include: perfumeListInclude,
      skip: offset,
      take: queryLimit,
    };

    const { query } = applySorting(baseQuery, parsed.sort);

    const [total, perfumes] = await runPrismaOperations([
      () => prisma.perfume.count({ where: mergedWhere }),
      () => (queryLimit > 0 ? prisma.perfume.findMany(query) : Promise.resolve([])),
    ]);
    const accessibleTotal = accessMode === "preview" ? Math.min(total, FREE_CATALOG_PREVIEW_LIMIT) : total;

    return {
      perfumes: perfumes as PerfumeListItem[],
      total,
      hasMore: offset + perfumes.length < accessibleTotal,
      selectedFilters: parsed,
      offset,
      limit,
    };
  } catch (error) {
    logCatalogQueryError("perfumes:list", error);
    return {
      ...getEmptyPerfumesPageResult(offset, limit),
      selectedFilters: parsed,
    };
  }
}

export async function getPerfumesPage(
  searchParams: SearchParamInput,
  options: GetPerfumesPageOptions = {},
) {
  const offset = normalizePaginationValue(options.offset, 0);
  const limit = normalizePaginationValue(options.limit, PERFUMES_PAGE_SIZE);
  const accessMode = options.accessMode ?? "preview";
  const { parsed } = buildPerfumeQuery(searchParams);
  const catalogMode = resolveCatalogMode();
  const serializedFilters = serializeParsedPerfumeFilters(parsed);

  return unstable_cache(
    async () => getPerfumesPageUncached(searchParams, { offset, limit, accessMode }, catalogMode),
    ["perfumes-page", catalogMode, accessMode, serializedFilters, String(offset), String(limit)],
    {
      revalidate: 1800,
      tags: [PUBLIC_CACHE_TAGS.catalog, PUBLIC_CACHE_TAGS.perfumesPage],
    },
  )();
}

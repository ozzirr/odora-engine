import type { Prisma } from "@prisma/client";

import { getCatalogVisibilityWhere, logCatalogQueryError, mergePerfumeWhere } from "@/lib/catalog";
import { applySorting, buildPerfumeQuery, type SearchParamInput } from "@/lib/filters";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export const PERFUMES_PAGE_SIZE = 20;

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
};

function normalizePaginationValue(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value) || value == null) {
    return fallback;
  }

  const normalized = Math.floor(value);
  return normalized >= 0 ? normalized : fallback;
}

export async function getPerfumesPage(
  searchParams: SearchParamInput,
  options: GetPerfumesPageOptions = {},
) {
  const offset = normalizePaginationValue(options.offset, 0);
  const limit = normalizePaginationValue(options.limit, PERFUMES_PAGE_SIZE);
  const { parsed, where } = buildPerfumeQuery(searchParams);

  if (!isDatabaseConfigured) {
    return {
      perfumes: [] as PerfumeListItem[],
      total: 0,
      hasMore: false,
      selectedFilters: parsed,
      offset,
      limit,
    };
  }

  const mergedWhere = mergePerfumeWhere(where, getCatalogVisibilityWhere());

  try {
    const baseQuery: Prisma.PerfumeFindManyArgs = {
      where: mergedWhere,
      include: perfumeListInclude,
      skip: offset,
      take: limit,
    };

    const { query } = applySorting(baseQuery, parsed.sort);

    const [total, perfumes] = await Promise.all([
      prisma.perfume.count({ where: mergedWhere }),
      prisma.perfume.findMany(query),
    ]);

    return {
      perfumes: perfumes as PerfumeListItem[],
      total,
      hasMore: offset + perfumes.length < total,
      selectedFilters: parsed,
      offset,
      limit,
    };
  } catch (error) {
    logCatalogQueryError("perfumes:list", error);
    return {
      perfumes: [] as PerfumeListItem[],
      total: 0,
      hasMore: false,
      selectedFilters: parsed,
      offset,
      limit,
    };
  }
}

import type { Prisma } from "@prisma/client";

import { getCatalogVisibilityWhere, logCatalogQueryError, mergePerfumeWhere } from "@/lib/catalog";
import { applySorting, buildPerfumeQuery, type SearchParamInput } from "@/lib/filters";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { computeBestOffer } from "@/lib/pricing";

export const PERFUMES_PAGE_SIZE = 20;

const perfumeListInclude = {
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
      store: {
        select: {
          name: true,
        },
      },
    },
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
    if (parsed.sort === "price_low" || parsed.sort === "price_high") {
      const { query } = applySorting(
        {
          where: mergedWhere,
          include: perfumeListInclude,
        },
        parsed.sort,
      );

      const allPerfumes = (await prisma.perfume.findMany(query)) as PerfumeListItem[];
      allPerfumes.sort((a, b) => {
        const aPrice = computeBestOffer(a.offers)?.bestTotalPrice;
        const bPrice = computeBestOffer(b.offers)?.bestTotalPrice;

        const left =
          parsed.sort === "price_low"
            ? (aPrice ?? Number.POSITIVE_INFINITY)
            : (aPrice ?? Number.NEGATIVE_INFINITY);
        const right =
          parsed.sort === "price_low"
            ? (bPrice ?? Number.POSITIVE_INFINITY)
            : (bPrice ?? Number.NEGATIVE_INFINITY);

        return parsed.sort === "price_low" ? left - right : right - left;
      });

      const perfumes = allPerfumes.slice(offset, offset + limit);
      const total = allPerfumes.length;

      return {
        perfumes,
        total,
        hasMore: offset + perfumes.length < total,
        selectedFilters: parsed,
        offset,
        limit,
      };
    }

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

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

const perfumePriceSortSelect = {
  id: true,
  offers: {
    select: {
      priceAmount: true,
      shippingCost: true,
      currency: true,
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
} satisfies Prisma.PerfumeSelect;

export type PerfumeListItem = Prisma.PerfumeGetPayload<{
  include: typeof perfumeListInclude;
}>;

type PerfumePriceSortCandidate = Prisma.PerfumeGetPayload<{
  select: typeof perfumePriceSortSelect;
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
          select: perfumePriceSortSelect,
        },
        parsed.sort,
      );

      const priceCandidates = (await prisma.perfume.findMany(
        query as Prisma.PerfumeFindManyArgs,
      )) as unknown as PerfumePriceSortCandidate[];
      priceCandidates.sort((a, b) => {
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

      const paginatedIds = priceCandidates.slice(offset, offset + limit).map((perfume) => perfume.id);
      const total = priceCandidates.length;
      const perfumes =
        paginatedIds.length === 0
          ? []
          : await prisma.perfume.findMany({
              where: {
                id: {
                  in: paginatedIds,
                },
              },
              include: perfumeListInclude,
            });
      const perfumeById = new Map(perfumes.map((perfume) => [perfume.id, perfume]));
      const orderedPerfumes = paginatedIds
        .map((id) => perfumeById.get(id))
        .filter((perfume): perfume is (typeof perfumes)[number] => Boolean(perfume));

      return {
        perfumes: orderedPerfumes as PerfumeListItem[],
        total,
        hasMore: offset + orderedPerfumes.length < total,
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

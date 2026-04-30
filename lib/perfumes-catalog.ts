import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { PUBLIC_CACHE_TAGS } from "@/lib/cache-tags";
import { DEPLOY_ID } from "@/lib/deploy-id";
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
import { isDatabaseConfigured, prisma, runPrismaOperations, withDatabaseRetry } from "@/lib/prisma";

export const PERFUMES_PAGE_SIZE = 20;
export const FREE_CATALOG_PREVIEW_LIMIT = 10;

export type CatalogAccessMode = "full" | "preview";

export type CatalogFilterOption = {
  value: string;
  label: string;
  count: number;
};

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

function toFilterSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, "")
    .replace(/[\/\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const catalogFamilyBuckets = [
  { value: "woody", keywords: ["woody", "wood"] },
  { value: "amber", keywords: ["amber", "ambrato"] },
  { value: "floral", keywords: ["floral", "flower"] },
  { value: "aromatic", keywords: ["aromatic"] },
  { value: "citrus", keywords: ["citrus"] },
  { value: "gourmand", keywords: ["gourmand", "vanilla"] },
  { value: "fresh", keywords: ["fresh", "green"] },
  { value: "oriental", keywords: ["oriental"] },
] as const;

function resolveCatalogFamilyBucket(family: string) {
  const slug = toFilterSlug(family);
  const tokens = slug.split("-").filter(Boolean);
  const firstToken = tokens[0];
  const firstTokenBucket = catalogFamilyBuckets.find((bucket) =>
    bucket.keywords.some((keyword) => keyword === firstToken),
  );

  if (firstTokenBucket) {
    return firstTokenBucket.value;
  }

  const containedBucket = catalogFamilyBuckets.find((bucket) =>
    bucket.keywords.some((keyword) => tokens.includes(keyword)),
  );

  return containedBucket?.value ?? slug;
}

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
    relaxedFromZero: false,
    selectedFilters: buildPerfumeQuery({}).parsed,
    offset,
    limit,
  };
}

function hasSearchParamValue(searchParams: SearchParamInput, key: string) {
  const value = searchParams[key];
  const resolved = Array.isArray(value) ? value[0] : value;
  return Boolean(resolved);
}

function buildRelaxedSearchCandidates(searchParams: SearchParamInput) {
  const baseEntries = Object.entries(searchParams).flatMap(([key, value]) => {
    const resolved = Array.isArray(value) ? value[0] : value;
    return resolved ? [[key, resolved] as const] : [];
  });

  const makeCandidate = (removeKeys: string[]) =>
    Object.fromEntries(baseEntries.filter(([key]) => !removeKeys.includes(key)));

  return [
    makeCandidate(["note", "top", "heart", "base", "arabic", "niche", "page"]),
    makeCandidate(["note", "top", "heart", "base", "arabic", "niche", "price", "page"]),
    makeCandidate(["note", "top", "heart", "base", "arabic", "niche", "gender", "page"]),
    makeCandidate(["note", "top", "heart", "base", "arabic", "niche", "family", "price", "gender", "page"]),
  ];
}

async function findCatalogPage(
  where: Prisma.PerfumeWhereInput | undefined,
  sort: ReturnType<typeof buildPerfumeQuery>["parsed"]["sort"],
  offset: number,
  take: number,
) {
  const baseQuery: Prisma.PerfumeFindManyArgs = {
    where,
    include: perfumeListInclude,
    skip: offset,
    take,
  };
  const { query } = applySorting(baseQuery, sort);

  const [total, perfumes] = await runPrismaOperations([
    () => prisma.perfume.count({ where }),
    () => (take > 0 ? prisma.perfume.findMany(query) : Promise.resolve([])),
  ]);

  return {
    total,
    perfumes: perfumes as PerfumeListItem[],
  };
}

async function findTopFallbackPage(
  sort: ReturnType<typeof buildPerfumeQuery>["parsed"]["sort"],
  offset: number,
  take: number,
  catalogMode: CatalogMode,
) {
  const visibilityCandidates = [
    getCatalogVisibilityWhereForMode(catalogMode),
    getCatalogVisibilityWhereForMode("no_demo"),
    undefined,
  ];

  for (const where of visibilityCandidates) {
    const result = await findCatalogPage(where, sort, offset, take);

    if (result.total > 0) {
      return result;
    }
  }

  return {
    total: 0,
    perfumes: [] as PerfumeListItem[],
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
  const hasActiveFilters = [
    "gender",
    "family",
    "price",
    "note",
    "top",
    "heart",
    "base",
    "arabic",
    "niche",
  ].some((key) => hasSearchParamValue(searchParams, key));

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
    const { total, perfumes } = await findCatalogPage(
      mergedWhere,
      parsed.sort,
      offset,
      queryLimit,
    );

    if (total === 0 && hasActiveFilters) {
      for (const candidate of buildRelaxedSearchCandidates(searchParams)) {
        const { where: relaxedWhere } = buildPerfumeQuery(candidate);
        const mergedRelaxedWhere = mergePerfumeWhere(
          relaxedWhere,
          getCatalogVisibilityWhereForMode(catalogMode),
        );
        const { total: relaxedTotal, perfumes: relaxedPerfumes } = await findCatalogPage(
          mergedRelaxedWhere,
          parsed.sort,
          offset,
          queryLimit,
        );

        if (relaxedTotal > 0) {
          const relaxedAccessibleTotal =
            accessMode === "preview" ? Math.min(relaxedTotal, FREE_CATALOG_PREVIEW_LIMIT) : relaxedTotal;

          return {
            perfumes: relaxedPerfumes as PerfumeListItem[],
            total: relaxedTotal,
            hasMore: offset + relaxedPerfumes.length < relaxedAccessibleTotal,
            selectedFilters: parsed,
            relaxedFromZero: true,
            offset,
            limit,
          };
        }
      }
    }

    if (total === 0) {
      const fallback = await findTopFallbackPage(parsed.sort, offset, queryLimit, catalogMode);
      const fallbackAccessibleTotal =
        accessMode === "preview" ? Math.min(fallback.total, FREE_CATALOG_PREVIEW_LIMIT) : fallback.total;

      return {
        perfumes: fallback.perfumes,
        total: fallback.total,
        hasMore: offset + fallback.perfumes.length < fallbackAccessibleTotal,
        selectedFilters: parsed,
        relaxedFromZero: hasActiveFilters && fallback.total > 0,
        offset,
        limit,
      };
    }

    const accessibleTotal = accessMode === "preview" ? Math.min(total, FREE_CATALOG_PREVIEW_LIMIT) : total;

    return {
      perfumes: perfumes as PerfumeListItem[],
      total,
      hasMore: offset + perfumes.length < accessibleTotal,
      selectedFilters: parsed,
      relaxedFromZero: false,
      offset,
      limit,
    };
  } catch (error) {
    logCatalogQueryError("perfumes:list", error);
    throw error;
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
    async () =>
      withDatabaseRetry(() =>
        getPerfumesPageUncached(searchParams, { offset, limit, accessMode }, catalogMode),
      ),
    [DEPLOY_ID, "perfumes-page", catalogMode, accessMode, serializedFilters, String(offset), String(limit)],
    {
      revalidate: 1800,
      tags: [PUBLIC_CACHE_TAGS.catalog, PUBLIC_CACHE_TAGS.perfumesPage],
    },
  )();
}

async function getCatalogFilterOptionsUncached(catalogMode: CatalogMode) {
  if (!isDatabaseConfigured) {
    return {
      families: [] as CatalogFilterOption[],
      notes: [] as CatalogFilterOption[],
    };
  }

  const visibilityWhere = getCatalogVisibilityWhereForMode(catalogMode);
  const [familyRows, noteRows] = await runPrismaOperations([
    () =>
      prisma.perfume.groupBy({
        by: ["fragranceFamily"],
        where: visibilityWhere,
        _count: { _all: true },
        orderBy: { _count: { fragranceFamily: "desc" } },
      }),
    () =>
      prisma.note.findMany({
        where: visibilityWhere
          ? {
              perfumes: {
                some: {
                  perfume: visibilityWhere,
                },
              },
            }
          : {
              perfumes: {
                some: {},
              },
            },
        select: {
          name: true,
          slug: true,
          _count: {
            select: {
              perfumes: true,
            },
          },
        },
        orderBy: {
          perfumes: {
            _count: "desc",
          },
        },
        take: 80,
      }),
  ]);

  const familyCounts = new Map<string, number>();

  for (const item of familyRows) {
    const value = resolveCatalogFamilyBucket(item.fragranceFamily);
    const count = typeof item._count === "object" && item._count ? (item._count._all ?? 0) : 0;

    if (value.length > 0 && count > 0) {
      familyCounts.set(value, (familyCounts.get(value) ?? 0) + count);
    }
  }

  const families = Array.from(familyCounts.entries())
    .map(([value, count]) => ({
      value,
      label: value,
      count,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "en", { sensitivity: "base" }));

  const notes = noteRows
    .map((item) => ({
      value: item.slug,
      label: item.name,
      count: item._count.perfumes,
    }))
    .filter((item) => item.value.length > 0 && item.count > 0)
    .sort((a, b) => a.label.localeCompare(b.label, "en", { sensitivity: "base" }));

  return {
    families,
    notes,
  };
}

export async function getCatalogFilterOptions() {
  const catalogMode = resolveCatalogMode();

  try {
    return await unstable_cache(
      async () => withDatabaseRetry(() => getCatalogFilterOptionsUncached(catalogMode)),
      [DEPLOY_ID, "catalog-filter-options-v3", catalogMode],
      {
        revalidate: 21600,
        tags: [PUBLIC_CACHE_TAGS.catalog],
      },
    )();
  } catch (error) {
    logCatalogQueryError("perfumes:filter-options", error);
    return {
      families: [] as CatalogFilterOption[],
      notes: [] as CatalogFilterOption[],
    };
  }
}

import { CatalogStatus, type Prisma } from "@prisma/client";

export const catalogModeOptions = ["all", "no_demo", "verified_only"] as const;

export type CatalogMode = (typeof catalogModeOptions)[number];

export function resolveCatalogMode(): CatalogMode {
  const rawValue = process.env.ODORA_CATALOG_MODE?.trim().toLowerCase();

  if (rawValue === "no_demo") {
    return "no_demo";
  }

  if (rawValue === "verified_only") {
    return "verified_only";
  }

  return "all";
}

export function getCatalogVisibilityWhere(): Prisma.PerfumeWhereInput | undefined {
  const mode = resolveCatalogMode();

  if (mode === "no_demo") {
    return {
      catalogStatus: {
        not: CatalogStatus.DEMO,
      },
    };
  }

  if (mode === "verified_only") {
    return {
      catalogStatus: CatalogStatus.VERIFIED,
    };
  }

  return undefined;
}

export function mergePerfumeWhere(
  where?: Prisma.PerfumeWhereInput,
  extraWhere?: Prisma.PerfumeWhereInput,
): Prisma.PerfumeWhereInput | undefined {
  const filters = [where, extraWhere].filter((item): item is Prisma.PerfumeWhereInput => Boolean(item));

  if (filters.length === 0) {
    return undefined;
  }

  if (filters.length === 1) {
    return filters[0];
  }

  return {
    AND: filters,
  };
}

export function logCatalogQueryError(scope: string, error: unknown) {
  if (error instanceof Error) {
    console.error(`[catalog:${scope}] ${error.message}`);
    return;
  }

  console.error(`[catalog:${scope}] query failed`, error);
}

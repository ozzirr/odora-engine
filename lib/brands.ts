import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { PUBLIC_CACHE_TAGS } from "@/lib/cache-tags";
import {
  getCatalogVisibilityWhereForMode,
  mergePerfumeWhere,
  resolveCatalogMode,
} from "@/lib/catalog";
import { DEPLOY_ID } from "@/lib/deploy-id";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

const BRAND_REVALIDATE_SECONDS = 3600;

const brandPerfumeInclude = {
  brand: true,
  notes: {
    select: {
      intensity: true,
      note: { select: { name: true, slug: true } },
    },
    orderBy: [{ intensity: "desc" }, { id: "asc" }],
    take: 6,
  },
} satisfies Prisma.PerfumeInclude;

export async function getBrandBySlug(slug: string) {
  if (!isDatabaseConfigured) return null;
  return unstable_cache(
    async () =>
      prisma.brand.findUnique({
        where: { slug },
        select: {
          id: true,
          name: true,
          slug: true,
          country: true,
          description: true,
          logoUrl: true,
          updatedAt: true,
        },
      }),
    [DEPLOY_ID, "brand-by-slug", slug],
    { revalidate: BRAND_REVALIDATE_SECONDS, tags: [PUBLIC_CACHE_TAGS.catalog] },
  )();
}

export async function getBrandPerfumes(brandId: number) {
  if (!isDatabaseConfigured) return [];
  const catalogMode = resolveCatalogMode();
  const visibilityWhere = getCatalogVisibilityWhereForMode(catalogMode);

  return unstable_cache(
    async () =>
      prisma.perfume.findMany({
        where: mergePerfumeWhere({ brandId }, visibilityWhere),
        include: brandPerfumeInclude,
        orderBy: [{ ratingInternal: "desc" }, { updatedAt: "desc" }],
        take: 60,
      }),
    [DEPLOY_ID, "brand-perfumes", catalogMode, String(brandId)],
    { revalidate: BRAND_REVALIDATE_SECONDS, tags: [PUBLIC_CACHE_TAGS.catalog] },
  )();
}

export async function getAllBrandsWithCount() {
  if (!isDatabaseConfigured) return [];
  const catalogMode = resolveCatalogMode();
  const visibilityWhere = getCatalogVisibilityWhereForMode(catalogMode);

  return unstable_cache(
    async () => {
      const brands = await prisma.brand.findMany({
        where: { perfumes: { some: visibilityWhere ?? {} } },
        select: {
          id: true,
          name: true,
          slug: true,
          country: true,
          logoUrl: true,
          _count: {
            select: {
              perfumes: visibilityWhere ? { where: visibilityWhere } : true,
            },
          },
        },
        orderBy: { name: "asc" },
      });
      return brands;
    },
    [DEPLOY_ID, "brands-list", catalogMode],
    { revalidate: BRAND_REVALIDATE_SECONDS, tags: [PUBLIC_CACHE_TAGS.catalog] },
  )();
}

export async function getAllBrandSlugs() {
  if (!isDatabaseConfigured) return [];
  return unstable_cache(
    async () => {
      const brands = await prisma.brand.findMany({
        where: { perfumes: { some: {} } },
        select: { slug: true, updatedAt: true },
        orderBy: { name: "asc" },
      });
      return brands;
    },
    [DEPLOY_ID, "brand-slugs"],
    { revalidate: BRAND_REVALIDATE_SECONDS, tags: [PUBLIC_CACHE_TAGS.catalog] },
  )();
}

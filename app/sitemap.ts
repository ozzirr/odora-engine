import { unstable_cache } from "next/cache";
import type { MetadataRoute } from "next";

import { PUBLIC_CACHE_TAGS } from "@/lib/cache-tags";
import { getCatalogVisibilityWhereForMode, resolveCatalogMode } from "@/lib/catalog";
import { DEPLOY_ID } from "@/lib/deploy-id";
import { getLocalizedPathname, locales, type AppPathname } from "@/lib/i18n";
import { toAbsoluteUrl } from "@/lib/metadata";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export const revalidate = 3600;

const staticPathnames: AppPathname[] = [
  "/",
  "/perfumes",
  "/finder",
  "/top",
  "/blog",
  "/privacy",
  "/cookie-policy",
  "/terms",
  "/affiliate-disclosure",
  "/contact",
];

const getSitemapBlogPosts = unstable_cache(
  async () =>
    prisma.blogPost.findMany({
      select: { slug: true, locale: true, updatedAt: true },
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
    }),
  [DEPLOY_ID, "sitemap-blog-posts"],
  { tags: [PUBLIC_CACHE_TAGS.blog] },
);

const getSitemapPerfumes = unstable_cache(
  async () =>
    prisma.perfume.findMany({
      select: { slug: true, updatedAt: true },
      where: getCatalogVisibilityWhereForMode(resolveCatalogMode()),
      orderBy: { updatedAt: "desc" },
    }),
  [DEPLOY_ID, "sitemap-perfumes"],
  { tags: [PUBLIC_CACHE_TAGS.catalog] },
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    staticPathnames.map((pathname) => ({
      url: toAbsoluteUrl(getLocalizedPathname(locale, pathname)),
      lastModified: now,
      changeFrequency: pathname === "/" ? "daily" : "weekly",
      priority: pathname === "/" ? 1 : pathname === "/perfumes" || pathname === "/finder" || pathname === "/top" ? 0.9 : pathname === "/blog" ? 0.8 : 0.4,
    })),
  );

  if (!isDatabaseConfigured) {
    return entries;
  }

  const blogPosts = await getSitemapBlogPosts();

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: toAbsoluteUrl(`/${post.locale}/blog/${post.slug}`),
    lastModified: post.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const perfumes = await getSitemapPerfumes();

  return [
    ...entries,
    ...blogEntries,
    ...locales.flatMap((locale) =>
      perfumes.map((perfume) => ({
        url: toAbsoluteUrl(getLocalizedPathname(locale, "/perfumes/[slug]", { slug: perfume.slug })),
        lastModified: perfume.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ),
  ];
}

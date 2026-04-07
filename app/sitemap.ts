import type { MetadataRoute } from "next";

import { getCatalogVisibilityWhereForMode, resolveCatalogMode } from "@/lib/catalog";
import { getLocalizedPathname, locales, type AppPathname } from "@/lib/i18n";
import { toAbsoluteUrl } from "@/lib/metadata";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

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

  // Blog posts — one URL per published slug per locale
  const blogPosts = await prisma.blogPost.findMany({
    select: { slug: true, locale: true, updatedAt: true },
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: toAbsoluteUrl(`/${post.locale}/blog/${post.slug}`),
    lastModified: post.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const perfumes = await prisma.perfume.findMany({
    select: {
      slug: true,
      updatedAt: true,
    },
    where: getCatalogVisibilityWhereForMode(resolveCatalogMode()),
    orderBy: {
      updatedAt: "desc",
    },
  });

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

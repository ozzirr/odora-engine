import { unstable_cache } from "next/cache";

import { PUBLIC_CACHE_TAGS } from "@/lib/cache-tags";
import { getCatalogVisibilityWhereForMode, resolveCatalogMode } from "@/lib/catalog";
import { DEPLOY_ID } from "@/lib/deploy-id";
import { getLocalizedPathname, locales, type AppPathname } from "@/lib/i18n";
import { toAbsoluteUrl } from "@/lib/metadata";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export const revalidate = 3600;

type SitemapEntry = {
  url: string;
  lastModified: Date | string;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
};

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

const getSitemapBrands = unstable_cache(
  async () =>
    prisma.brand.findMany({
      where: { perfumes: { some: {} } },
      select: { slug: true, updatedAt: true },
      orderBy: { name: "asc" },
    }),
  [DEPLOY_ID, "sitemap-brands"],
  { tags: [PUBLIC_CACHE_TAGS.catalog] },
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

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toIsoDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function renderSitemap(entries: SitemapEntry[]) {
  const urls = entries
    .map(
      (entry) => `<url>
<loc>${escapeXml(entry.url)}</loc>
<lastmod>${toIsoDate(entry.lastModified)}</lastmod>
<changefreq>${entry.changeFrequency}</changefreq>
<priority>${entry.priority}</priority>
</url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const now = new Date();
  const entries: SitemapEntry[] = locales.flatMap((locale) =>
    staticPathnames.map((pathname) => ({
      url: toAbsoluteUrl(getLocalizedPathname(locale, pathname)),
      lastModified: now,
      changeFrequency: pathname === "/" ? "daily" : "weekly",
      priority:
        pathname === "/"
          ? 1
          : pathname === "/perfumes" || pathname === "/finder" || pathname === "/top"
            ? 0.9
            : pathname === "/blog"
              ? 0.8
              : 0.4,
    })),
  );

  if (!isDatabaseConfigured) {
    return entries;
  }

  const [blogPosts, perfumes, brands] = await Promise.all([
    getSitemapBlogPosts(),
    getSitemapPerfumes(),
    getSitemapBrands(),
  ]);

  return [
    ...entries,
    ...blogPosts.map((post) => ({
      url: toAbsoluteUrl(`/${post.locale}/blog/${post.slug}`),
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...locales.flatMap((locale) =>
      brands.map((brand) => ({
        url: toAbsoluteUrl(getLocalizedPathname(locale, "/brands/[slug]", { slug: brand.slug })),
        lastModified: brand.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ),
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

export async function GET() {
  const entries = await getSitemapEntries();

  return new Response(renderSitemap(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { type Prisma } from "@prisma/client";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { StructuredData } from "@/components/seo/StructuredData";
import { EditorialSection } from "@/components/top/EditorialSection";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { buttonStyles } from "@/components/ui/Button";
import { PUBLIC_CACHE_TAGS } from "@/lib/cache-tags";
import {
  getCatalogVisibilityWhereForMode,
  logCatalogQueryError,
  mergePerfumeWhere,
  resolveCatalogMode,
  type CatalogMode,
} from "@/lib/catalog";
import { getLocalizedPathname, hasLocale, type AppLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";
import { Link } from "@/lib/navigation";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildItemListSchema,
} from "@/lib/structured-data";

export const revalidate = 3600;

const topPerfumeInclude = {
  brand: true,
} satisfies Prisma.PerfumeInclude;

type TopPerfumeCard = Prisma.PerfumeGetPayload<{
  include: typeof topPerfumeInclude;
}>;

function getEmptyTopPageData() {
  return {
    topArabic: [] as TopPerfumeCard[],
    topNiche: [] as TopPerfumeCard[],
    topLongLasting: [] as TopPerfumeCard[],
    topValuePicks: [] as TopPerfumeCard[],
  };
}

async function getTopPageDataUncached(catalogMode: CatalogMode) {
  if (!isDatabaseConfigured) {
    return getEmptyTopPageData();
  }

  try {
    const visibilityWhere = getCatalogVisibilityWhereForMode(catalogMode);
    const priceCap = 100;
    const [topArabic, topNiche, topLongLasting, valueCandidates] = await Promise.all([
      prisma.perfume.findMany({
        where: mergePerfumeWhere({ isArabic: true }, visibilityWhere),
        include: topPerfumeInclude,
        orderBy: [{ ratingInternal: "desc" }, { updatedAt: "desc" }],
        take: 4,
      }),
      prisma.perfume.findMany({
        where: mergePerfumeWhere({ isNiche: true }, visibilityWhere),
        include: topPerfumeInclude,
        orderBy: [{ ratingInternal: "desc" }, { updatedAt: "desc" }],
        take: 4,
      }),
      prisma.perfume.findMany({
        where: mergePerfumeWhere(
          {
            longevityScore: {
              not: null,
            },
          },
          visibilityWhere,
        ),
        include: topPerfumeInclude,
        orderBy: [{ longevityScore: "desc" }, { ratingInternal: "desc" }, { updatedAt: "desc" }],
        take: 4,
      }),
      prisma.perfume.findMany({
        where: mergePerfumeWhere(
          {
            bestTotalPriceAmount: {
              lte: priceCap,
            },
          },
          visibilityWhere,
        ),
        include: topPerfumeInclude,
        orderBy: [{ ratingInternal: "desc" }, { bestTotalPriceAmount: "asc" }, { updatedAt: "desc" }],
        take: 4,
      }),
    ]);

    return {
      topArabic: topArabic as TopPerfumeCard[],
      topNiche: topNiche as TopPerfumeCard[],
      topLongLasting: topLongLasting as TopPerfumeCard[],
      topValuePicks: valueCandidates as TopPerfumeCard[],
    };
  } catch (error) {
    logCatalogQueryError("top:list", error);
    return getEmptyTopPageData();
  }
}

async function getTopPageData() {
  const catalogMode = resolveCatalogMode();

  return unstable_cache(
    async () => getTopPageDataUncached(catalogMode),
    ["top-page", catalogMode],
    {
      revalidate: 3600,
      tags: [PUBLIC_CACHE_TAGS.catalog, PUBLIC_CACHE_TAGS.topPage],
    },
  )();
}

type TopPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: TopPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.top" });

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: resolvedLocale,
    pathname: "/top",
  });
}

export default async function TopPage({ params }: TopPageProps) {
  const { locale } = await params;
  const resolvedLocale = (hasLocale(locale) ? locale : "en") as AppLocale;
  const t = await getTranslations({ locale: resolvedLocale, namespace: "top.page" });
  const navT = await getTranslations({ locale: resolvedLocale, namespace: "layout.header.nav" });
  const { topArabic, topNiche, topLongLasting, topValuePicks } = await getTopPageData();
  const priceCap = 100;
  const topPath = getLocalizedPathname(resolvedLocale, "/top");
  const rankedPerfumes = Array.from(
    new Map(
      [...topArabic, ...topNiche, ...topValuePicks, ...topLongLasting].map((perfume) => [perfume.id, perfume]),
    ).values(),
  );
  const breadcrumbItems = [
    { label: navT("home"), href: "/" as const },
    { label: navT("top") },
  ];

  return (
    <Container className="space-y-12 pt-14 pb-8">
      <StructuredData
        data={[
          buildCollectionPageSchema({
            name: t("title"),
            description: t("subtitle"),
            path: topPath,
            locale: resolvedLocale,
          }),
          buildBreadcrumbSchema([
            { name: navT("home"), path: getLocalizedPathname(resolvedLocale, "/") },
            { name: navT("top"), path: topPath },
          ]),
          buildItemListSchema({
            name: t("title"),
            path: topPath,
            items: rankedPerfumes.map((perfume) => ({
              name: `${perfume.name} ${perfume.brand?.name ?? ""}`.trim(),
              path: getLocalizedPathname(resolvedLocale, "/perfumes/[slug]", { slug: perfume.slug }),
            })),
          }),
        ]}
      />

      <Breadcrumbs items={breadcrumbItems} />

      <div className="rounded-3xl border border-[#dfd1bf] bg-white p-8 sm:p-10">
        <SectionTitle
          as="h1"
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <div className="mt-4 max-w-3xl space-y-3 text-sm leading-7 text-[#5f5041] sm:text-base">
          <p>{t("bodyOne")}</p>
          <p>{t("bodyTwo")}</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/perfumes" className={buttonStyles({ size: "sm" })}>
            {t("primaryCta")}
          </Link>
          <Link href="/finder" className={buttonStyles({ variant: "secondary", size: "sm" })}>
            {t("secondaryCta")}
          </Link>
        </div>
      </div>

      <EditorialSection
        eyebrow={t("sections.arabic.eyebrow")}
        title={t("sections.arabic.title")}
        subtitle={t("sections.arabic.subtitle")}
        perfumes={topArabic}
      />

      <EditorialSection
        eyebrow={t("sections.niche.eyebrow")}
        title={t("sections.niche.title")}
        subtitle={t("sections.niche.subtitle")}
        perfumes={topNiche}
      />

      <EditorialSection
        eyebrow={t("sections.value.eyebrow")}
        title={t("sections.value.title", { priceCap })}
        subtitle={t("sections.value.subtitle")}
        perfumes={topValuePicks}
      />

      <EditorialSection
        eyebrow={t("sections.performance.eyebrow")}
        title={t("sections.performance.title")}
        subtitle={t("sections.performance.subtitle")}
        perfumes={topLongLasting}
      />
    </Container>
  );
}

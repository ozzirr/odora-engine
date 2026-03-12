import type { Metadata } from "next";
import { type Prisma } from "@prisma/client";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/layout/Container";
import { EditorialSection } from "@/components/top/EditorialSection";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  getCatalogVisibilityWhere,
  logCatalogQueryError,
  mergePerfumeWhere,
} from "@/lib/catalog";
import { getAlternateLinks, hasLocale } from "@/lib/i18n";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export const revalidate = 3600;

const topPerfumeInclude = {
  brand: true,
} satisfies Prisma.PerfumeInclude;

type TopPerfumeCard = Prisma.PerfumeGetPayload<{
  include: typeof topPerfumeInclude;
}>;

async function getTopPageData() {
  if (!isDatabaseConfigured) {
    return {
      topArabic: [] as TopPerfumeCard[],
      topNiche: [] as TopPerfumeCard[],
      topLongLasting: [] as TopPerfumeCard[],
      topValuePicks: [] as TopPerfumeCard[],
    };
  }

  try {
    const visibilityWhere = getCatalogVisibilityWhere();
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
    return {
      topArabic: [] as TopPerfumeCard[],
      topNiche: [] as TopPerfumeCard[],
      topLongLasting: [] as TopPerfumeCard[],
      topValuePicks: [] as TopPerfumeCard[],
    };
  }
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

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: getAlternateLinks("/top")[resolvedLocale],
      languages: getAlternateLinks("/top"),
    },
  };
}

export default async function TopPage({ params }: TopPageProps) {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "top.page" });
  const { topArabic, topNiche, topLongLasting, topValuePicks } = await getTopPageData();
  const priceCap = 100;

  return (
    <Container className="space-y-12 pt-14 pb-8">
      <div className="rounded-3xl border border-[#dfd1bf] bg-white p-8 sm:p-10">
        <SectionTitle
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
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

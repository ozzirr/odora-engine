import type { Metadata } from "next";
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
import { computeBestOffer } from "@/lib/pricing";

export const dynamic = "force-dynamic";

async function getTopPageData() {
  if (!isDatabaseConfigured) {
    return [];
  }

  try {
    return await prisma.perfume.findMany({
      where: mergePerfumeWhere(undefined, getCatalogVisibilityWhere()),
      include: {
        brand: true,
        offers: {
          include: {
            store: true,
          },
        },
      },
    });
  } catch (error) {
    logCatalogQueryError("top:list", error);
    return [];
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
  const perfumes = await getTopPageData();

  const topArabic = perfumes
    .filter((perfume) => perfume.isArabic)
    .sort((a, b) => (b.ratingInternal ?? 0) - (a.ratingInternal ?? 0))
    .slice(0, 4);

  const topNiche = perfumes
    .filter((perfume) => perfume.isNiche)
    .sort((a, b) => (b.ratingInternal ?? 0) - (a.ratingInternal ?? 0))
    .slice(0, 4);

  const topLongLasting = [...perfumes]
    .sort((a, b) => (b.longevityScore ?? 0) - (a.longevityScore ?? 0))
    .slice(0, 4);

  const priceCap = 100;
  const topValuePicks = perfumes
    .filter((perfume) => {
      const bestOffer = computeBestOffer(perfume.offers);
      return bestOffer != null && bestOffer.bestTotalPrice <= priceCap;
    })
    .sort((a, b) => {
      const aScore = a.ratingInternal ?? 0;
      const bScore = b.ratingInternal ?? 0;

      if (bScore !== aScore) {
        return bScore - aScore;
      }

      const aPrice = computeBestOffer(a.offers)?.bestTotalPrice ?? Number.POSITIVE_INFINITY;
      const bPrice = computeBestOffer(b.offers)?.bestTotalPrice ?? Number.POSITIVE_INFINITY;
      return aPrice - bPrice;
    })
    .slice(0, 4);

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

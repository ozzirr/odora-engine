import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/layout/Container";
import { DiscoveryCollections } from "@/components/home/DiscoveryCollections";
import { FeaturedPerfumes } from "@/components/home/FeaturedPerfumes";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { QuickFilters } from "@/components/home/QuickFilters";
import { TrendingNow } from "@/components/home/TrendingNow";
import { TrustedStores } from "@/components/home/TrustedStores";
import {
  getHomepageData,
  toHomeSpotlight,
  toPerfumeCardItem,
} from "@/lib/homepage";
import { getAlternateLinks, hasLocale } from "@/lib/i18n";

export const revalidate = 3600;

type HomePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.home" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: getAlternateLinks("/")[resolvedLocale],
      languages: getAlternateLinks("/"),
    },
  };
}

export default async function HomePage() {
  const homepageData = await getHomepageData();
  const heroPreviews = homepageData.heroSpotlights.map((perfume, index) =>
    toHomeSpotlight(perfume, index === 0 ? "heroPick" : "spotlight"),
  );
  const trendingPerfumes = homepageData.trending.map((perfume) =>
    toHomeSpotlight(perfume, "trending"),
  );

  return (
    <>
      <Hero previews={heroPreviews} />

      <Container>
        <TrendingNow perfumes={trendingPerfumes} />
        <FeaturedPerfumes perfumes={homepageData.featured.slice(0, 6).map(toPerfumeCardItem)} />
        <QuickFilters />
        <HowItWorks />
        <TrustedStores stores={homepageData.trustedStores} />
        <DiscoveryCollections collections={homepageData.collections} />
      </Container>
    </>
  );
}

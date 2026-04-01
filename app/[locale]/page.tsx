import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/layout/Container";
import { LaunchGateExperience } from "@/components/launch/LaunchGateExperience";
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
import { hasLocale, type AppLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";
import {
  LAUNCH_GATE_ACCESS_COOKIE_NAME,
  hasLaunchGateAccess,
  isLaunchGateEnabled,
} from "@/lib/launch-gate";

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
  const title = isLaunchGateEnabled()
    ? resolvedLocale === "it"
      ? "Odora apre presto"
      : "Odora is opening soon"
    : t("title");
  const description = isLaunchGateEnabled()
    ? resolvedLocale === "it"
      ? "Coming soon privato con accesso riservato tramite password."
      : "Private coming soon page with password-protected access."
    : t("description");

  return buildPageMetadata({
    title,
    description,
    locale: resolvedLocale,
    pathname: "/",
    robots: isLaunchGateEnabled()
      ? {
          index: false,
          follow: false,
        }
      : undefined,
  });
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const resolvedLocale = (hasLocale(locale) ? locale : "en") as AppLocale;

  if (isLaunchGateEnabled()) {
    const cookieStore = await cookies();
    const hasAccess = hasLaunchGateAccess(
      cookieStore.get(LAUNCH_GATE_ACCESS_COOKIE_NAME)?.value,
    );

    if (!hasAccess) {
      return <LaunchGateExperience locale={resolvedLocale} />;
    }
  }

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

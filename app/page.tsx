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

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const homepageData = await getHomepageData();
  const heroPreview = homepageData.hero ? toHomeSpotlight(homepageData.hero, "Hero pick") : null;
  const trendingPerfumes = homepageData.trending.map((perfume) =>
    toHomeSpotlight(perfume, "Trending"),
  );

  return (
    <>
      <Hero preview={heroPreview} />

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

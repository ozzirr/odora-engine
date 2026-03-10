import { Container } from "@/components/layout/Container";
import { DiscoveryCollections } from "@/components/home/DiscoveryCollections";
import { FeaturedPerfumes } from "@/components/home/FeaturedPerfumes";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { QuickFilters } from "@/components/home/QuickFilters";
import { TrendingNow } from "@/components/home/TrendingNow";
import { TrustedStores } from "@/components/home/TrustedStores";
import { getCatalogVisibilityWhere, logCatalogQueryError, mergePerfumeWhere } from "@/lib/catalog";
import {
  excludePerfumes,
  homepagePerfumeInclude,
  selectHeroPerfume,
  selectTrendingPerfumes,
  selectTrustedStores,
  sortFeaturedPerfumes,
  toHomeSpotlight,
  toPerfumeCardItem,
  type HomePerfumeRecord,
} from "@/lib/homepage";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getHomepagePerfumes(): Promise<HomePerfumeRecord[]> {
  if (!isDatabaseConfigured) {
    return [];
  }

  try {
    const perfumes = await prisma.perfume.findMany({
      where: mergePerfumeWhere(undefined, getCatalogVisibilityWhere()),
      take: 18,
      orderBy: [{ ratingInternal: "desc" }, { createdAt: "desc" }],
      include: homepagePerfumeInclude,
    });

    return perfumes as HomePerfumeRecord[];
  } catch (error) {
    logCatalogQueryError("home:homepage", error);
    return [];
  }
}

export default async function HomePage() {
  const homepagePerfumes = await getHomepagePerfumes();
  const sortedHomepagePerfumes = sortFeaturedPerfumes(homepagePerfumes);
  const trendingPerfumeRecords = selectTrendingPerfumes(homepagePerfumes, 4);
  const featuredPerfumes = excludePerfumes(sortedHomepagePerfumes, trendingPerfumeRecords);
  const heroPerfume = selectHeroPerfume(homepagePerfumes, trendingPerfumeRecords, sortedHomepagePerfumes);
  const heroPreview = heroPerfume ? toHomeSpotlight(heroPerfume, "Best price") : null;
  const trendingPerfumes = trendingPerfumeRecords.map((perfume) => toHomeSpotlight(perfume));
  const trustedStores = selectTrustedStores(homepagePerfumes, 4);

  return (
    <>
      <Hero preview={heroPreview} />

      <Container>
        <TrendingNow perfumes={trendingPerfumes} />
        <FeaturedPerfumes perfumes={featuredPerfumes.slice(0, 6).map(toPerfumeCardItem)} />
        <QuickFilters />
        <HowItWorks />
        <TrustedStores stores={trustedStores} />
        <DiscoveryCollections />
      </Container>
    </>
  );
}

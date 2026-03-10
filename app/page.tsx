import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { FeaturedPerfumes } from "@/components/home/FeaturedPerfumes";
import { Hero } from "@/components/home/Hero";
import { QuickFilters } from "@/components/home/QuickFilters";
import type { PerfumeCardItem } from "@/components/perfumes/PerfumeCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getCatalogVisibilityWhere, logCatalogQueryError, mergePerfumeWhere } from "@/lib/catalog";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { trendingPreviewCards } from "@/lib/sample-data";

export const dynamic = "force-dynamic";

async function getFeaturedPerfumes(): Promise<PerfumeCardItem[]> {
  if (!isDatabaseConfigured) {
    return [];
  }

  try {
    const perfumes = await prisma.perfume.findMany({
      where: mergePerfumeWhere(undefined, getCatalogVisibilityWhere()),
      take: 6,
      orderBy: [{ ratingInternal: "desc" }, { createdAt: "desc" }],
      include: {
        brand: true,
        offers: {
          select: {
            priceAmount: true,
            currency: true,
          },
          orderBy: {
            priceAmount: "asc",
          },
          take: 1,
        },
      },
    });

    return perfumes;
  } catch (error) {
    logCatalogQueryError("home:featured", error);
    return [];
  }
}

export default async function HomePage() {
  const featuredPerfumes = await getFeaturedPerfumes();

  return (
    <>
      <Hero />

      <Container>
        <FeaturedPerfumes perfumes={featuredPerfumes} />
        <QuickFilters />

        <section className="mt-16 space-y-6">
          <SectionTitle
            eyebrow="Trending now"
            title="Editorial previews"
            subtitle="Quick reads and category views to inspire your next pick."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {trendingPreviewCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="rounded-2xl border border-[#dfd1bf] bg-white p-5 transition-transform hover:-translate-y-0.5"
              >
                <h3 className="font-display text-2xl text-[#1f1914]">{card.title}</h3>
                <p className="mt-2 text-sm text-[#5f4f40]">{card.description}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#816f5c]">
                  Explore
                </p>
              </Link>
            ))}
          </div>
        </section>
      </Container>
    </>
  );
}

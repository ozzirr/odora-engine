import type { Metadata } from "next";

import { FinderExperience } from "@/components/finder/FinderExperience";
import { Container } from "@/components/layout/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getCatalogVisibilityWhere, mergePerfumeWhere } from "@/lib/catalog";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Fragrance Finder | Odora",
  description:
    "Use Odora Finder to match perfumes by mood, season, budget, note preferences, and fragrance style.",
};

export const dynamic = "force-dynamic";

async function getFinderPerfumes() {
  if (!isDatabaseConfigured) {
    return [];
  }

  return prisma.perfume.findMany({
    where: mergePerfumeWhere(undefined, getCatalogVisibilityWhere()),
    include: {
      brand: true,
      offers: {
        include: {
          store: true,
        },
      },
      notes: {
        include: {
          note: {
            select: {
              slug: true,
            },
          },
        },
      },
      moods: {
        include: {
          mood: {
            select: {
              slug: true,
            },
          },
        },
      },
      seasons: {
        include: {
          season: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });
}

export default async function FinderPage() {
  const perfumes = await getFinderPerfumes();

  return (
    <Container className="space-y-8 pt-14">
      <SectionTitle
        eyebrow="Finder MVP"
        title="Find your next fragrance in minutes"
        subtitle="Set your preferences across mood, season, budget, and notes to discover perfumes that match your style."
      />

      <FinderExperience perfumes={perfumes} />
    </Container>
  );
}

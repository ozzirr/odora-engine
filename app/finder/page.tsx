import type { Metadata } from "next";

import { FinderExperience } from "@/components/finder/FinderExperience";
import { Container } from "@/components/layout/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  getCatalogVisibilityWhere,
  logCatalogQueryError,
  mergePerfumeWhere,
} from "@/lib/catalog";
import { buildFinderPreferencesFromInput } from "@/lib/finder";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { getIsAuthenticated } from "@/lib/supabase/auth-state";

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
        occasions: {
          include: {
            occasion: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    logCatalogQueryError("finder:list", error);
    return [];
  }
}

type FinderPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function FinderPage({ searchParams }: FinderPageProps) {
  const resolvedSearchParams = await searchParams;
  const isAuthenticated = await getIsAuthenticated();
  const perfumes = await getFinderPerfumes();
  const initialPreferences = buildFinderPreferencesFromInput({
    gender: readSearchParam(resolvedSearchParams, "gender") ?? null,
    mood: readSearchParam(resolvedSearchParams, "mood") ?? null,
    season: readSearchParam(resolvedSearchParams, "season") ?? null,
    occasion: readSearchParam(resolvedSearchParams, "occasion") ?? null,
    budget: readSearchParam(resolvedSearchParams, "budget") ?? null,
    preferredNote: readSearchParam(resolvedSearchParams, "preferredNote") ?? null,
    arabicOnly: readSearchParam(resolvedSearchParams, "arabicOnly") ?? null,
    nicheOnly: readSearchParam(resolvedSearchParams, "nicheOnly") ?? null,
  });
  const presetLabel = readSearchParam(resolvedSearchParams, "preset") ?? null;

  return (
    <Container className="space-y-8 pt-14">
      <SectionTitle
        eyebrow="Finder MVP"
        title="Find your next fragrance in minutes"
        subtitle="Set your preferences across mood, season, budget, and notes to discover perfumes that match your style."
      />

      <FinderExperience
        perfumes={perfumes}
        isAuthenticated={isAuthenticated}
        initialPreferences={initialPreferences}
        presetLabel={presetLabel}
      />
    </Container>
  );
}

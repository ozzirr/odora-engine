import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { FinderExperience } from "@/components/finder/FinderExperience";
import { Container } from "@/components/layout/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  getCatalogVisibilityWhere,
  logCatalogQueryError,
  mergePerfumeWhere,
} from "@/lib/catalog";
import { buildFinderPreferencesFromInput } from "@/lib/finder";
import { getAlternateLinks, hasLocale } from "@/lib/i18n";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { getIsAuthenticated } from "@/lib/supabase/auth-state";

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
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: FinderPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.finder" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: getAlternateLinks("/finder")[resolvedLocale],
      languages: getAlternateLinks("/finder"),
    },
  };
}

export default async function FinderPage({ params, searchParams }: FinderPageProps) {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "finder.page" });
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
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
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

import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";

import { FinderExperience } from "@/components/finder/FinderExperience";
import { Container } from "@/components/layout/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { PUBLIC_CACHE_TAGS } from "@/lib/cache-tags";
import { logCatalogQueryError } from "@/lib/catalog";
import { buildFinderPreferencesFromInput } from "@/lib/finder";
import { getAlternateLinks, hasLocale } from "@/lib/i18n";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export const revalidate = 3600;

type FinderOptions = {
  moods: string[];
  seasons: string[];
  occasions: string[];
  notes: string[];
};

function getEmptyFinderOptions(): FinderOptions {
  return {
    moods: [],
    seasons: [],
    occasions: [],
    notes: [],
  };
}

const getCachedFinderOptions = unstable_cache(async (): Promise<FinderOptions> => {
  if (!isDatabaseConfigured) {
    return getEmptyFinderOptions();
  }

  try {
    const [moods, seasons, occasions, notes] = await Promise.all([
      prisma.mood.findMany({
        select: { slug: true },
        orderBy: { slug: "asc" },
      }),
      prisma.season.findMany({
        select: { slug: true },
        orderBy: { slug: "asc" },
      }),
      prisma.occasion.findMany({
        select: { slug: true },
        orderBy: { slug: "asc" },
      }),
      prisma.note.findMany({
        select: { slug: true },
        orderBy: { slug: "asc" },
        take: 80,
      }),
    ]);

    return {
      moods: moods.map((item) => item.slug),
      seasons: seasons.map((item) => item.slug),
      occasions: occasions.map((item) => item.slug),
      notes: notes.map((item) => item.slug),
    };
  } catch (error) {
    logCatalogQueryError("finder:options", error);
    return getEmptyFinderOptions();
  }
}, ["finder-options"], {
  revalidate: 21600,
  tags: [PUBLIC_CACHE_TAGS.finderOptions],
});

async function getFinderOptions() {
  return getCachedFinderOptions();
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
  const finderOptions = await getFinderOptions();
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
        availableOptions={finderOptions}
        isAuthenticated={false}
        initialPreferences={initialPreferences}
        presetLabel={presetLabel}
      />
    </Container>
  );
}

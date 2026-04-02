import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";

import { FinderExperience } from "@/components/finder/FinderExperience";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { StructuredData } from "@/components/seo/StructuredData";
import { ExpandableSeoIntro } from "@/components/ui/ExpandableSeoIntro";
import { PUBLIC_CACHE_TAGS } from "@/lib/cache-tags";
import { logCatalogQueryError } from "@/lib/catalog";
import {
  buildFinderPreferencesFromInput,
  hasConfiguredFinderPreferences,
} from "@/lib/finder";
import { FINDER_RESULTS_PAGE_SIZE, getFinderSearch } from "@/lib/finder-search";
import { getLocalizedPathname, hasLocale, type AppLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";
import { isDatabaseConfigured, prisma, runPrismaOperations } from "@/lib/prisma";
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
} from "@/lib/structured-data";
import { getIsAuthenticated } from "@/lib/supabase/auth-state";

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
    const [moods, seasons, occasions, notes] = await runPrismaOperations([
      () =>
        prisma.mood.findMany({
          select: { slug: true },
          orderBy: { slug: "asc" },
        }),
      () =>
        prisma.season.findMany({
          select: { slug: true },
          orderBy: { slug: "asc" },
        }),
      () =>
        prisma.occasion.findMany({
          select: { slug: true },
          orderBy: { slug: "asc" },
        }),
      () =>
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

function isFinderSubmitted(searchParams: Record<string, string | string[] | undefined>) {
  const raw = readSearchParam(searchParams, "submitted");
  return raw === "1" || raw === "true";
}

export async function generateMetadata({ params, searchParams }: FinderPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.finder" });
  const resolvedSearchParams = await searchParams;
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
  const hasConfiguredPreferences = hasConfiguredFinderPreferences(initialPreferences);
  const hasSubmittedSearch = isFinderSubmitted(resolvedSearchParams);
  const shouldLoadResults = hasConfiguredPreferences || hasSubmittedSearch;

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: resolvedLocale,
    pathname: "/finder",
    robots: shouldLoadResults
      ? {
          index: false,
          follow: true,
        }
      : undefined,
  });
}

export default async function FinderPage({ params, searchParams }: FinderPageProps) {
  const { locale } = await params;
  const resolvedLocale = (hasLocale(locale) ? locale : "en") as AppLocale;
  const t = await getTranslations({ locale: resolvedLocale, namespace: "finder.page" });
  const navT = await getTranslations({ locale: resolvedLocale, namespace: "layout.header.nav" });
  const resolvedSearchParams = await searchParams;
  const finderOptions = await getFinderOptions();
  const isAuthenticated = await getIsAuthenticated();
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
  const hasConfiguredPreferences = hasConfiguredFinderPreferences(initialPreferences);
  const hasSubmittedSearch = isFinderSubmitted(resolvedSearchParams);
  const shouldLoadResults = hasConfiguredPreferences || hasSubmittedSearch;
  const initialSearchResult = shouldLoadResults
    ? await getFinderSearch(initialPreferences, 0, FINDER_RESULTS_PAGE_SIZE)
    : {
        results: [],
        total: 0,
        hasMore: false,
        nextOffset: 0,
      };
  const finderPath = getLocalizedPathname(resolvedLocale, "/finder");
  const breadcrumbItems = [
    { label: navT("home"), href: "/" as const },
    { label: navT("finder") },
  ];

  return (
    <Container className="space-y-6 pt-6 sm:space-y-8 sm:pt-8">
      {!shouldLoadResults ? (
        <StructuredData
          data={[
            buildCollectionPageSchema({
              name: t("title"),
              description: t("subtitle"),
              path: finderPath,
              locale: resolvedLocale,
            }),
            buildBreadcrumbSchema([
              { name: navT("home"), path: getLocalizedPathname(resolvedLocale, "/") },
              { name: navT("finder"), path: finderPath },
            ]),
          ]}
        />
      ) : null}

      <Breadcrumbs items={breadcrumbItems} className="mb-0" />

      <section className="space-y-4 rounded-3xl border border-[#dfd1bf] bg-white p-6 shadow-[0_20px_45px_-38px_rgba(48,34,20,0.24)] sm:p-8">
        <ExpandableSeoIntro
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
          body={[t("bodyOne"), t("bodyTwo")]}
          primaryCta={{ href: "/perfumes", label: t("primaryCta") }}
          secondaryCta={{ href: "/top", label: t("secondaryCta"), variant: "secondary" }}
        />
      </section>

      <FinderExperience
        availableOptions={finderOptions}
        isAuthenticated={isAuthenticated}
        initialPreferences={initialPreferences}
        initialResults={initialSearchResult.results}
        initialTotal={initialSearchResult.total}
        initialHasMore={initialSearchResult.hasMore}
        initialNextOffset={initialSearchResult.nextOffset}
        initialSubmitted={shouldLoadResults}
        presetLabel={presetLabel}
      />
    </Container>
  );
}

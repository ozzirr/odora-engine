import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { FinderExperience } from "@/components/finder/FinderExperience";
import { ScopedIntlProvider } from "@/components/i18n/ScopedIntlProvider";
import { Container } from "@/components/layout/Container";
import { StructuredData } from "@/components/seo/StructuredData";
import { ExpandableSeoIntro } from "@/components/ui/ExpandableSeoIntro";
import { PUBLIC_CACHE_TAGS } from "@/lib/cache-tags";
import { logCatalogQueryError } from "@/lib/catalog";
import { DEPLOY_ID } from "@/lib/deploy-id";
import {
  buildFinderPreferencesFromInput,
  hasConfiguredFinderPreferences,
} from "@/lib/finder";
import { getFinderPreset } from "@/lib/finder-presets";
import { FINDER_RESULTS_PAGE_SIZE, getFinderSearch } from "@/lib/finder-search";
import { getLocalizedPathname, hasLocale, type AppLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";
import { isDatabaseConfigured, prisma, withDatabaseRetry } from "@/lib/prisma";
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

async function getFinderOptionSlugs(
  label: keyof FinderOptions,
  loader: () => Promise<Array<{ slug: string }>>,
) {
  try {
    const rows = await withDatabaseRetry(loader);
    return {
      values: rows.map((item) => item.slug),
      ok: true,
    };
  } catch (error) {
    logCatalogQueryError(`finder:options:${label}`, error);
    return {
      values: [],
      ok: false,
    };
  }
}

async function getFinderOptionsUncached(): Promise<FinderOptions> {
  if (!isDatabaseConfigured) {
    return getEmptyFinderOptions();
  }

  const [moods, seasons, occasions, notes] = await Promise.all([
    getFinderOptionSlugs("moods", () =>
      prisma.mood.findMany({
        select: { slug: true },
        orderBy: { slug: "asc" },
      }),
    ),
    getFinderOptionSlugs("seasons", () =>
      prisma.season.findMany({
        select: { slug: true },
        orderBy: { slug: "asc" },
      }),
    ),
    getFinderOptionSlugs("occasions", () =>
      prisma.occasion.findMany({
        select: { slug: true },
        orderBy: { slug: "asc" },
      }),
    ),
    getFinderOptionSlugs("notes", () =>
      prisma.note.findMany({
        select: { slug: true },
        orderBy: { slug: "asc" },
        take: 80,
      }),
    ),
  ]);

  if (![moods, seasons, occasions, notes].some((entry) => entry.ok)) {
    throw new Error("Finder options unavailable for all taxonomies.");
  }

  return {
    moods: moods.values,
    seasons: seasons.values,
    occasions: occasions.values,
    notes: notes.values,
  };
}

const getCachedFinderOptions = unstable_cache(async (): Promise<FinderOptions> => {
  return getFinderOptionsUncached();
}, [DEPLOY_ID, "finder-options"], {
  revalidate: 21600,
  tags: [PUBLIC_CACHE_TAGS.catalog, PUBLIC_CACHE_TAGS.finderOptions],
});

async function getFinderOptions() {
  try {
    return await getCachedFinderOptions();
  } catch (error) {
    logCatalogQueryError("finder:options", error);
    return getEmptyFinderOptions();
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
  const presetLabel = readSearchParam(resolvedSearchParams, "preset") ?? null;
  const presetConfig = getFinderPreset(presetLabel);
  const hasOtherFilterParams = [
    "gender",
    "mood",
    "season",
    "occasion",
    "budget",
    "preferredNote",
    "arabicOnly",
    "nicheOnly",
  ].some((key) => Boolean(readSearchParam(resolvedSearchParams, key)));

  if (presetConfig && !hasOtherFilterParams) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(presetConfig)) {
      if (value) params.set(key, value);
    }
    redirect(`${getLocalizedPathname(resolvedLocale, "/finder")}?${params.toString()}`);
  }

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

      <ScopedIntlProvider
        locale={resolvedLocale}
        namespaces={["common", "finder", "catalog", "perfume", "taxonomy"]}
      >
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
      </ScopedIntlProvider>
    </Container>
  );
}

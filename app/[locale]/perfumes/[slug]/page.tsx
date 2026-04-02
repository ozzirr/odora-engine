import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { type Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/layout/Container";
import { AmazonCalloutCard } from "@/components/perfumes/AmazonCalloutCard";
import { MoodBadges } from "@/components/perfumes/MoodBadges";
import { PerfumeDetailNavigationReady } from "@/components/perfumes/PerfumeDetailNavigationReady";
import { NotesList } from "@/components/perfumes/NotesList";
import { OfferTable } from "@/components/perfumes/OfferTable";
import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import { PerfumeHero } from "@/components/perfumes/PerfumeHero";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { StructuredData } from "@/components/seo/StructuredData";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { PUBLIC_CACHE_TAGS, getPerfumeDetailTag } from "@/lib/cache-tags";
import {
  getCatalogVisibilityWhereForMode,
  logCatalogQueryError,
  mergePerfumeWhere,
  resolveCatalogMode,
  type CatalogMode,
} from "@/lib/catalog";
import { getCheaperAlternatives, getPerfumeNotes, getSimilarPerfumes } from "@/lib/discovery";
import { getPopularPerfumeSlugs } from "@/lib/homepage";
import { getLocalizedPathname, hasLocale, type AppLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";
import { getPerfumeOverviewText, getPerfumeShortText } from "@/lib/perfume-text";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { computeBestOffer } from "@/lib/pricing";
import { buildBreadcrumbSchema, buildProductSchema } from "@/lib/structured-data";
import { formatCurrency } from "@/lib/utils";

type PerfumeDetailPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export const revalidate = 1800;

const perfumeDetailInclude = {
  brand: true,
  notes: {
    include: {
      note: true,
    },
  },
  moods: {
    include: {
      mood: true,
    },
    orderBy: {
      weight: "desc",
    },
  },
  seasons: {
    include: {
      season: true,
    },
    orderBy: {
      weight: "desc",
    },
  },
  occasions: {
    include: {
      occasion: true,
    },
    orderBy: {
      weight: "desc",
    },
  },
  offers: {
    include: {
      store: true,
    },
  },
} satisfies Prisma.PerfumeInclude;

const perfumeDiscoveryInclude = {
  brand: true,
  notes: {
    include: {
      note: true,
    },
  },
  moods: {
    include: {
      mood: true,
    },
  },
  offers: {
    include: {
      store: true,
    },
  },
} satisfies Prisma.PerfumeInclude;

async function getPerfumeRecordBySlugUncached(slug: string, catalogMode: CatalogMode) {
  if (!isDatabaseConfigured) {
    return null;
  }

  const visibilityWhere = getCatalogVisibilityWhereForMode(catalogMode);

  return prisma.perfume.findFirst({
    where: mergePerfumeWhere({ slug }, visibilityWhere),
    include: perfumeDetailInclude,
  });
}

async function getPerfumeRecordBySlug(slug: string) {
  const catalogMode = resolveCatalogMode();

  return unstable_cache(
    async () => getPerfumeRecordBySlugUncached(slug, catalogMode),
    ["perfume-record", catalogMode, slug],
    {
      revalidate: 1800,
      tags: [
        PUBLIC_CACHE_TAGS.catalog,
        PUBLIC_CACHE_TAGS.perfumeDetail,
        getPerfumeDetailTag(slug),
      ],
    },
  )();
}

async function getPerfumePageDataUncached(slug: string, catalogMode: CatalogMode) {
  if (!isDatabaseConfigured) {
    return null;
  }

  const visibilityWhere = getCatalogVisibilityWhereForMode(catalogMode);

  try {
    const perfume = await getPerfumeRecordBySlugUncached(slug, catalogMode);

    if (!perfume) {
      return null;
    }

    const noteSlugs = Array.from(
      new Set(
        perfume.notes
          .map((item) => item.note?.slug)
          .filter((value): value is string => Boolean(value)),
      ),
    ).slice(0, 8);
    const moodSlugs = Array.from(
      new Set(
        perfume.moods
          .map((item) => item.mood?.slug)
          .filter((value): value is string => Boolean(value)),
      ),
    ).slice(0, 5);
    const discoveryClauses: Prisma.PerfumeWhereInput[] = [
      { fragranceFamily: perfume.fragranceFamily },
      { gender: perfume.gender },
      { isArabic: perfume.isArabic },
      { isNiche: perfume.isNiche },
      ...(moodSlugs.length > 0
        ? [
            {
              moods: {
                some: {
                  mood: {
                    slug: {
                      in: moodSlugs,
                    },
                  },
                },
              },
            } satisfies Prisma.PerfumeWhereInput,
          ]
        : []),
      ...(noteSlugs.length > 0
        ? [
            {
              notes: {
                some: {
                  note: {
                    slug: {
                      in: noteSlugs,
                    },
                  },
                },
              },
            } satisfies Prisma.PerfumeWhereInput,
          ]
        : []),
    ];

    const allPerfumes = await prisma.perfume.findMany({
      where: mergePerfumeWhere(
        {
          id: {
            not: perfume.id,
          },
          OR: discoveryClauses,
        },
        visibilityWhere,
      ),
      include: perfumeDiscoveryInclude,
      orderBy: [{ ratingInternal: "desc" }, { updatedAt: "desc" }],
      take: 120,
    });

    return {
      perfume,
      allPerfumes,
    };
  } catch (error) {
    logCatalogQueryError("perfumes:detail", error);
    return null;
  }
}

async function getPerfumePageData(slug: string) {
  const catalogMode = resolveCatalogMode();

  return unstable_cache(
    async () => getPerfumePageDataUncached(slug, catalogMode),
    ["perfume-page", catalogMode, slug],
    {
      revalidate: 1800,
      tags: [
        PUBLIC_CACHE_TAGS.catalog,
        PUBLIC_CACHE_TAGS.perfumeDetail,
        getPerfumeDetailTag(slug),
      ],
    },
  )();
}

export async function generateStaticParams() {
  const slugs = await getPopularPerfumeSlugs(24);

  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PerfumeDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const resolvedLocale = (hasLocale(locale) ? locale : "en") as AppLocale;
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.perfumeDetail" });

  if (!isDatabaseConfigured) {
    return buildPageMetadata({
      title: t("fallbackTitle"),
      description: t("fallbackDescription"),
      locale: resolvedLocale,
      pathname: "/perfumes/[slug]",
      params: { slug },
    });
  }

  try {
    const perfume = await getPerfumeRecordBySlug(slug);

    if (!perfume) {
      return buildPageMetadata({
        title: t("notFoundTitle"),
        locale: resolvedLocale,
        pathname: "/perfumes/[slug]",
        params: { slug },
      });
    }

    return buildPageMetadata({
      title: t("title", {
        name: perfume.name,
        brand: perfume.brand?.name ?? t("unknownBrand"),
      }),
      description: getPerfumeShortText(perfume),
      locale: resolvedLocale,
      pathname: "/perfumes/[slug]",
      params: { slug },
      image: perfume.imageUrl,
    });
  } catch (error) {
    logCatalogQueryError("perfumes:metadata", error);
    return buildPageMetadata({
      title: t("fallbackTitle"),
      description: t("fallbackDescription"),
      locale: resolvedLocale,
      pathname: "/perfumes/[slug]",
      params: { slug },
    });
  }
}

export default async function PerfumeDetailPage({ params }: PerfumeDetailPageProps) {
  const { locale, slug } = await params;
  const resolvedLocale = (hasLocale(locale) ? locale : "en") as AppLocale;
  const t = await getTranslations({ locale: resolvedLocale, namespace: "perfume.detail" });
  const navT = await getTranslations({ locale: resolvedLocale, namespace: "layout.header.nav" });
  const data = await getPerfumePageData(slug);

  if (!data) {
    notFound();
  }

  const { perfume, allPerfumes } = data;

  const bestOffer = computeBestOffer(perfume.offers);
  const similarPerfumes = getSimilarPerfumes(perfume, allPerfumes, 4);
  const cheaperAlternatives = getCheaperAlternatives(perfume, allPerfumes, 4);
  const groupedNotes = getPerfumeNotes(perfume);
  const notesForRender = [
    ...groupedNotes.top.map((note) => ({ ...note, noteType: "TOP" })),
    ...groupedNotes.heart.map((note) => ({ ...note, noteType: "HEART" })),
    ...groupedNotes.base.map((note) => ({ ...note, noteType: "BASE" })),
  ];

  const currentTotal = bestOffer?.bestTotalPrice ?? null;
  const alternativeSavings = cheaperAlternatives
    .map((alternative) => {
      const alternativeBest = computeBestOffer(alternative.offers);
      if (!alternativeBest || currentTotal == null) {
        return null;
      }
      const savings = currentTotal - alternativeBest.bestTotalPrice;
      return savings > 0 ? savings : null;
    })
    .filter((value): value is number => value != null);

  const topSavings = alternativeSavings.length > 0 ? Math.max(...alternativeSavings) : null;
  const cheaperAlternativesSubtitle = topSavings
    ? t("cheaperAlternativesSavings", {
        savings: formatCurrency(topSavings, bestOffer?.bestCurrency ?? "EUR", resolvedLocale),
      })
    : t("cheaperAlternativesSubtitle");
  const overviewText = getPerfumeOverviewText(perfume, {
    family: t("overviewLabels.family"),
    notes: t("overviewLabels.notes"),
    moods: t("overviewLabels.moods"),
    occasions: t("overviewLabels.occasions"),
  });
  const detailPath = getLocalizedPathname(resolvedLocale, "/perfumes/[slug]", { slug });
  const perfumesPath = getLocalizedPathname(resolvedLocale, "/perfumes");
  const brandName = perfume.brand?.name ?? t("unknown");
  const breadcrumbItems = [
    { label: navT("home"), href: "/" as const },
    { label: navT("perfumes"), href: "/perfumes" as const },
    { label: perfume.name },
  ];

  return (
    <>
      <StructuredData
        data={[
          buildBreadcrumbSchema([
            { name: navT("home"), path: getLocalizedPathname(resolvedLocale, "/") },
            { name: navT("perfumes"), path: perfumesPath },
            { name: perfume.name, path: detailPath },
          ]),
          buildProductSchema({
            name: perfume.name,
            description: overviewText,
            path: detailPath,
            image: perfume.imageUrl,
            brandName,
            category: perfume.fragranceFamily,
            currency: bestOffer?.bestCurrency ?? null,
            price: bestOffer?.bestTotalPrice ?? null,
            offerUrl: bestOffer?.bestUrl ?? null,
          }),
        ]}
      />
      <PerfumeDetailNavigationReady />
      <Container className="space-y-9 pt-8 pb-40 md:space-y-10 md:pt-10 md:pb-10">
        <Breadcrumbs items={breadcrumbItems} />
        <PerfumeHero perfume={perfume} bestOffer={bestOffer} />

        <section className="space-y-4">
          <SectionTitle
            eyebrow={t("prices.eyebrow")}
            title={t("prices.title")}
            subtitle={t("prices.subtitle")}
          />
          <OfferTable offers={perfume.offers} />
        </section>

        <section className="rounded-2xl border border-[#ddcfbc] bg-white p-6">
          <SectionTitle eyebrow={t("overview.eyebrow")} title={t("overview.title")} subtitle={overviewText} />
        </section>

        <section className="space-y-4">
          <SectionTitle
            eyebrow={t("notes.eyebrow")}
            title={t("notes.title")}
            subtitle={t("notes.subtitle")}
          />
          <NotesList notes={notesForRender} />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <MoodBadges
            title={t("badges.moods")}
            items={(perfume.moods ?? []).map((item) => ({
              name: item.mood?.name ?? t("unknown"),
              weight: item.weight,
            }))}
          />
          <MoodBadges
            title={t("badges.seasons")}
            items={(perfume.seasons ?? []).map((item) => ({
              name: item.season?.name ?? t("unknown"),
              weight: item.weight,
            }))}
          />
          <MoodBadges
            title={t("badges.occasions")}
            items={(perfume.occasions ?? []).map((item) => ({
              name: item.occasion?.name ?? t("unknown"),
              weight: item.weight,
            }))}
          />
        </section>

        <AmazonCalloutCard
          perfumeName={perfume.name}
          brandName={perfume.brand?.name}
          amazonUrl={perfume.amazonUrl}
          perfumeSlug={perfume.slug}
        />

        <section className="space-y-4">
          <SectionTitle
            eyebrow={t("value.eyebrow")}
            title={t("value.title")}
            subtitle={cheaperAlternativesSubtitle}
          />
          <PerfumeGrid perfumes={cheaperAlternatives} />
        </section>

        <section className="space-y-4 pb-4 md:pb-6">
          <SectionTitle
            eyebrow={t("discovery.eyebrow")}
            title={t("discovery.title")}
            subtitle={t("discovery.subtitle")}
          />
          <PerfumeGrid perfumes={similarPerfumes} />
        </section>
      </Container>
    </>
  );
}

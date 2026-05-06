import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { type Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ScopedIntlProvider } from "@/components/i18n/ScopedIntlProvider";
import { Container } from "@/components/layout/Container";
import { AddToListButton } from "@/components/perfumes/AddToListButton";
import { MoodBadges } from "@/components/perfumes/MoodBadges";
import { OlfactoryPyramidCard } from "@/components/perfumes/OlfactoryPyramidCard";
import { PerfumeDetailNavigationReady } from "@/components/perfumes/PerfumeDetailNavigationReady";
import { PerfumeDetailReadyScrollRestore } from "@/components/perfumes/PerfumeDetailScrollMemory";
import { PerfumeCommunitySection } from "@/components/perfumes/PerfumeCommunitySection";
import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import { PerfumeHero } from "@/components/perfumes/PerfumeHero";
import { PriceAlertCard } from "@/components/perfumes/PriceAlertCard";
import { PriceCard } from "@/components/perfumes/PriceCard";
import { FaqSection } from "@/components/seo/FaqSection";
import { StructuredData } from "@/components/seo/StructuredData";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getAmazonProductUrl } from "@/lib/amazon";
import { PUBLIC_CACHE_TAGS, getPerfumeDetailTag } from "@/lib/cache-tags";
import {
  getCatalogVisibilityWhereForMode,
  logCatalogQueryError,
  mergePerfumeWhere,
  resolveCatalogMode,
  type CatalogMode,
} from "@/lib/catalog";
import { getCheaperAlternatives, getPerfumeNotes, getSimilarPerfumes } from "@/lib/discovery";
import { getLocalizedPathname, hasLocale, type AppLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";
import { ensureAppUser, getUserPerfumeListsForPerfume } from "@/lib/perfume-lists";
import { isPerfumeEligibleForSearchIndex } from "@/lib/perfume-seo";
import { getPerfumeOverviewText, getPerfumeShortText } from "@/lib/perfume-text";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { computeBestOffer } from "@/lib/pricing";
import { buildBreadcrumbSchema, buildFaqSchema, buildProductSchema } from "@/lib/structured-data";
import { getCurrentUser } from "@/lib/supabase/auth-state";
import { buildPerfumeFaqItems } from "@/lib/perfume-faq";
import { getLocalizedTaxonomyLabel } from "@/lib/taxonomy-display";
import { formatCurrency } from "@/lib/utils";

type PerfumeDetailPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export const revalidate = 1800;
export const dynamic = "force-dynamic";

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
  id: true,
  slug: true,
  name: true,
  descriptionShort: true,
  imageUrl: true,
  fragranceFamily: true,
  gender: true,
  priceRange: true,
  isArabic: true,
  isNiche: true,
  ratingInternal: true,
  bestPriceAmount: true,
  bestTotalPriceAmount: true,
  bestCurrency: true,
  bestStoreName: true,
  bestOfferUrl: true,
  hasAvailableOffer: true,
  brand: true,
  notes: {
    select: {
      intensity: true,
      note: {
        select: {
          name: true,
          slug: true,
          noteType: true,
        },
      },
    },
  },
  moods: {
    select: {
      mood: {
        select: {
          slug: true,
        },
      },
    },
  },
} satisfies Prisma.PerfumeSelect;

const SYNTHETIC_REVIEWER_PREFIX = "odora-synthetic-reviewer-";

type PerfumeDetailRecord = Prisma.PerfumeGetPayload<{ include: typeof perfumeDetailInclude }>;
type CommunityReviewRecord = {
  id: number;
  userId: string;
  longevityScore: number;
  sillageScore: number;
  versatilityScore: number;
  text: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    countryCode: string | null;
  };
};

function hashNumber(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickDeterministic<T>(items: readonly T[], seed: number) {
  return items[seed % items.length];
}

function getMainNoteNames(perfume: PerfumeDetailRecord, count = 2) {
  return perfume.notes
    .slice()
    .sort((left, right) => (right.intensity ?? 0) - (left.intensity ?? 0))
    .slice(0, count)
    .map((item) => item.note?.name)
    .filter((name): name is string => Boolean(name));
}

function joinEnglishList(words: string[]) {
  if (words.length === 0) return "";
  if (words.length === 1) return words[0];
  if (words.length === 2) return `${words[0]} and ${words[1]}`;
  return `${words.slice(0, -1).join(", ")}, and ${words[words.length - 1]}`;
}

function buildEnglishSyntheticReview(perfume: PerfumeDetailRecord, review: CommunityReviewRecord) {
  const seed = hashNumber(`${perfume.id}:${review.userId}:${review.id}:en-review-v1`);
  const notes = joinEnglishList(getMainNoteNames(perfume, seed % 3 === 0 ? 3 : 2));
  const family = perfume.fragranceFamily.toLowerCase();
  const performance =
    review.longevityScore >= 8
      ? "It lasts longer than I expected, especially on fabric."
      : review.longevityScore <= 5
        ? "The longevity is moderate, so I would reapply it during a long day."
        : "The longevity feels balanced and easy to manage.";
  const sillage =
    review.sillageScore >= 8
      ? "The projection is noticeable, so I would keep the sprays controlled."
      : review.sillageScore <= 5
        ? "The trail stays close, which makes it comfortable in smaller spaces."
        : "The trail is present without taking over the room.";
  const context = pickDeterministic(
    [
      "I wore it for a normal day rather than just testing it on paper.",
      "I tested it across a few hours and paid attention to the drydown.",
      "I tried it outside and then again indoors, where the softer side came through.",
      "It made more sense on skin than from the opening spray alone.",
    ],
    seed,
  );
  const familySentence = family.includes("wood")
    ? "The woody side gives it structure and keeps it from feeling too simple."
    : family.includes("amber") || family.includes("oriental")
      ? "The warm side is the part that stays with me the most."
      : family.includes("fresh") || family.includes("citrus")
        ? "The fresh side keeps it clean without making it feel flat."
        : family.includes("floral")
          ? "The floral part feels polished rather than overly sweet."
          : "The overall profile is clear and easy to understand.";
  const noteSentence = notes
    ? `On my skin, the notes I notice most are ${notes}.`
    : "On my skin, the blend feels cleaner than the first spray suggests.";
  const priceSentence =
    perfume.priceRange === "LUXURY" || perfume.isNiche
      ? "At this price, I would still test it first, but the quality feels convincing."
      : "For the price range, it feels like a solid and wearable choice.";
  const closing = pickDeterministic(
    [
      "I would wear it again, mostly when I want something polished but not loud.",
      "It is not for every situation, but in the right mood it works well.",
      "I would recommend it to someone who likes this style and wants an easy reach.",
      "It feels reliable, especially if you already enjoy this fragrance family.",
    ],
    seed >> 3,
  );

  return [context, noteSentence, familySentence, performance, sillage, priceSentence, closing]
    .filter(Boolean)
    .slice(0, 4 + (seed % 3))
    .join(" ");
}

function localizeCommunityReviews(
  reviews: CommunityReviewRecord[],
  locale: AppLocale,
  perfume: PerfumeDetailRecord,
) {
  if (locale !== "en") {
    return reviews;
  }

  return reviews.map((review) => {
    if (!review.userId.startsWith(SYNTHETIC_REVIEWER_PREFIX)) {
      return review;
    }

    return {
      ...review,
      text: buildEnglishSyntheticReview(perfume, review),
    };
  });
}

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

  try {
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
      select: perfumeDiscoveryInclude,
      orderBy: [{ ratingInternal: "desc" }, { updatedAt: "desc" }],
      take: 48,
    });

    return {
      perfume,
      allPerfumes,
    };
  } catch (error) {
    logCatalogQueryError("perfumes:detail:discovery", error);
    return {
      perfume,
      allPerfumes: [],
    };
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

async function getPerfumeCommunityData(perfume: PerfumeDetailRecord, locale: AppLocale) {
  if (!prisma.perfumeReview || !prisma.perfumePurchasePrice) {
    return {
      stats: {
        reviewCount: 0,
        avgLongevity: null,
        avgSillage: null,
        avgVersatility: null,
        priceCount: 0,
        avgPrice: null,
        currency: "EUR",
      },
      reviews: [],
    };
  }

  const [reviewAggregates, priceAggregates, reviews] = await Promise.all([
    prisma.perfumeReview.aggregate({
      where: { perfumeId: perfume.id },
      _count: { _all: true },
      _avg: {
        longevityScore: true,
        sillageScore: true,
        versatilityScore: true,
      },
    }),
    prisma.perfumePurchasePrice.aggregate({
      where: { perfumeId: perfume.id, currency: "EUR" },
      _count: { _all: true },
      _avg: {
        priceAmount: true,
      },
    }),
    prisma.perfumeReview.findMany({
      where: { perfumeId: perfume.id, source: "user", text: { not: null } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        longevityScore: true,
        sillageScore: true,
        versatilityScore: true,
        text: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            countryCode: true,
          },
        },
      },
    }),
  ]);

  const localizedReviews = localizeCommunityReviews(reviews, locale, perfume);

  return {
    stats: {
      reviewCount: reviewAggregates._count._all,
      avgLongevity: reviewAggregates._avg.longevityScore,
      avgSillage: reviewAggregates._avg.sillageScore,
      avgVersatility: reviewAggregates._avg.versatilityScore,
      priceCount: priceAggregates._count._all,
      avgPrice: priceAggregates._avg.priceAmount,
      currency: "EUR",
    },
    reviews: localizedReviews,
  };
}

export async function generateMetadata({ params }: PerfumeDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const resolvedLocale = (hasLocale(locale) ? locale : "en") as AppLocale;
  const [t, taxonomyT] = await Promise.all([
    getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.perfumeDetail" }),
    getTranslations({ locale: resolvedLocale, namespace: "taxonomy" }),
  ]);

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
      description: getPerfumeShortText({
        ...perfume,
        fragranceFamily:
          getLocalizedTaxonomyLabel(perfume.fragranceFamily, "families", taxonomyT) || perfume.fragranceFamily,
        notes: perfume.notes?.map((item) => ({
          ...item,
          note: item.note
            ? {
                ...item.note,
                name: getLocalizedTaxonomyLabel(item.note.slug, "notes", taxonomyT) || item.note.name,
              }
            : item.note,
        })),
      }),
      locale: resolvedLocale,
      pathname: "/perfumes/[slug]",
      params: { slug },
      image: perfume.imageUrl,
      robots: isPerfumeEligibleForSearchIndex(perfume)
        ? undefined
        : {
            index: false,
            follow: true,
          },
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
  const taxonomyT = await getTranslations({ locale: resolvedLocale, namespace: "taxonomy" });
  const faqT = await getTranslations({ locale: resolvedLocale, namespace: "perfume.faq" });
  const [data, supabaseUser] = await Promise.all([getPerfumePageData(slug), getCurrentUser()]);

  if (!data) {
    notFound();
  }

  const { perfume, allPerfumes } = data;
  const appUser = supabaseUser ? await ensureAppUser(supabaseUser) : null;
  const userLists = appUser ? await getUserPerfumeListsForPerfume(appUser.id, perfume.id) : [];
  const priceAlert = appUser && prisma.perfumePriceAlert
    ? await prisma.perfumePriceAlert.findUnique({
        where: {
          userId_perfumeId: {
            userId: appUser.id,
            perfumeId: perfume.id,
          },
        },
        select: { active: true },
      })
    : null;
  const bestOffer = computeBestOffer(perfume.offers);
  const communityData = await getPerfumeCommunityData(perfume, resolvedLocale);
  const communityStats = {
    ...communityData.stats,
    avgLongevity: communityData.stats.avgLongevity ?? perfume.longevityScore ?? null,
    avgSillage: communityData.stats.avgSillage ?? perfume.sillageScore ?? null,
    avgVersatility: communityData.stats.avgVersatility ?? perfume.versatilityScore ?? null,
    avgPrice: communityData.stats.avgPrice ?? bestOffer?.bestTotalPrice ?? null,
    currency: communityData.stats.avgPrice != null
      ? communityData.stats.currency
      : bestOffer?.bestCurrency ?? communityData.stats.currency,
  };
  const similarPerfumes = getSimilarPerfumes(perfume, allPerfumes, 4);
  const similarIds = new Set(similarPerfumes.map((p) => p.id));
  const cheaperAlternatives = getCheaperAlternatives(perfume, allPerfumes, 4, similarIds);
  const groupedNotes = getPerfumeNotes(perfume);
  const notesForRender = [
    ...groupedNotes.top.map((note) => ({ ...note, noteType: "TOP" })),
    ...groupedNotes.heart.map((note) => ({ ...note, noteType: "HEART" })),
    ...groupedNotes.base.map((note) => ({ ...note, noteType: "BASE" })),
  ].map((note) => ({
    ...note,
    name: getLocalizedTaxonomyLabel(note.slug, "notes", taxonomyT) || note.name,
  }));

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
  const localizedPerfume = {
    ...perfume,
    fragranceFamily: getLocalizedTaxonomyLabel(perfume.fragranceFamily, "families", taxonomyT) || perfume.fragranceFamily,
    notes: perfume.notes?.map((item) => ({
      ...item,
      note: item.note
        ? {
            ...item.note,
            name: getLocalizedTaxonomyLabel(item.note.slug, "notes", taxonomyT) || item.note.name,
          }
        : item.note,
    })),
    moods: perfume.moods?.map((item) => ({
      ...item,
      mood: item.mood
        ? {
            ...item.mood,
            name: getLocalizedTaxonomyLabel(item.mood.slug, "moods", taxonomyT) || item.mood.name,
          }
        : item.mood,
    })),
    occasions: perfume.occasions?.map((item) => ({
      ...item,
      occasion: item.occasion
        ? {
            ...item.occasion,
            name: getLocalizedTaxonomyLabel(item.occasion.slug, "occasions", taxonomyT) || item.occasion.name,
          }
        : item.occasion,
    })),
  };
  const overviewText = getPerfumeOverviewText(localizedPerfume, {
    family: t("overviewLabels.family"),
    notes: t("overviewLabels.notes"),
    moods: t("overviewLabels.moods"),
    occasions: t("overviewLabels.occasions"),
  });
  const detailPath = getLocalizedPathname(resolvedLocale, "/perfumes/[slug]", { slug });
  const perfumesPath = getLocalizedPathname(resolvedLocale, "/perfumes");
  const brandName = perfume.brand?.name ?? t("unknown");
  const amazonUrl = getAmazonProductUrl({
    amazonUrl: perfume.amazonUrl,
    brandName,
    perfumeName: perfume.name,
    locale: resolvedLocale,
    perfumeSlug: perfume.slug,
  });
  const familyLabel =
    getLocalizedTaxonomyLabel(perfume.fragranceFamily, "families", taxonomyT) || perfume.fragranceFamily;
  const bestPriceLabel = bestOffer
    ? formatCurrency(bestOffer.bestTotalPrice, bestOffer.bestCurrency ?? "EUR", resolvedLocale)
    : null;
  const faqItems = buildPerfumeFaqItems(faqT, {
    name: perfume.name,
    brand: perfume.brand?.name ?? null,
    family: familyLabel,
    longevity: perfume.longevityScore ?? null,
    gender: perfume.gender ?? null,
    bestPriceLabel,
  });
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
            editorialReview:
              typeof perfume.ratingInternal === "number" && perfume.ratingInternal > 0
                ? {
                    ratingValue: perfume.ratingInternal,
                    bestRating: 5,
                    worstRating: 1,
                    reviewBody: overviewText,
                  }
                : null,
          }),
          ...(faqItems.length > 0 ? [buildFaqSchema(faqItems)] : []),
        ]}
      />
      <ScopedIntlProvider
        locale={resolvedLocale}
        namespaces={["catalog", "common", "perfume", "taxonomy"]}
      >
        <PerfumeDetailNavigationReady />
        <PerfumeDetailReadyScrollRestore />
        <Container className="space-y-6 pt-4 pb-40 md:space-y-8 md:pt-6 md:pb-10">
          <PerfumeHero
            perfume={perfume}
            reviewCount={communityStats.reviewCount}
            listAction={
              <AddToListButton
                perfumeId={perfume.id}
                isAuthenticated={Boolean(appUser)}
                lists={userLists}
                loginNextPath={detailPath}
                variant="compact"
                className="h-12 w-full"
              />
            }
          />

          <section className="rounded-[1.45rem] border border-[#ddcfbc] bg-white p-6 shadow-[0_18px_42px_-36px_rgba(53,39,27,0.28)]">
            <SectionTitle eyebrow={t("overview.eyebrow")} title={t("overview.title")} subtitle={overviewText} />
          </section>

          <OlfactoryPyramidCard notes={notesForRender} />

          <section className="grid gap-4 md:grid-cols-3">
            <MoodBadges
              title={t("badges.moods")}
              items={(perfume.moods ?? []).map((item) => ({
                name:
                  getLocalizedTaxonomyLabel(item.mood?.slug, "moods", taxonomyT) ||
                  item.mood?.name ||
                  t("unknown"),
                weight: item.weight,
              }))}
            />
            <MoodBadges
              title={t("badges.seasons")}
              items={(perfume.seasons ?? []).map((item) => ({
                name:
                  getLocalizedTaxonomyLabel(item.season?.slug, "seasons", taxonomyT) ||
                  item.season?.name ||
                  t("unknown"),
                weight: item.weight,
              }))}
            />
            <MoodBadges
              title={t("badges.occasions")}
              items={(perfume.occasions ?? []).map((item) => ({
                name:
                  getLocalizedTaxonomyLabel(item.occasion?.slug, "occasions", taxonomyT) ||
                  item.occasion?.name ||
                  t("unknown"),
                weight: item.weight,
              }))}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
            <PriceCard bestOffer={bestOffer} amazonUrl={amazonUrl} />

            <PriceAlertCard
              perfumeId={perfume.id}
              detailPath={detailPath}
              isAuthenticated={Boolean(appUser)}
              isActive={Boolean(priceAlert?.active)}
            />
          </section>

          <PerfumeCommunitySection
            perfumeId={perfume.id}
            detailPath={detailPath}
            isAuthenticated={Boolean(appUser)}
            locale={resolvedLocale}
            stats={communityStats}
            reviews={communityData.reviews}
            userCountryCode={appUser?.countryCode}
          />

          <section className="space-y-4">
            <SectionTitle
              eyebrow={t("value.eyebrow")}
              title={t("value.title")}
              subtitle={cheaperAlternativesSubtitle}
            />
            <PerfumeGrid perfumes={cheaperAlternatives} />
          </section>

          <section className="space-y-4">
            <SectionTitle
              eyebrow={t("discovery.eyebrow")}
              title={t("discovery.title")}
              subtitle={t("discovery.subtitle")}
            />
            <PerfumeGrid perfumes={similarPerfumes} />
          </section>

          <FaqSection
            eyebrow={faqT("eyebrow")}
            title={faqT("title", { name: perfume.name })}
            subtitle={faqT("subtitle")}
            items={faqItems}
          />
        </Container>
      </ScopedIntlProvider>
    </>
  );
}

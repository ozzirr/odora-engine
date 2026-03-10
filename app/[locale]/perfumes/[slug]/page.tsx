import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/layout/Container";
import { MoodBadges } from "@/components/perfumes/MoodBadges";
import { NotesList } from "@/components/perfumes/NotesList";
import { OfferTable } from "@/components/perfumes/OfferTable";
import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import { PerfumeHero } from "@/components/perfumes/PerfumeHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  getCatalogVisibilityWhere,
  logCatalogQueryError,
  mergePerfumeWhere,
} from "@/lib/catalog";
import { getCheaperAlternatives, getPerfumeNotes, getSimilarPerfumes } from "@/lib/discovery";
import { getPerfumeOverviewText, getPerfumeShortText } from "@/lib/perfume-text";
import { getAlternateLinks, hasLocale, type AppLocale } from "@/lib/i18n";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { computeBestOffer } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";

type PerfumeDetailPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

async function getPerfumePageData(slug: string) {
  if (!isDatabaseConfigured) {
    return null;
  }

  const visibilityWhere = getCatalogVisibilityWhere();

  try {
    const perfume = await prisma.perfume.findFirst({
      where: mergePerfumeWhere({ slug }, visibilityWhere),
      include: {
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
      },
    });

    if (!perfume) {
      return null;
    }

    const allPerfumes = await prisma.perfume.findMany({
      where: mergePerfumeWhere(
        {
          id: {
            not: perfume.id,
          },
        },
        visibilityWhere,
      ),
      include: {
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
      },
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

export async function generateMetadata({ params }: PerfumeDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const resolvedLocale = (hasLocale(locale) ? locale : "en") as AppLocale;
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.perfumeDetail" });

  if (!isDatabaseConfigured) {
    return {
      title: t("fallbackTitle"),
      description: t("fallbackDescription"),
    };
  }

  try {
    const perfume = await prisma.perfume.findFirst({
      where: mergePerfumeWhere({ slug }, getCatalogVisibilityWhere()),
      select: {
        name: true,
        descriptionShort: true,
        fragranceFamily: true,
        notes: {
          select: {
            intensity: true,
            note: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
          orderBy: [{ intensity: "desc" }, { id: "asc" }],
          take: 5,
        },
        brand: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!perfume) {
      return {
        title: t("notFoundTitle"),
      };
    }

    return {
      title: t("title", {
        name: perfume.name,
        brand: perfume.brand?.name ?? t("unknownBrand"),
      }),
      description: getPerfumeShortText(perfume),
      alternates: {
        canonical: getAlternateLinks("/perfumes/[slug]", { slug })[resolvedLocale],
        languages: getAlternateLinks("/perfumes/[slug]", { slug }),
      },
    };
  } catch (error) {
    logCatalogQueryError("perfumes:metadata", error);
    return {
      title: t("fallbackTitle"),
      description: t("fallbackDescription"),
    };
  }
}

export default async function PerfumeDetailPage({ params }: PerfumeDetailPageProps) {
  const { locale, slug } = await params;
  const resolvedLocale = (hasLocale(locale) ? locale : "en") as AppLocale;
  const t = await getTranslations({ locale: resolvedLocale, namespace: "perfume.detail" });
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

  return (
    <>
      <Container className="space-y-9 pt-8 pb-8 md:space-y-10 md:pt-10 md:pb-10">
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

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/Container";
import { MoodBadges } from "@/components/perfumes/MoodBadges";
import { NotesList } from "@/components/perfumes/NotesList";
import { OfferTable } from "@/components/perfumes/OfferTable";
import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import { PerfumeHero } from "@/components/perfumes/PerfumeHero";
import { buttonStyles } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getCatalogVisibilityWhere, mergePerfumeWhere } from "@/lib/catalog";
import { getCheaperAlternatives, getPerfumeNotes, getSimilarPerfumes } from "@/lib/discovery";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { computeBestOffer } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";

type PerfumeDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

async function getPerfumePageData(slug: string) {
  if (!isDatabaseConfigured) {
    return null;
  }

  const visibilityWhere = getCatalogVisibilityWhere();

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
}

export async function generateMetadata({ params }: PerfumeDetailPageProps): Promise<Metadata> {
  if (!isDatabaseConfigured) {
    return {
      title: "Perfume | Odora",
      description: "Fragrance details and offer comparison on Odora.",
    };
  }

  const { slug } = await params;

  const perfume = await prisma.perfume.findFirst({
    where: mergePerfumeWhere({ slug }, getCatalogVisibilityWhere()),
    select: {
      name: true,
      descriptionShort: true,
      brand: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!perfume) {
    return {
      title: "Perfume not found | Odora",
    };
  }

  return {
    title: `${perfume.name} by ${perfume.brand.name} | Odora`,
    description: perfume.descriptionShort,
  };
}

export default async function PerfumeDetailPage({ params }: PerfumeDetailPageProps) {
  const { slug } = await params;
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

  return (
    <Container className="space-y-10 pt-10">
      <PerfumeHero perfume={perfume} />

      <section className="space-y-4">
        <SectionTitle
          eyebrow="Notes"
          title="Fragrance pyramid"
          subtitle="Top, heart, and base notes with relative emphasis. Click a note to explore matching perfumes."
        />
        <NotesList notes={notesForRender} />
      </section>

      <section className="space-y-4">
        <SectionTitle
          eyebrow="Prices"
          title="Compare current offers"
          subtitle="Best offer is calculated by total cost: price + shipping."
        />

        {bestOffer ? (
          <div className="rounded-2xl border border-[#ddcfbc] bg-[#f8f2e9] p-5">
            <p className="text-sm text-[#5f4f40]">
              Best price:{" "}
              <span className="font-semibold text-[#1f1914]">
                {formatCurrency(bestOffer.bestPrice, bestOffer.bestCurrency)}
              </span>{" "}
              at <span className="font-semibold text-[#1f1914]">{bestOffer.bestStore ?? "Selected store"}</span>
            </p>
            <p className="mt-2 text-sm text-[#5f4f40]">
              Total with shipping: {formatCurrency(bestOffer.bestTotalPrice, bestOffer.bestCurrency)}
            </p>
            {bestOffer.bestUrl ? (
              <Link
                href={bestOffer.bestUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonStyles({ className: "mt-4" })}
              >
                View offer
              </Link>
            ) : null}
          </div>
        ) : null}

        <OfferTable offers={perfume.offers} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MoodBadges
          title="Moods"
          items={perfume.moods.map((item) => ({ name: item.mood.name, weight: item.weight }))}
        />
        <MoodBadges
          title="Seasons"
          items={perfume.seasons.map((item) => ({ name: item.season.name, weight: item.weight }))}
        />
        <MoodBadges
          title="Occasions"
          items={perfume.occasions.map((item) => ({
            name: item.occasion.name,
            weight: item.weight,
          }))}
        />
      </section>

      <section className="rounded-2xl border border-[#ddcfbc] bg-white p-6">
        <SectionTitle eyebrow="Overview" title="About this perfume" subtitle={perfume.descriptionLong} />
      </section>

      <section className="space-y-4">
        <SectionTitle
          eyebrow="Discovery"
          title="Similar fragrances"
          subtitle="Fragrances with similar profile, notes, and style signal."
        />
        <PerfumeGrid perfumes={similarPerfumes} />
      </section>

      <section className="space-y-4 pb-6">
        <SectionTitle
          eyebrow="Value"
          title="Cheaper alternatives"
          subtitle="Similar fragrances for less, ranked by profile match and lower total price."
        />
        <PerfumeGrid perfumes={cheaperAlternatives} />
      </section>
    </Container>
  );
}

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
import { prisma } from "@/lib/prisma";
import { computeBestOffer } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";

type PerfumeDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PerfumeDetailPage({ params }: PerfumeDetailPageProps) {
  const { slug } = await params;

  const perfume = await prisma.perfume.findUnique({
    where: { slug },
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
        orderBy: {
          priceAmount: "asc",
        },
      },
    },
  });

  if (!perfume) {
    notFound();
  }

  const relatedPerfumes = await prisma.perfume.findMany({
    where: {
      id: {
        not: perfume.id,
      },
      fragranceFamily: perfume.fragranceFamily,
    },
    include: {
      brand: true,
      offers: {
        select: {
          id: true,
          priceAmount: true,
          currency: true,
          shippingCost: true,
          availability: true,
          affiliateUrl: true,
          productUrl: true,
          store: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    take: 3,
  });

  const bestOffer = computeBestOffer(perfume.offers);

  return (
    <Container className="space-y-10 pt-10">
      <PerfumeHero perfume={perfume} />

      <section className="space-y-4">
        <SectionTitle
          eyebrow="Notes"
          title="Fragrance pyramid"
          subtitle="Top, heart, and base notes with relative emphasis."
        />
        <NotesList
          notes={perfume.notes.map((item) => ({
            name: item.note.name,
            noteType: item.note.noteType,
            intensity: item.intensity,
          }))}
        />
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
        <SectionTitle
          eyebrow="Overview"
          title="About this perfume"
          subtitle={perfume.descriptionLong}
        />
      </section>

      <section className="space-y-4 pb-6">
        <SectionTitle
          eyebrow="Related"
          title="More from this style"
          subtitle="Placeholder block for future recommendation logic."
        />
        <PerfumeGrid perfumes={relatedPerfumes} />
      </section>
    </Container>
  );
}

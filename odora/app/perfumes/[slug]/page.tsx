import { notFound } from "next/navigation";

import { Container } from "@/components/layout/Container";
import { MoodBadges } from "@/components/perfumes/MoodBadges";
import { NotesList } from "@/components/perfumes/NotesList";
import { OfferTable } from "@/components/perfumes/OfferTable";
import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import { PerfumeHero } from "@/components/perfumes/PerfumeHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { prisma } from "@/lib/prisma";

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
          priceAmount: true,
          currency: true,
        },
        orderBy: {
          priceAmount: "asc",
        },
        take: 1,
      },
    },
    take: 3,
  });

  const bestOffer =
    perfume.offers.find((offer) => offer.isBestPrice && offer.availability !== "OUT_OF_STOCK") ??
    perfume.offers.find((offer) => offer.availability !== "OUT_OF_STOCK") ??
    perfume.offers[0] ??
    null;

  return (
    <Container className="space-y-10 pt-10">
      <PerfumeHero
        perfume={perfume}
        bestOffer={
          bestOffer
            ? {
                storeName: bestOffer.store.name,
                priceAmount: bestOffer.priceAmount,
                currency: bestOffer.currency,
                productUrl: bestOffer.productUrl,
                affiliateUrl: bestOffer.affiliateUrl,
              }
            : null
        }
      />

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

      <section className="space-y-4">
        <SectionTitle
          eyebrow="Offers"
          title="Compare available prices"
          subtitle="Offers are sorted by price and refreshed from selected partner stores."
        />
        <OfferTable offers={perfume.offers} />
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

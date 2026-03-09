import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";

import { Container } from "@/components/layout/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { applySorting, buildPerfumeQuery } from "@/lib/filters";
import { prisma } from "@/lib/prisma";
import { computeBestOffer } from "@/lib/pricing";

import { PerfumesClient } from "./PerfumesClient";

export const metadata: Metadata = {
  title: "Perfumes | Odora",
  description:
    "Browse fragrances on Odora with filters for family, gender, price, and notes. Compare offers and discover your next scent.",
};

type PerfumesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type PerfumeListItem = Prisma.PerfumeGetPayload<{
  include: {
    brand: true;
    offers: {
      select: {
        id: true;
        priceAmount: true;
        currency: true;
        shippingCost: true;
        availability: true;
        affiliateUrl: true;
        productUrl: true;
        store: {
          select: {
            name: true;
          };
        };
      };
    };
  };
}>;

async function getPerfumes(searchParams: Record<string, string | string[] | undefined>) {
  const { parsed, where } = buildPerfumeQuery(searchParams);

  const baseQuery: Prisma.PerfumeFindManyArgs = {
    where,
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
  };

  const { query, postSort } = applySorting(baseQuery, parsed.sort);
  const perfumes = (await prisma.perfume.findMany(query)) as PerfumeListItem[];

  if (postSort === "price_low") {
    perfumes.sort((a, b) => {
      const aPrice = computeBestOffer(a.offers)?.bestTotalPrice ?? Number.POSITIVE_INFINITY;
      const bPrice = computeBestOffer(b.offers)?.bestTotalPrice ?? Number.POSITIVE_INFINITY;
      return aPrice - bPrice;
    });
  }

  if (postSort === "price_high") {
    perfumes.sort((a, b) => {
      const aPrice = computeBestOffer(a.offers)?.bestTotalPrice ?? Number.NEGATIVE_INFINITY;
      const bPrice = computeBestOffer(b.offers)?.bestTotalPrice ?? Number.NEGATIVE_INFINITY;
      return bPrice - aPrice;
    });
  }

  return {
    perfumes,
    selectedFilters: parsed,
  };
}

export default async function PerfumesPage({ searchParams }: PerfumesPageProps) {
  const resolvedSearchParams = await searchParams;
  const { perfumes, selectedFilters } = await getPerfumes(resolvedSearchParams);

  return (
    <Container className="pt-10">
      <SectionTitle
        eyebrow="Catalog"
        title="Discover perfumes"
        subtitle="Filter by family, note profile, gender, and price. Every filter is URL-driven so discovery links are easy to share."
      />
      <PerfumesClient perfumes={perfumes} selectedFilters={selectedFilters} />
    </Container>
  );
}

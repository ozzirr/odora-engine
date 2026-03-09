import { Container } from "@/components/layout/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { prisma } from "@/lib/prisma";

import { PerfumesClient } from "./PerfumesClient";

async function getPerfumes() {
  return prisma.perfume.findMany({
    orderBy: [{ name: "asc" }],
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
  });
}

export default async function PerfumesPage() {
  const perfumes = await getPerfumes();

  return (
    <Container className="pt-10">
      <SectionTitle
        eyebrow="Catalog"
        title="Browse all perfumes"
        subtitle="Filter by notes, price range, gender, and style. This first version uses lightweight client-side filtering."
      />
      <PerfumesClient perfumes={perfumes} />
    </Container>
  );
}

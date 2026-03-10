import type { Metadata } from "next";

import { Container } from "@/components/layout/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getPerfumesPage, PERFUMES_PAGE_SIZE } from "@/lib/perfumes-catalog";
import { getIsAuthenticated } from "@/lib/supabase/auth-state";

import { PerfumesClient } from "./PerfumesClient";

export const metadata: Metadata = {
  title: "Perfumes | Odora",
  description:
    "Browse perfumes by family, notes, gender, and price, then compare offers with clarity.",
};

export const dynamic = "force-dynamic";

type PerfumesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PerfumesPage({ searchParams }: PerfumesPageProps) {
  const resolvedSearchParams = await searchParams;
  const isAuthenticated = await getIsAuthenticated();
  const { perfumes, selectedFilters, total, hasMore } = await getPerfumesPage(resolvedSearchParams, {
    offset: 0,
    limit: PERFUMES_PAGE_SIZE,
  });

  return (
    <Container className="pt-10">
      <SectionTitle
        eyebrow="Catalog"
        title="Discover perfumes"
        subtitle="Browse the catalog by family, notes, gender, and price, then narrow in on the bottles worth your attention."
      />
      <PerfumesClient
        initialPerfumes={perfumes}
        selectedFilters={selectedFilters}
        total={total}
        hasMore={hasMore}
        pageSize={PERFUMES_PAGE_SIZE}
        isAuthenticated={isAuthenticated}
      />
    </Container>
  );
}

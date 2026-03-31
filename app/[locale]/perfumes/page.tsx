import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/layout/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getAlternateLinks, hasLocale } from "@/lib/i18n";
import { getPerfumesPage, PERFUMES_PAGE_SIZE } from "@/lib/perfumes-catalog";

import { PerfumesClient } from "./PerfumesClient";

export const dynamic = "force-dynamic";

type PerfumesPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PerfumesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.perfumes" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: getAlternateLinks("/perfumes")[resolvedLocale],
      languages: getAlternateLinks("/perfumes"),
    },
  };
}

export default async function PerfumesPage({ params, searchParams }: PerfumesPageProps) {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "catalog.page" });
  const resolvedSearchParams = await searchParams;
  const { perfumes, selectedFilters, total, hasMore } = await getPerfumesPage(resolvedSearchParams, {
    offset: 0,
    limit: PERFUMES_PAGE_SIZE,
  });

  return (
    <Container className="pt-10">
      <SectionTitle
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <PerfumesClient
        initialPerfumes={perfumes}
        selectedFilters={selectedFilters}
        total={total}
        hasMore={hasMore}
        pageSize={PERFUMES_PAGE_SIZE}
        isAuthenticated={false}
      />
    </Container>
  );
}

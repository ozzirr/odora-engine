import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { StructuredData } from "@/components/seo/StructuredData";
import { ExpandableSeoIntro } from "@/components/ui/ExpandableSeoIntro";
import { buttonStyles } from "@/components/ui/Button";
import { buildPerfumeQuery, type ParsedPerfumeFilters } from "@/lib/filters";
import { getLocalizedPathname, hasLocale, type AppLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";
import { Link } from "@/lib/navigation";
import { getPerfumesPage, PERFUMES_PAGE_SIZE } from "@/lib/perfumes-catalog";
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildItemListSchema,
} from "@/lib/structured-data";
import { getIsAuthenticated } from "@/lib/supabase/auth-state";

import { PerfumesClient } from "./PerfumesClient";

export const dynamic = "force-dynamic";

type PerfumesPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parsePageParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "", 10);

  return Number.isFinite(parsed) && parsed > 1 ? parsed : 1;
}

function hasActiveCatalogFilters(filters: ParsedPerfumeFilters) {
  return Boolean(
    filters.gender ||
      filters.family ||
      filters.price ||
      filters.note ||
      filters.top ||
      filters.heart ||
      filters.base ||
      filters.arabic ||
      filters.niche ||
      (filters.sort && filters.sort !== "rating"),
  );
}

function buildPageList(currentPage: number, totalPages: number) {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

  return [...pages].filter((page) => page >= 1 && page <= totalPages).sort((left, right) => left - right);
}

function toFlatQuery(
  searchParams: Record<string, string | string[] | undefined>,
  options?: {
    excludePage?: boolean;
  },
) {
  return Object.fromEntries(
    Object.entries(searchParams).flatMap(([key, value]) => {
      if (options?.excludePage && key === "page") {
        return [];
      }

      const resolvedValue = Array.isArray(value) ? value[0] : value;
      return resolvedValue ? [[key, resolvedValue]] : [];
    }),
  );
}

export async function generateMetadata({ params, searchParams }: PerfumesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.perfumes" });
  const resolvedSearchParams = await searchParams;
  const currentPage = parsePageParam(resolvedSearchParams.page);
  const parsedFilters = buildPerfumeQuery(resolvedSearchParams).parsed;
  const hasFilters = hasActiveCatalogFilters(parsedFilters);

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: resolvedLocale,
    pathname: "/perfumes",
    query: currentPage > 1 && !hasFilters ? { page: currentPage } : undefined,
    robots: hasFilters
      ? {
          index: false,
          follow: true,
        }
      : undefined,
  });
}

export default async function PerfumesPage({ params, searchParams }: PerfumesPageProps) {
  const { locale } = await params;
  const resolvedLocale = (hasLocale(locale) ? locale : "en") as AppLocale;
  const t = await getTranslations({ locale: resolvedLocale, namespace: "catalog.page" });
  const clientT = await getTranslations({ locale: resolvedLocale, namespace: "catalog.client" });
  const navT = await getTranslations({ locale: resolvedLocale, namespace: "layout.header.nav" });
  const resolvedSearchParams = await searchParams;
  const currentPage = parsePageParam(resolvedSearchParams.page);
  const flatQuery = toFlatQuery(resolvedSearchParams, { excludePage: true });
  const isAuthenticated = await getIsAuthenticated();

  if (!isAuthenticated && currentPage > 1) {
    redirect(getLocalizedPathname(resolvedLocale, "/perfumes", undefined, flatQuery));
  }

  const { perfumes, selectedFilters, total, hasMore } = await getPerfumesPage(resolvedSearchParams, {
    offset: (currentPage - 1) * PERFUMES_PAGE_SIZE,
    limit: PERFUMES_PAGE_SIZE,
    accessMode: isAuthenticated ? "full" : "preview",
  }).catch(() => ({
    perfumes: [],
    selectedFilters: buildPerfumeQuery(resolvedSearchParams).parsed,
    total: 0,
    hasMore: false,
  }));
  const hasFilters = hasActiveCatalogFilters(selectedFilters);
  const totalPages = Math.max(1, Math.ceil(total / PERFUMES_PAGE_SIZE));
  const visiblePages = buildPageList(currentPage, totalPages);
  const perfumesPath = getLocalizedPathname(
    resolvedLocale,
    "/perfumes",
    undefined,
    currentPage > 1 ? { page: currentPage } : undefined,
  );
  const breadcrumbItems = [
    { label: navT("home"), href: "/" as const },
    { label: navT("perfumes") },
  ];

  return (
    <Container className="pt-5 sm:pt-6">
      {!hasFilters ? (
        <StructuredData
          data={[
            buildCollectionPageSchema({
              name: t("title"),
              description: t("subtitle"),
              path: perfumesPath,
              locale: resolvedLocale,
            }),
            buildBreadcrumbSchema([
              { name: navT("home"), path: getLocalizedPathname(resolvedLocale, "/") },
              { name: navT("perfumes"), path: perfumesPath },
            ]),
            buildItemListSchema({
              name: t("title"),
              path: perfumesPath,
              items: perfumes.map((perfume) => ({
                name: `${perfume.name} ${perfume.brand.name}`,
                path: getLocalizedPathname(resolvedLocale, "/perfumes/[slug]", {
                  slug: perfume.slug,
                }),
              })),
            }),
          ]}
        />
      ) : null}

      <Breadcrumbs items={breadcrumbItems} className="mb-4" />

      <section className="space-y-4 rounded-3xl border border-[#dfd1bf] bg-white p-6 shadow-[0_20px_45px_-38px_rgba(48,34,20,0.24)] sm:p-8">
        <ExpandableSeoIntro
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
          body={[t("bodyOne"), t("bodyTwo")]}
          primaryCta={{ href: "/finder", label: t("primaryCta") }}
          secondaryCta={{ href: "/top", label: t("secondaryCta"), variant: "secondary" }}
        />
      </section>

      <PerfumesClient
        initialPerfumes={perfumes}
        selectedFilters={selectedFilters}
        total={total}
        hasMore={hasMore}
        pageSize={PERFUMES_PAGE_SIZE}
        isAuthenticated={isAuthenticated}
      />

      {isAuthenticated && totalPages > 1 ? (
        <nav aria-label={clientT("paginationLabel")} className="mt-8 flex flex-wrap items-center gap-2 pb-10">
          {currentPage > 1 ? (
            <Link
              href={{
                pathname: "/perfumes",
                query: currentPage - 1 === 1 ? flatQuery : { ...flatQuery, page: String(currentPage - 1) },
              }}
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              {clientT("previousPage")}
            </Link>
          ) : null}

          {visiblePages.map((page) => (
            <Link
              key={page}
              href={{
                pathname: "/perfumes",
                query: page === 1 ? flatQuery : { ...flatQuery, page: String(page) },
              }}
              aria-current={page === currentPage ? "page" : undefined}
              className={
                page === currentPage
                  ? buttonStyles({ size: "sm" })
                  : buttonStyles({ variant: "secondary", size: "sm" })
              }
            >
              {clientT("page", { page })}
            </Link>
          ))}

          {currentPage < totalPages ? (
            <Link
              href={{
                pathname: "/perfumes",
                query: { ...flatQuery, page: String(currentPage + 1) },
              }}
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              {clientT("nextPage")}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </Container>
  );
}

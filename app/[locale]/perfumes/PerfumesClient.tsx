"use client";

import { useTranslations } from "next-intl";

import { CatalogGate } from "@/components/catalog/CatalogGate";
import { PerfumeFilters } from "@/components/perfumes/PerfumeFilters";
import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import type { PerfumeCardItem } from "@/components/perfumes/PerfumeCard";
import type { ParsedPerfumeFilters } from "@/lib/filters";
import { FREE_CATALOG_PREVIEW_LIMIT, type CatalogFilterOption } from "@/lib/perfumes-catalog";
import { useAuthStatus } from "@/lib/supabase/use-auth-status";

type PerfumesClientProps = {
  initialPerfumes: PerfumeCardItem[];
  selectedFilters: ParsedPerfumeFilters;
  filterOptions: {
    families: CatalogFilterOption[];
    notes: CatalogFilterOption[];
  };
  total: number;
  hasMore: boolean;
  isAuthenticated: boolean;
};

export function PerfumesClient({
  initialPerfumes,
  selectedFilters,
  filterOptions,
  total,
  hasMore,
  isAuthenticated,
}: PerfumesClientProps) {
  const t = useTranslations("catalog.client");
  const authStatus = useAuthStatus(isAuthenticated);
  const isCatalogLocked =
    !authStatus && total > initialPerfumes.length && initialPerfumes.length >= FREE_CATALOG_PREVIEW_LIMIT;

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-8">
      <PerfumeFilters selectedFilters={selectedFilters} filterOptions={filterOptions} />

      <section className="space-y-4 lg:min-w-0 lg:pb-8">
        <p className="text-sm text-[#615140]">
          {t("showing", { visible: initialPerfumes.length, total })}
        </p>
        <PerfumeGrid perfumes={initialPerfumes} cardVariant="finder" layout="list" injectInFeedAd />

        {isCatalogLocked ? <CatalogGate previewLimit={FREE_CATALOG_PREVIEW_LIMIT} /> : null}

        {!hasMore && !isCatalogLocked && initialPerfumes.length > 0 ? (
          <p className="pt-2 text-center text-xs uppercase tracking-[0.1em] text-[#8a7763]">
            {t("end")}
          </p>
        ) : null}
      </section>
    </div>
  );
}

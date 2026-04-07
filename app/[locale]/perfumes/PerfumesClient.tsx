"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { CatalogGate } from "@/components/catalog/CatalogGate";
import { PerfumeFilters } from "@/components/perfumes/PerfumeFilters";
import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import type { PerfumeCardItem } from "@/components/perfumes/PerfumeCard";
import type { ParsedPerfumeFilters } from "@/lib/filters";
import { FREE_CATALOG_PREVIEW_LIMIT } from "@/lib/perfumes-catalog";
import { useAuthStatus } from "@/lib/supabase/use-auth-status";

type PerfumesClientProps = {
  initialPerfumes: PerfumeCardItem[];
  selectedFilters: ParsedPerfumeFilters;
  total: number;
  hasMore: boolean;
  pageSize: number;
  isAuthenticated: boolean;
};

function PerfumeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`perfume-skeleton-${index}`}
          className="grid min-h-[12.5rem] grid-cols-[8.5rem_minmax(0,1fr)] overflow-hidden rounded-[1.75rem] border border-[#e1d5c5] bg-white shadow-[0_20px_45px_-36px_rgba(50,35,20,0.16)] sm:grid-cols-[11rem_minmax(0,1fr)]"
        >
          <div className="animate-pulse bg-[#f0e7da]" />
          <div className="space-y-3 p-4 sm:p-5">
            <div className="h-3 w-24 animate-pulse rounded-full bg-[#ede1d3]" />
            <div className="space-y-2">
              <div className="h-8 w-3/4 animate-pulse rounded-full bg-[#ece0d1]" />
              <div className="h-4 w-full animate-pulse rounded-full bg-[#f0e5d8]" />
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-[#f0e5d8]" />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <div className="h-8 w-24 animate-pulse rounded-full bg-[#efe3d2]" />
              <div className="h-8 w-32 animate-pulse rounded-full bg-[#efe3d2]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PerfumesClient({
  initialPerfumes,
  selectedFilters,
  total,
  hasMore,
  pageSize,
  isAuthenticated,
}: PerfumesClientProps) {
  const t = useTranslations("catalog.client");
  const authStatus = useAuthStatus(isAuthenticated);
  const searchParams = useSearchParams();
  const [perfumes, setPerfumes] = useState<PerfumeCardItem[]>(initialPerfumes);
  const [totalCount, setTotalCount] = useState(total);
  const [nextOffset, setNextOffset] = useState(initialPerfumes.length);
  const [hasMoreResults, setHasMoreResults] = useState(hasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  const querySignature = useMemo(() => searchParams.toString(), [searchParams]);
  const maxVisiblePerfumes = authStatus ? Number.MAX_SAFE_INTEGER : FREE_CATALOG_PREVIEW_LIMIT;
  const isCatalogLocked = !authStatus && totalCount > perfumes.length && perfumes.length >= maxVisiblePerfumes;
  const canLoadMore = hasMoreResults && !isCatalogLocked;

  useEffect(() => {
    setPerfumes(initialPerfumes);
    setTotalCount(total);
    setNextOffset(initialPerfumes.length);
    setHasMoreResults(hasMore);
    setLoadError(null);
    setIsLoadingMore(false);
    isFetchingRef.current = false;
  }, [initialPerfumes, total, hasMore, querySignature]);

  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || !canLoadMore) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoadingMore(true);
    setLoadError(null);

    const params = new URLSearchParams(searchParams.toString());
    params.set("offset", String(nextOffset));
    params.set("limit", String(pageSize));

    try {
      const response = await fetch(`/api/perfumes?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const payload = (await response.json()) as {
        perfumes: PerfumeCardItem[];
        total: number;
        hasMore: boolean;
        nextOffset: number;
      };

      const remainingPreviewSlots = Math.max(0, maxVisiblePerfumes - perfumes.length);
      const fetchedPerfumes = authStatus
        ? payload.perfumes
        : payload.perfumes.slice(0, remainingPreviewSlots);
      const nextVisibleCount = perfumes.length + fetchedPerfumes.length;
      const reachedPreviewLimit =
        !authStatus && nextVisibleCount >= FREE_CATALOG_PREVIEW_LIMIT && payload.total > nextVisibleCount;

      setPerfumes((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        const nextItems = fetchedPerfumes.filter((item) => !existingIds.has(item.id));
        return [...current, ...nextItems];
      });
      setTotalCount(payload.total);
      setHasMoreResults(reachedPreviewLimit ? true : payload.hasMore);
      setNextOffset(payload.nextOffset);
    } catch {
      setLoadError(t("loadError"));
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [authStatus, canLoadMore, maxVisiblePerfumes, nextOffset, pageSize, perfumes.length, searchParams, t]);

  useEffect(() => {
    if (!loadMoreRef.current || !canLoadMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      {
        rootMargin: "320px 0px",
      },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [canLoadMore, loadMore]);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-8">
      <PerfumeFilters selectedFilters={selectedFilters} />

      <section className="space-y-4 lg:min-w-0 lg:pb-8">
        <p className="text-sm text-[#615140]">
          {t("showing", { visible: perfumes.length, total: totalCount })}
        </p>
        <PerfumeGrid perfumes={perfumes} cardVariant="finder" layout="list" />

        {loadError ? (
          <div className="rounded-xl border border-[#e3d5c4] bg-[#fcf7f0] px-4 py-3 text-sm text-[#654f3f]">
            {loadError}
          </div>
        ) : null}

        {isLoadingMore ? <PerfumeGridSkeleton count={Math.min(3, pageSize)} /> : null}

        {isCatalogLocked ? <CatalogGate previewLimit={FREE_CATALOG_PREVIEW_LIMIT} /> : null}

        {canLoadMore ? <div ref={loadMoreRef} className="h-6 w-full" /> : null}

        {!hasMoreResults && !isCatalogLocked && perfumes.length > 0 ? (
          <p className="pt-2 text-center text-xs uppercase tracking-[0.1em] text-[#8a7763]">
            {t("end")}
          </p>
        ) : null}
      </section>
    </div>
  );
}

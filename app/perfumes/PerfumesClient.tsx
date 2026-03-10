"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { CatalogGate } from "@/components/catalog/CatalogGate";
import { PerfumeFilters } from "@/components/perfumes/PerfumeFilters";
import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import type { PerfumeCardItem } from "@/components/perfumes/PerfumeCard";
import type { ParsedPerfumeFilters } from "@/lib/filters";
import { useAuthStatus } from "@/lib/supabase/use-auth-status";

type PerfumesClientProps = {
  initialPerfumes: PerfumeCardItem[];
  selectedFilters: ParsedPerfumeFilters;
  total: number;
  hasMore: boolean;
  pageSize: number;
  isAuthenticated: boolean;
};

const FREE_CATALOG_PREVIEW_LIMIT = 25;

function PerfumeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`perfume-skeleton-${index}`}
          className="overflow-hidden rounded-2xl border border-[#e1d5c5] bg-white"
        >
          <div className="h-56 animate-pulse bg-[#f1e8dd]" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-28 animate-pulse rounded bg-[#ede1d3]" />
            <div className="h-6 w-2/3 animate-pulse rounded bg-[#ece0d1]" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-[#f0e5d8]" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-[#f0e5d8]" />
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
      setLoadError("Unable to load more fragrances. Retry in a moment.");
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [authStatus, canLoadMore, maxVisiblePerfumes, nextOffset, pageSize, perfumes.length, searchParams]);

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
          Showing <span className="font-semibold text-[#2a2018]">{perfumes.length}</span> of{" "}
          <span className="font-semibold text-[#2a2018]">{totalCount}</span> fragrances
        </p>
        <PerfumeGrid perfumes={perfumes} />

        {loadError ? (
          <div className="rounded-xl border border-[#e3d5c4] bg-[#fcf7f0] px-4 py-3 text-sm text-[#654f3f]">
            {loadError}
          </div>
        ) : null}

        {isLoadingMore ? <PerfumeGridSkeleton count={Math.min(6, pageSize)} /> : null}

        {isCatalogLocked ? <CatalogGate previewLimit={FREE_CATALOG_PREVIEW_LIMIT} /> : null}

        {canLoadMore ? <div ref={loadMoreRef} className="h-6 w-full" /> : null}

        {!hasMoreResults && perfumes.length > 0 ? (
          <p className="pt-2 text-center text-xs uppercase tracking-[0.1em] text-[#8a7763]">
            End of catalog
          </p>
        ) : null}
      </section>
    </div>
  );
}

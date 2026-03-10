"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { PerfumeFilters } from "@/components/perfumes/PerfumeFilters";
import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import { buttonStyles } from "@/components/ui/Button";
import type { PerfumeCardItem } from "@/components/perfumes/PerfumeCard";
import type { ParsedPerfumeFilters } from "@/lib/filters";

type PerfumesClientProps = {
  initialPerfumes: PerfumeCardItem[];
  selectedFilters: ParsedPerfumeFilters;
  total: number;
  hasMore: boolean;
  pageSize: number;
};

const MAX_FREE_CATALOG_PAGES = 3;

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
}: PerfumesClientProps) {
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
  const maxVisiblePerfumes = pageSize * MAX_FREE_CATALOG_PAGES;
  const isCatalogLocked = hasMoreResults && perfumes.length >= maxVisiblePerfumes;
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

      setPerfumes((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        const nextItems = payload.perfumes.filter((item) => !existingIds.has(item.id));
        return [...current, ...nextItems];
      });
      setTotalCount(payload.total);
      setHasMoreResults(payload.hasMore);
      setNextOffset(payload.nextOffset);
    } catch {
      setLoadError("Unable to load more fragrances. Retry in a moment.");
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [canLoadMore, nextOffset, pageSize, searchParams]);

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
    <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
      <PerfumeFilters selectedFilters={selectedFilters} />

      <section className="space-y-4">
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

        {isCatalogLocked ? (
          <div className="rounded-2xl border border-[#d8c8b5] bg-[#fbf5ec] px-6 py-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a7763]">
              Continue Discovery
            </p>
            <h3 className="mt-2 font-display text-3xl text-[#201711]">Accedi per vedere tutto il catalogo</h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-[#675545]">
              Hai raggiunto i primi {maxVisiblePerfumes} profumi. Accedi o crea un account per continuare a
              esplorare tutte le fragranze disponibili.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/login" className={buttonStyles()}>
                Accedi
              </Link>
              <Link href="/signup" className={buttonStyles({ variant: "secondary" })}>
                Crea account
              </Link>
            </div>
          </div>
        ) : null}

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

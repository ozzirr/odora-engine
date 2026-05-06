"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { APP_HEADER_OFFSET_CLASS, APP_OVERLAY_LAYER_CLASS } from "@/lib/chrome";
import { lockDocumentScroll } from "@/lib/document-scroll-lock";
import { Container } from "@/components/layout/Container";
import { PerfumeDetailLoadingState } from "@/components/perfumes/PerfumeDetailLoadingState";
import { cn } from "@/lib/utils";

type PendingPerfumeNavigation = {
  perfumeName?: string;
  sourcePathname: string;
  startedAt: number;
};

type PerfumeDetailNavigationContextValue = {
  startNavigation: (perfumeName?: string | null) => void;
  completeNavigation: () => void;
};

const PerfumeDetailNavigationContext = createContext<PerfumeDetailNavigationContextValue | null>(null);
const MIN_LOADING_STATE_MS = 1800;
const noopNavigationContext: PerfumeDetailNavigationContextValue = {
  startNavigation: () => {},
  completeNavigation: () => {},
};

function restoreWindowScroll(top: number) {
  const targetTop = Math.max(0, Math.round(top));

  window.requestAnimationFrame(() => {
    window.scrollTo({ top: targetTop, left: 0, behavior: "auto" });

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: targetTop, left: 0, behavior: "auto" });
    });
  });
}

export function PerfumeDetailNavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pendingNavigation, setPendingNavigation] = useState<PendingPerfumeNavigation | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const overlayScrollTopRef = useRef(0);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!pendingNavigation) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPendingNavigation(null);
    }, 12000);

    return () => window.clearTimeout(timeoutId);
  }, [pendingNavigation]);

  useEffect(() => {
    if (!pendingNavigation) {
      return;
    }

    return lockDocumentScroll({ lockRoot: true, disableOverscroll: true });
  }, [pendingNavigation]);

  return (
    <PerfumeDetailNavigationContext.Provider
      value={{
        startNavigation: (perfumeName) => {
          if (hideTimeoutRef.current) {
            window.clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
          }

          setPendingNavigation({
            perfumeName: perfumeName?.trim() || undefined,
            sourcePathname: pathname,
            startedAt: Date.now(),
          });
          overlayScrollTopRef.current = 0;
        },
        completeNavigation: () => {
          setPendingNavigation((current) => {
            if (!current) {
              return null;
            }

            if (pathname === current.sourcePathname) {
              return current;
            }

            const remainingMs = Math.max(0, MIN_LOADING_STATE_MS - (Date.now() - current.startedAt));
            const restoreTop = overlayRef.current?.scrollTop ?? overlayScrollTopRef.current;

            if (remainingMs === 0) {
              restoreWindowScroll(restoreTop);
              return null;
            }

            if (hideTimeoutRef.current) {
              window.clearTimeout(hideTimeoutRef.current);
            }

            hideTimeoutRef.current = window.setTimeout(() => {
              setPendingNavigation(null);
              restoreWindowScroll(restoreTop);
              hideTimeoutRef.current = null;
            }, remainingMs);

            return current;
          });
        },
      }}
    >
      {children}
      {pendingNavigation ? (
        <div
          ref={overlayRef}
          onScroll={(event) => {
            overlayScrollTopRef.current = event.currentTarget.scrollTop;
          }}
          className={cn(
            `pointer-events-auto fixed inset-x-0 bottom-0 ${APP_HEADER_OFFSET_CLASS} overflow-y-auto bg-[#fbf8f2]`,
            APP_OVERLAY_LAYER_CLASS,
          )}
        >
          <Container className="space-y-6 pt-4 pb-40 md:space-y-8 md:pt-6 md:pb-10">
            <PerfumeDetailLoadingState
              variant="overlay"
              perfumeName={pendingNavigation.perfumeName}
            />
          </Container>
        </div>
      ) : null}
    </PerfumeDetailNavigationContext.Provider>
  );
}

export function usePerfumeDetailNavigation() {
  const context = useContext(PerfumeDetailNavigationContext);
  return context ?? noopNavigationContext;
}

"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { PerfumeDetailLoadingState } from "@/components/perfumes/PerfumeDetailLoadingState";

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
const MIN_LOADING_STATE_MS = 2500;

export function PerfumeDetailNavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pendingNavigation, setPendingNavigation] = useState<PendingPerfumeNavigation | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);

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

            if (remainingMs === 0) {
              return null;
            }

            if (hideTimeoutRef.current) {
              window.clearTimeout(hideTimeoutRef.current);
            }

            hideTimeoutRef.current = window.setTimeout(() => {
              setPendingNavigation(null);
              hideTimeoutRef.current = null;
            }, remainingMs);

            return current;
          });
        },
      }}
    >
      {children}
      {pendingNavigation ? (
        <div className="pointer-events-auto fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(24,20,16,0.24)] px-4 py-6 backdrop-blur-[18px] sm:px-6">
          <PerfumeDetailLoadingState
            variant="overlay"
            perfumeName={pendingNavigation.perfumeName}
          />
        </div>
      ) : null}
    </PerfumeDetailNavigationContext.Provider>
  );
}

export function usePerfumeDetailNavigation() {
  const context = useContext(PerfumeDetailNavigationContext);

  if (!context) {
    throw new Error("usePerfumeDetailNavigation must be used within PerfumeDetailNavigationProvider");
  }

  return context;
}

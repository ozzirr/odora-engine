"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { PerfumeDetailLoadingState } from "@/components/perfumes/PerfumeDetailLoadingState";

type PendingPerfumeNavigation = {
  perfumeName?: string;
  sourcePathname: string;
};

type PerfumeDetailNavigationContextValue = {
  startNavigation: (perfumeName?: string | null) => void;
};

const PerfumeDetailNavigationContext = createContext<PerfumeDetailNavigationContextValue | null>(null);

export function PerfumeDetailNavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pendingNavigation, setPendingNavigation] = useState<PendingPerfumeNavigation | null>(null);

  useEffect(() => {
    if (!pendingNavigation || pathname === pendingNavigation.sourcePathname) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPendingNavigation(null);
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [pathname, pendingNavigation]);

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
          setPendingNavigation({
            perfumeName: perfumeName?.trim() || undefined,
            sourcePathname: pathname,
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

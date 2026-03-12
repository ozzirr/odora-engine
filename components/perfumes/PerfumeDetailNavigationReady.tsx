"use client";

import { useEffect } from "react";

import { usePerfumeDetailNavigation } from "@/components/perfumes/PerfumeDetailNavigation";

export function PerfumeDetailNavigationReady() {
  const { completeNavigation } = usePerfumeDetailNavigation();

  useEffect(() => {
    completeNavigation();
  }, [completeNavigation]);

  return null;
}

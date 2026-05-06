"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const STORAGE_PREFIX = "odora:perfume-detail-loading-scroll:";

function storageKey(pathname: string | null) {
  return `${STORAGE_PREFIX}${pathname ?? "unknown"}`;
}

function restoreScrollTop(top: number) {
  const targetTop = Math.max(0, Math.round(top));

  window.requestAnimationFrame(() => {
    window.scrollTo({ top: targetTop, left: 0, behavior: "auto" });

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: targetTop, left: 0, behavior: "auto" });
    });
  });
}

export function PerfumeDetailLoadingScrollCapture() {
  const pathname = usePathname();

  useEffect(() => {
    const key = storageKey(pathname);

    const saveScroll = () => {
      window.sessionStorage.setItem(key, String(window.scrollY));
    };

    saveScroll();
    window.addEventListener("scroll", saveScroll, { passive: true });

    return () => {
      saveScroll();
      window.removeEventListener("scroll", saveScroll);
    };
  }, [pathname]);

  return null;
}

export function PerfumeDetailReadyScrollRestore() {
  const pathname = usePathname();

  useEffect(() => {
    const key = storageKey(pathname);
    const rawTop = window.sessionStorage.getItem(key);

    if (!rawTop) {
      return;
    }

    window.sessionStorage.removeItem(key);

    const top = Number.parseInt(rawTop, 10);
    if (!Number.isFinite(top) || top <= 0) {
      return;
    }

    restoreScrollTop(top);
  }, [pathname]);

  return null;
}


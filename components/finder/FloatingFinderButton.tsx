"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { APP_FLOATING_LAYER_CLASS } from "@/lib/chrome";
import {
  buildFinderStartSearchParams,
  FINDER_LAST_SEARCH_STORAGE_KEY,
  sanitizeStoredFinderPreferences,
} from "@/lib/finder-storage";
import { usePathname, useRouter } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function readStoredSearchParams() {
  if (typeof window === "undefined") {
    return buildFinderStartSearchParams({});
  }

  try {
    const stored = window.localStorage.getItem(FINDER_LAST_SEARCH_STORAGE_KEY);
    const preferences = sanitizeStoredFinderPreferences(stored ? JSON.parse(stored) : {});
    return buildFinderStartSearchParams(preferences);
  } catch {
    return buildFinderStartSearchParams({});
  }
}

export function FloatingFinderButton() {
  const t = useTranslations("layout.finderLauncher");
  const pathname = usePathname();
  const router = useRouter();
  const isFinderPage = pathname === "/finder";
  const className = useMemo(
    () =>
      cn(
        "fixed right-4 sm:right-6",
        APP_FLOATING_LAYER_CLASS,
        "group rounded-full border border-[#d9b77f]/45 bg-[#211914]/92 p-1 text-[#fff8ed] shadow-[0_18px_48px_-26px_rgba(20,14,10,0.72)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#1E4B3B]",
      ),
    [],
  );

  const openFinder = () => {
    const params = readStoredSearchParams();
    router.push({
      pathname: "/finder",
      query: Object.fromEntries(params.entries()),
    });
  };

  return (
    <button
      type="button"
      aria-label={t(isFinderPage ? "restartAria" : "aria")}
      onClick={openFinder}
      className={className}
      style={{ bottom: "calc(var(--mobile-perfume-cta-offset, 0px) + 1rem)" }}
    >
      <span className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.08] px-3 py-2 sm:px-3.5">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9b77f] text-[#211914] shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="M8.8 4.8c1.6-1.6 4.1-1.6 5.7 0l4.7 4.7c1.6 1.6 1.6 4.1 0 5.7l-4 4c-1.6 1.6-4.1 1.6-5.7 0l-4.7-4.7c-1.6-1.6-1.6-4.1 0-5.7l4-4Z"
              stroke="currentColor"
              strokeWidth="1.7"
            />
            <path d="M8 16 16 8M9 7l8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </span>
        <span className="hidden pr-1 text-left sm:block">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d9b77f] group-hover:text-[#f3dfb9]">
            {t("eyebrow")}
          </span>
          <span className="block text-sm font-semibold">{t(isFinderPage ? "restart" : "label")}</span>
        </span>
      </span>
    </button>
  );
}

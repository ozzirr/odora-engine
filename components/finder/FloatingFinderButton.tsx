"use client";

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
  const isFinderPage =
    pathname === "/finder" ||
    pathname === "/trova-profumo" ||
    pathname.endsWith("/finder") ||
    pathname.endsWith("/trova-profumo");

  const openFinder = () => {
    const params = readStoredSearchParams();
    router.push({
      pathname: "/finder",
      query: Object.fromEntries(params.entries()),
    });
  };

  if (isFinderPage) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label={t("aria")}
      onClick={openFinder}
      className={cn(
        "fixed right-4 sm:right-6",
        APP_FLOATING_LAYER_CLASS,
        "group inline-flex items-center gap-2 rounded-full border border-[#decfb9] bg-[#fffaf1]/94 px-2.5 py-2 text-[#211914] shadow-[0_18px_44px_-28px_rgba(45,31,18,0.5)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-[#1e4b3b]/30 hover:bg-white",
      )}
      style={{ bottom: "calc(var(--mobile-perfume-cta-offset, 0px) + 1rem)" }}
    >
      <span
        aria-hidden="true"
        className="grid h-10 w-10 place-items-center rounded-full bg-[#1e4b3b] text-[#fffaf1] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] transition group-hover:bg-[#163b30]"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M12 5.2v13.6M5.2 12h13.6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M8.6 8.6c1.9-1.9 4.9-1.9 6.8 0s1.9 4.9 0 6.8-4.9 1.9-6.8 0-1.9-4.9 0-6.8Z"
            stroke="currentColor"
            strokeWidth="1.4"
          />
        </svg>
      </span>
      <span className="pr-2 text-left leading-none">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a6e4d]">
          {t("eyebrow")}
        </span>
        <span className="mt-1 block text-sm font-semibold text-[#211914]">{t("label")}</span>
      </span>
    </button>
  );
}

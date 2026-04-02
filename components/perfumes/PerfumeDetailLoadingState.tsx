"use client";

import { useTranslations } from "next-intl";

import { RetailerLogo } from "@/components/perfumes/RetailerLogo";
import { cn } from "@/lib/utils";

type PerfumeDetailLoadingStateProps = {
  perfumeName?: string | null;
  variant?: "page" | "overlay";
};

const FEATURED_STORES = ["Notino", "Douglas", "Amazon", "Sephora"];
const STEP_KEYS = ["retailers", "pricing", "offers"] as const;
const STEP_PROGRESS_WIDTHS = ["w-[42%]", "w-[34%]", "w-[38%]"] as const;

export function PerfumeDetailLoadingState({
  perfumeName,
  variant = "page",
}: PerfumeDetailLoadingStateProps) {
  const t = useTranslations("perfume.transition");
  const normalizedPerfumeName = perfumeName?.trim();

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "overflow-hidden rounded-[2rem] border border-[#dfd1bf] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,238,227,0.98))] text-[#1f1914] shadow-[0_28px_65px_-42px_rgba(50,35,20,0.52)]",
        variant === "overlay"
          ? "mx-auto w-full max-w-[22rem] backdrop-blur-xl sm:max-w-2xl"
          : "mx-auto w-full max-w-3xl",
      )}
    >
      <div className="border-b border-[#eadfce] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),transparent_70%)] px-4 py-4 sm:px-8 sm:py-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <span
                key={index}
                className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#1e4b3b]"
                style={{ animationDelay: `${index * 160}ms` }}
              />
            ))}
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7763]">
            {t("eyebrow")}
          </p>
        </div>

        <h2 className="mt-3 font-display text-[2.1rem] leading-[0.98] text-[#1f1914] sm:text-[2.35rem]">
          {t("title")}
        </h2>
        <p className="mt-2 max-w-2xl text-[13px] leading-5 text-[#5f5142] sm:mt-3 sm:text-[15px] sm:leading-6">
          {normalizedPerfumeName
            ? t("subtitleWithName", { name: normalizedPerfumeName })
            : t("subtitle")}
        </p>

        <div className="mt-4 space-y-2 sm:mt-5" aria-hidden="true">
          <div className="loading-bar-track h-1.5 rounded-full bg-[#e9dfd1]">
            <div className="loading-bar-fill w-[36%] bg-[#1e4b3b]" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {STEP_PROGRESS_WIDTHS.map((widthClass, index) => (
              <div key={widthClass} className="loading-bar-track h-1.5 rounded-full bg-[#eee5d8]">
                <div
                  className={`loading-bar-fill ${widthClass} bg-[#c9b294]`}
                  style={{ animationDelay: `${index * 180}ms` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4 sm:space-y-6 sm:px-8 sm:py-7">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {FEATURED_STORES.map((store) => (
            <span
              key={store}
              className="flex min-h-10 items-center justify-center rounded-full border border-[#decfba] bg-white/85 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6a5a4a]"
            >
              <RetailerLogo
                storeName={store}
                imageClassName="h-4"
                align="center"
              />
            </span>
          ))}
          <span className="flex min-h-10 items-center justify-center rounded-full border border-dashed border-[#d9c9b5] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7763]">
            {t("moreStores")}
          </span>
        </div>

        <p className="hidden text-sm text-[#5f5142] sm:block">{t("status")}</p>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {STEP_KEYS.map((stepKey, index) => (
            <div
              key={stepKey}
              className="rounded-2xl border border-[#e3d7c7] bg-white/80 px-3 py-3 shadow-[0_18px_36px_-34px_rgba(50,35,20,0.35)] sm:px-4 sm:py-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7763] sm:text-[11px]">
                0{index + 1}
              </p>
              <p className="mt-1 text-xs font-semibold leading-4 text-[#1f1914] sm:mt-2 sm:text-sm sm:leading-5">
                {t(`steps.${stepKey}`)}
              </p>
              <div className="loading-bar-track mt-2 h-1.5 rounded-full bg-[#ece2d5] sm:mt-3" aria-hidden="true">
                <div
                  className={`loading-bar-fill ${STEP_PROGRESS_WIDTHS[index]} bg-[#1e4b3b]`}
                  style={{ animationDelay: `${index * 220}ms` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

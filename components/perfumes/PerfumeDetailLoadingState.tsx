"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

type PerfumeDetailLoadingStateProps = {
  perfumeName?: string | null;
  variant?: "page" | "overlay";
};

const FEATURED_STORES = ["Notino", "Douglas", "Amazon", "Sephora"];
const STEP_KEYS = ["retailers", "pricing", "availability"] as const;

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
          ? "mx-auto w-full max-w-2xl backdrop-blur-xl"
          : "mx-auto w-full max-w-3xl",
      )}
    >
      <div className="border-b border-[#eadfce] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),transparent_70%)] px-6 py-5 sm:px-8">
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

        <h2 className="mt-3 font-display text-3xl leading-tight text-[#1f1914] sm:text-[2.35rem]">
          {t("title")}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f5142] sm:text-[15px]">
          {normalizedPerfumeName
            ? t("subtitleWithName", { name: normalizedPerfumeName })
            : t("subtitle")}
        </p>
      </div>

      <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-wrap gap-2">
          {FEATURED_STORES.map((store) => (
            <span
              key={store}
              className="rounded-full border border-[#decfba] bg-white/85 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6a5a4a]"
            >
              {store}
            </span>
          ))}
          <span className="rounded-full border border-dashed border-[#d9c9b5] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7763]">
            {t("moreStores")}
          </span>
        </div>

        <p className="text-sm text-[#5f5142]">{t("status")}</p>

        <div className="grid gap-3 sm:grid-cols-3">
          {STEP_KEYS.map((stepKey, index) => (
            <div
              key={stepKey}
              className="rounded-2xl border border-[#e3d7c7] bg-white/80 px-4 py-4 shadow-[0_18px_36px_-34px_rgba(50,35,20,0.35)]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
                0{index + 1}
              </p>
              <p className="mt-2 text-sm font-semibold text-[#1f1914]">
                {t(`steps.${stepKey}`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

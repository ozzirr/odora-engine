import type { ComponentProps } from "react";
import { useLocale, useTranslations } from "next-intl";

import { RetailerLogo } from "@/components/perfumes/RetailerLogo";
import { buttonStyles } from "@/components/ui/Button";
import { Link } from "@/lib/navigation";
import { type ComputedBestOffer } from "@/lib/pricing";
import { cn, formatCurrency } from "@/lib/utils";

type BestOfferCardProps = {
  bestOffer: ComputedBestOffer | null;
  showButton?: boolean;
  title?: string;
  className?: string;
};

type LinkHref = ComponentProps<typeof Link>["href"];

function getRecencyLabel(
  lastCheckedAt: Date | string | null | undefined,
  t: {
    (key: string, values?: Record<string, string | number>): string;
  },
) {
  if (!lastCheckedAt) {
    return null;
  }

  const checkedAt = new Date(lastCheckedAt);
  if (Number.isNaN(checkedAt.getTime())) {
    return null;
  }

  const diffMs = Date.now() - checkedAt.getTime();
  if (diffMs <= 0) {
    return t("updatedJustNow");
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    return t("updatedLessThanOneHourAgo");
  }

  if (diffHours < 24) {
    return t("updatedHoursAgo", { hours: diffHours });
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return t("updatedDaysAgo", { days: diffDays });
  }

  return t("updatedRecently");
}

export function BestOfferCard({
  bestOffer,
  showButton = true,
  title,
  className,
}: BestOfferCardProps) {
  const t = useTranslations("perfume.bestOffer");
  const locale = useLocale();
  const resolvedTitle = title ?? t("title");

  if (!bestOffer) {
    return (
      <div className={cn("rounded-2xl border border-dashed border-[#d8c9b6] bg-[#fbf7f0] p-5", className)}>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7762]">{resolvedTitle}</p>
        <p className="mt-2 text-sm text-[#665545]">{t("empty")}</p>
      </div>
    );
  }

  const storeName = bestOffer.bestStore ?? t("selectedRetailer");
  const shipping = bestOffer.offer.shippingCost;
  const updatedLabel = getRecencyLabel(bestOffer.offer.lastCheckedAt, t);
  const totalPrice = formatCurrency(bestOffer.bestTotalPrice, bestOffer.bestCurrency, locale as "it" | "en");
  const itemPrice = formatCurrency(bestOffer.bestPrice, bestOffer.bestCurrency, locale as "it" | "en");
  const shippingPrice =
    typeof shipping === "number"
      ? formatCurrency(shipping, bestOffer.bestCurrency, locale as "it" | "en")
      : t("shippingIncluded");

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.7rem] border border-[#d8c8b6] bg-[linear-gradient(180deg,rgba(251,246,238,0.98),rgba(245,236,224,0.98))] p-4 shadow-[0_20px_46px_-34px_rgba(56,40,25,0.42)] sm:p-5",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.74),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(211,190,161,0.14),transparent_32%)]"
      />

      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b7762]">{resolvedTitle}</p>
          {updatedLabel ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[#dfcfbc] bg-white/78 px-2.5 py-1 text-[10px] font-medium text-[#665545] shadow-[0_14px_26px_-24px_rgba(56,40,25,0.42)]">
              <span className="h-2 w-2 rounded-full bg-[#1e4b3b]" />
              {updatedLabel}
            </span>
          ) : null}
        </div>

        <div className="mt-3 rounded-[1.45rem] border border-[#ded0bf] bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(250,242,232,0.9))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_16px_38px_-34px_rgba(56,40,25,0.32)]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
            <div className="min-w-0">
              <p className="mt-1.5 font-display text-[2.25rem] leading-none text-[#1f1710] sm:text-[2.9rem]">
                {totalPrice}
              </p>
            </div>

            <div className="flex flex-col items-start gap-1.5 text-left sm:items-end sm:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7763]">
                {t("selectedRetailer")}
              </p>
              <RetailerLogo
                storeName={storeName}
                surface="pill"
                size="md"
                align="center"
                className="bg-white/92"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="rounded-[1.1rem] border border-[#e3d6c7] bg-white/74 px-3.5 py-3 shadow-[0_16px_35px_-34px_rgba(56,40,25,0.38)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7763]">{t("item")}</p>
            <p className="mt-1 text-base font-semibold text-[#241b14]">{itemPrice}</p>
          </div>

          <div className="rounded-[1.1rem] border border-[#e3d6c7] bg-white/74 px-3.5 py-3 shadow-[0_16px_35px_-34px_rgba(56,40,25,0.38)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7763]">{t("shipping")}</p>
            <p className="mt-1 text-base font-semibold text-[#241b14]">{shippingPrice}</p>
          </div>
        </div>

        {showButton && bestOffer.bestUrl ? (
          <div className="mt-3 flex border-t border-[#e2d4c2] pt-3 sm:justify-end">
            <Link
              href={bestOffer.bestUrl as unknown as LinkHref}
              target="_blank"
              rel="noreferrer"
              className={buttonStyles({ className: "w-full sm:w-auto sm:min-w-[180px]" })}
            >
              {t("viewOffer")}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

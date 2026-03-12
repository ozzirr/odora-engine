import type { ComponentProps } from "react";
import { useLocale, useTranslations } from "next-intl";

import { RetailerLogo } from "@/components/perfumes/RetailerLogo";
import { buttonStyles } from "@/components/ui/Button";
import { Link } from "@/lib/navigation";
import {
  type ComputedBestOffer,
  formatAvailabilityLabel,
} from "@/lib/pricing";
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
  const availability = formatAvailabilityLabel(bestOffer.offer.availability, locale as "it" | "en");
  const updatedLabel = getRecencyLabel(bestOffer.offer.lastCheckedAt, t);

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#d8c8b6] bg-[#f9f3e9] p-5 shadow-[0_18px_42px_-32px_rgba(56,40,25,0.45)]",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7762]">{resolvedTitle}</p>
      <p className="mt-2 font-display text-3xl text-[#1f1710]">
        {formatCurrency(bestOffer.bestTotalPrice, bestOffer.bestCurrency, locale as "it" | "en")}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#5f4f40]">
        <span>{t("at")}</span>
        <RetailerLogo
          storeName={storeName}
          imageClassName="h-5"
        />
      </div>

      <div className="mt-3 grid gap-2 text-xs text-[#655546] sm:grid-cols-2">
        <p>{t("item")}: {formatCurrency(bestOffer.bestPrice, bestOffer.bestCurrency, locale as "it" | "en")}</p>
        <p>
          {t("shipping")}: {typeof shipping === "number"
            ? formatCurrency(shipping, bestOffer.bestCurrency, locale as "it" | "en")
            : t("shippingIncluded")}
        </p>
        <p>{t("availability")}: {availability}</p>
        {updatedLabel ? <p>{updatedLabel}</p> : null}
      </div>

      {showButton && bestOffer.bestUrl ? (
        <Link
          href={bestOffer.bestUrl as unknown as LinkHref}
          target="_blank"
          rel="noreferrer"
          className={buttonStyles({ className: "mt-4 w-full sm:w-auto" })}
        >
          {t("viewOffer")}
        </Link>
      ) : null}
    </div>
  );
}

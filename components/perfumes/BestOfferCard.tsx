import Link from "next/link";

import { buttonStyles } from "@/components/ui/Button";
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

function getRecencyLabel(lastCheckedAt: Date | string | null | undefined) {
  if (!lastCheckedAt) {
    return null;
  }

  const checkedAt = new Date(lastCheckedAt);
  if (Number.isNaN(checkedAt.getTime())) {
    return null;
  }

  const diffMs = Date.now() - checkedAt.getTime();
  if (diffMs <= 0) {
    return "Updated just now";
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    return "Updated less than 1 hour ago";
  }

  if (diffHours < 24) {
    return `Updated ${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `Updated ${diffDays}d ago`;
  }

  return "Updated recently";
}

export function BestOfferCard({
  bestOffer,
  showButton = true,
  title = "Best price today",
  className,
}: BestOfferCardProps) {
  if (!bestOffer) {
    return (
      <div className={cn("rounded-2xl border border-dashed border-[#d8c9b6] bg-[#fbf7f0] p-5", className)}>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7762]">{title}</p>
        <p className="mt-2 text-sm text-[#665545]">No active offers available yet.</p>
      </div>
    );
  }

  const storeName = bestOffer.bestStore ?? "Selected retailer";
  const shipping = bestOffer.offer.shippingCost;
  const availability = formatAvailabilityLabel(bestOffer.offer.availability);
  const updatedLabel = getRecencyLabel(bestOffer.offer.lastCheckedAt);

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#d8c8b6] bg-[#f9f3e9] p-5 shadow-[0_18px_42px_-32px_rgba(56,40,25,0.45)]",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7762]">{title}</p>
      <p className="mt-2 font-display text-3xl text-[#1f1710]">
        {formatCurrency(bestOffer.bestTotalPrice, bestOffer.bestCurrency)}
      </p>
      <p className="mt-1 text-sm text-[#5f4f40]">
        at <span className="font-semibold text-[#1f1710]">{storeName}</span>
      </p>

      <div className="mt-3 grid gap-2 text-xs text-[#655546] sm:grid-cols-2">
        <p>Item: {formatCurrency(bestOffer.bestPrice, bestOffer.bestCurrency)}</p>
        <p>
          Shipping: {typeof shipping === "number" ? formatCurrency(shipping, bestOffer.bestCurrency) : "included / n.d."}
        </p>
        <p>Availability: {availability}</p>
        {updatedLabel ? <p>{updatedLabel}</p> : null}
      </div>

      {showButton && bestOffer.bestUrl ? (
        <Link
          href={bestOffer.bestUrl}
          target="_blank"
          rel="noreferrer"
          className={buttonStyles({ className: "mt-4 w-full sm:w-auto" })}
        >
          View offer
        </Link>
      ) : null}
    </div>
  );
}

import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { buttonStyles } from "@/components/ui/Button";
import { computeBestOffer, formatAvailabilityLabel, getOfferUrl } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";

export type OfferTableItem = {
  id: number;
  store: {
    name: string;
  };
  productUrl: string;
  affiliateUrl: string | null;
  priceAmount: number;
  currency: string;
  shippingCost: number | null;
  availability: string;
  isBestPrice: boolean;
  lastCheckedAt: Date;
};

export function OfferTable({ offers }: { offers: OfferTableItem[] }) {
  if (!Array.isArray(offers) || offers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d8c9b6] bg-[#fbf7f0] p-8 text-sm text-[#655444]">
        Offers will appear here as soon as pricing is available.
      </div>
    );
  }

  const bestOffer = computeBestOffer(offers);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#ddcfbc] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse bg-white text-sm">
          <thead className="bg-[#f7f1e8] text-left text-xs uppercase tracking-[0.1em] text-[#7b6854]">
            <tr>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Shipping</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Availability</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => {
              const targetUrl = getOfferUrl(offer.affiliateUrl, offer.productUrl);
              const total = offer.priceAmount + (offer.shippingCost ?? 0);
              const isComputedBest = bestOffer?.offer.id === offer.id;

              return (
                <tr
                  key={offer.id}
                  className={
                    isComputedBest
                      ? "border-t border-[#e5d7c6] bg-[#f9f2e7]"
                      : "border-t border-[#eee3d5]"
                  }
                >
                  <td className="px-4 py-3 font-medium text-[#2a2018]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{offer.store.name}</span>
                      {isComputedBest ? <Badge variant="soft">Best total</Badge> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#2a2018]">
                    {formatCurrency(offer.priceAmount, offer.currency)}
                  </td>
                  <td className="px-4 py-3 text-[#5f4f40]">
                    {offer.shippingCost == null
                      ? "-"
                      : formatCurrency(offer.shippingCost, offer.currency)}
                  </td>
                  <td className="px-4 py-3 text-[#2a2018]">
                    {formatCurrency(total, offer.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">
                      {formatAvailabilityLabel(offer.availability)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {targetUrl ? (
                      <Link
                        href={targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonStyles({ size: "sm", className: "w-full sm:w-auto" })}
                      >
                        View offer
                      </Link>
                    ) : (
                      <span className="text-xs text-[#7b6854]">Coming soon</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

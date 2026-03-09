import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { buttonStyles } from "@/components/ui/Button";
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

const availabilityLabel: Record<string, string> = {
  IN_STOCK: "In Stock",
  LIMITED: "Limited",
  OUT_OF_STOCK: "Out of Stock",
  PREORDER: "Preorder",
};

export function OfferTable({ offers }: { offers: OfferTableItem[] }) {
  if (offers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d8c9b6] bg-[#fbf7f0] p-8 text-sm text-[#655444]">
        No active offers yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#ddcfbc]">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse bg-white text-sm">
          <thead className="bg-[#f7f1e8] text-left text-xs uppercase tracking-[0.1em] text-[#7b6854]">
            <tr>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Shipping</th>
              <th className="px-4 py-3">Availability</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => {
              const targetUrl = offer.affiliateUrl ?? offer.productUrl;

              return (
                <tr
                  key={offer.id}
                  className={offer.isBestPrice ? "bg-[#f9f4ea]" : "border-t border-[#eee3d5]"}
                >
                  <td className="px-4 py-3 font-medium text-[#2a2018]">{offer.store.name}</td>
                  <td className="px-4 py-3 text-[#2a2018]">
                    {formatCurrency(offer.priceAmount, offer.currency)}
                  </td>
                  <td className="px-4 py-3 text-[#5f4f40]">
                    {offer.shippingCost == null
                      ? "-"
                      : formatCurrency(offer.shippingCost, offer.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">
                      {availabilityLabel[offer.availability] ?? offer.availability}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[#5f4f40]">
                    {offer.lastCheckedAt.toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonStyles({ size: "sm" })}
                    >
                      View
                    </Link>
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

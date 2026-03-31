import type { ComponentProps } from "react";
import { useLocale, useTranslations } from "next-intl";

import { RetailerLogo } from "@/components/perfumes/RetailerLogo";
import { Badge } from "@/components/ui/Badge";
import { buttonStyles } from "@/components/ui/Button";
import { Link } from "@/lib/navigation";
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

type LinkHref = ComponentProps<typeof Link>["href"];

export function OfferTable({ offers }: { offers: OfferTableItem[] }) {
  const t = useTranslations("perfume.offerTable");
  const locale = useLocale();

  if (!Array.isArray(offers) || offers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d8c9b6] bg-[#fbf7f0] p-8 text-sm text-[#655444]">
        {t("empty")}
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
              <th className="px-4 py-3">{t("columns.store")}</th>
              <th className="px-4 py-3">{t("columns.price")}</th>
              <th className="px-4 py-3">{t("columns.shipping")}</th>
              <th className="px-4 py-3">{t("columns.total")}</th>
              <th className="px-4 py-3">{t("columns.availability")}</th>
              <th className="px-4 py-3">{t("columns.action")}</th>
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
                    <div className="flex min-w-[156px] flex-col items-start gap-2 sm:min-w-0 sm:flex-row sm:items-center">
                      <RetailerLogo
                        storeName={offer.store.name}
                        surface="pill"
                        size="sm"
                      />
                      {isComputedBest ? (
                        <Badge variant="soft" className="whitespace-nowrap">
                          {t("bestTotal")}
                        </Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#2a2018]">
                    {formatCurrency(offer.priceAmount, offer.currency, locale as "it" | "en")}
                  </td>
                  <td className="px-4 py-3 text-[#5f4f40]">
                    {offer.shippingCost == null
                      ? "-"
                      : formatCurrency(offer.shippingCost, offer.currency, locale as "it" | "en")}
                  </td>
                  <td className="px-4 py-3 text-[#2a2018]">
                    {formatCurrency(total, offer.currency, locale as "it" | "en")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">
                      {formatAvailabilityLabel(offer.availability, locale as "it" | "en")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {targetUrl ? (
                      <Link
                        href={targetUrl as unknown as LinkHref}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonStyles({ size: "sm", className: "whitespace-nowrap px-4" })}
                      >
                        {t("viewOffer")}
                      </Link>
                    ) : (
                      <span className="text-xs text-[#7b6854]">{t("comingSoon")}</span>
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

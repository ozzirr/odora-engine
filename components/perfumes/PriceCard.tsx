import Image from "next/image";
import { useLocale } from "next-intl";

import { buttonStyles } from "@/components/ui/Button";
import type { ComputedBestOffer } from "@/lib/pricing";
import { cn, formatCurrency } from "@/lib/utils";

type PriceCardProps = {
  bestOffer: ComputedBestOffer | null;
  amazonUrl: string;
  className?: string;
};

function AmazonWordmark({ className }: { className?: string }) {
  return (
    <Image
      src="/images/logo_amazon.webp"
      alt="Amazon"
      width={110}
      height={34}
      className={cn("brightness-0 invert", className)}
    />
  );
}

export function PriceCard({ bestOffer, amazonUrl, className }: PriceCardProps) {
  const locale = useLocale() as "it" | "en";
  const isItalian = locale === "it";
  const price = bestOffer
    ? formatCurrency(bestOffer.bestTotalPrice, bestOffer.bestCurrency, locale)
    : isItalian
      ? "Prezzo live"
      : "Live price";
  const shipping =
    typeof bestOffer?.offer.shippingCost === "number"
      ? `${isItalian ? "Spedizione" : "Shipping"} ${formatCurrency(
          bestOffer.offer.shippingCost,
          bestOffer.bestCurrency,
          locale,
        )}`
      : isItalian
        ? "Spedizione inclusa o verificata al checkout"
        : "Shipping included or checked at checkout";

  return (
    <aside
      id="price-offers"
      className={cn(
        "scroll-mt-24 rounded-2xl border border-[#e1d2bf] bg-white/95 p-4 shadow-[0_22px_60px_-38px_rgba(44,31,20,0.38)] sm:p-5",
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
        {isItalian ? "Miglior prezzo online" : "Best price online"}
      </p>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
        {isItalian ? "Da" : "From"}
      </p>
      <p className="mt-1 text-[2.75rem] font-semibold leading-none text-[#1f1914] sm:text-[2.9rem]">
        {price}
      </p>
      <div className="mt-3 space-y-1.5 text-sm leading-5 text-[#5d4c3b]">
        <p>{shipping}</p>
        <p>{isItalian ? "Reso gratuito entro 30 giorni dove disponibile" : "30-day returns where available"}</p>
      </div>

      <a
        href={amazonUrl}
        target="_blank"
        rel="noreferrer"
        className={buttonStyles({
          className:
            "mt-4 h-[3.25rem] w-full rounded-2xl bg-[#1e4b3b] !text-white shadow-[0_18px_35px_-22px_rgba(30,75,59,0.72)] hover:bg-[#16382c] hover:!text-white",
        })}
      >
        <span className="inline-flex items-center gap-2">
          <span>{isItalian ? "Confronta prezzi su" : "Compare prices on"}</span>
          <span className="inline-flex min-w-[82px] items-center justify-center">
            <AmazonWordmark className="h-[21px] w-auto object-contain translate-y-[1px]" />
          </span>
        </span>
      </a>

      <p className="mt-2 text-center text-xs font-medium text-[#8a7763]">
        {isItalian ? "I prezzi possono variare in base al retailer" : "Prices may vary by retailer"}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-[#315f4c]">
        <span className="inline-flex h-2 w-2 rounded-full bg-[#1e4b3b]" />
        <span>{isItalian ? "Link affiliato Amazon" : "Amazon affiliate link"}</span>
        <span className="text-[#b9a58d]">/</span>
        <span>{isItalian ? "Acquisto su Amazon" : "Checkout on Amazon"}</span>
      </div>
    </aside>
  );
}

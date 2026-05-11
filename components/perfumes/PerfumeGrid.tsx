import { Fragment } from "react";
import { useTranslations } from "next-intl";

import { AdInFeed } from "@/components/ads/AdUnit";
import { PerfumeCard, type PerfumeCardItem } from "@/components/perfumes/PerfumeCard";
import { cn } from "@/lib/utils";

type PerfumeGridProps = {
  perfumes: PerfumeCardItem[];
  cardVariant?: "default" | "catalog" | "featured" | "finder" | "compact";
  mobileColumns?: 2 | 3;
  desktopColumns?: 3 | 4;
  layout?: "grid" | "list" | "mobile-carousel";
  animateItems?: boolean;
  itemAnimationKey?: number | string;
  injectInFeedAd?: boolean;
  adAfterIndex?: number;
};

export function PerfumeGrid({
  perfumes,
  cardVariant = "default",
  mobileColumns = 2,
  desktopColumns = 4,
  layout = "grid",
  animateItems = false,
  itemAnimationKey = "default",
  injectInFeedAd = false,
  adAfterIndex = 5,
}: PerfumeGridProps) {
  const t = useTranslations("catalog.grid");

  if (perfumes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d8c9b6] bg-[#fbf7f0] p-8 text-center text-sm text-[#655444]">
        {t("empty")}
      </div>
    );
  }

  const shouldInjectAd = injectInFeedAd && layout === "list" && perfumes.length > adAfterIndex;

  if (layout === "mobile-carousel") {
    return (
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
        {perfumes.map((perfume) => (
          <div key={perfume.id} className="min-w-[calc(50%-0.375rem)] snap-start sm:min-w-0">
            <PerfumeCard perfume={perfume} variant={cardVariant} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-5",
        layout === "list"
          ? "grid-cols-1"
          : `${mobileColumns === 3 ? "grid-cols-3" : "grid-cols-2"} ${
              desktopColumns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
            }`,
      )}
    >
      {perfumes.map((perfume, index) => (
        <Fragment key={animateItems ? `${itemAnimationKey}-${perfume.id}` : perfume.id}>
          <div
            className={cn(
              animateItems
                ? "finder-card-animate opacity-0 translate-y-5 [animation:finder-card-in_480ms_cubic-bezier(0.22,1,0.36,1)_forwards]"
                : undefined,
            )}
            style={
              animateItems
                ? {
                    animationDelay: `${Math.min(index, 8) * 70}ms`,
                  }
                : undefined
            }
          >
            <PerfumeCard perfume={perfume} variant={cardVariant} />
          </div>
          {shouldInjectAd && index === adAfterIndex ? <AdInFeed /> : null}
        </Fragment>
      ))}
    </div>
  );
}

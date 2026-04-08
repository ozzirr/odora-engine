import { useTranslations } from "next-intl";

import { PerfumeCard, type PerfumeCardItem } from "@/components/perfumes/PerfumeCard";
import { cn } from "@/lib/utils";

type PerfumeGridProps = {
  perfumes: PerfumeCardItem[];
  cardVariant?: "default" | "catalog" | "featured" | "finder";
  mobileColumns?: 2 | 3;
  desktopColumns?: 3 | 4;
  layout?: "grid" | "list";
  animateItems?: boolean;
  itemAnimationKey?: number | string;
};

export function PerfumeGrid({
  perfumes,
  cardVariant = "default",
  mobileColumns = 2,
  desktopColumns = 4,
  layout = "grid",
  animateItems = false,
  itemAnimationKey = "default",
}: PerfumeGridProps) {
  const t = useTranslations("catalog.grid");

  if (perfumes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d8c9b6] bg-[#fbf7f0] p-8 text-center text-sm text-[#655444]">
        {t("empty")}
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
        <div
          key={animateItems ? `${itemAnimationKey}-${perfume.id}` : perfume.id}
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
      ))}
    </div>
  );
}

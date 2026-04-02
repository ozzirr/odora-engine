import { useTranslations } from "next-intl";

import { PerfumeCard, type PerfumeCardItem } from "@/components/perfumes/PerfumeCard";
import { cn } from "@/lib/utils";

type PerfumeGridProps = {
  perfumes: PerfumeCardItem[];
  cardVariant?: "default" | "catalog" | "finder";
  desktopColumns?: 3 | 4;
  layout?: "grid" | "list";
};

export function PerfumeGrid({
  perfumes,
  cardVariant = "default",
  desktopColumns = 4,
  layout = "grid",
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
          : `grid-cols-2 ${desktopColumns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`,
      )}
    >
      {perfumes.map((perfume) => (
        <PerfumeCard key={perfume.id} perfume={perfume} variant={cardVariant} />
      ))}
    </div>
  );
}

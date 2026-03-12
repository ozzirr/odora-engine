import { useTranslations } from "next-intl";

import { PerfumeCard, type PerfumeCardItem } from "@/components/perfumes/PerfumeCard";

type PerfumeGridProps = {
  perfumes: PerfumeCardItem[];
  cardVariant?: "default" | "catalog";
  desktopColumns?: 3 | 4;
};

export function PerfumeGrid({
  perfumes,
  cardVariant = "default",
  desktopColumns = 4,
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
    <div className={`grid grid-cols-2 gap-5 ${desktopColumns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
      {perfumes.map((perfume) => (
        <PerfumeCard key={perfume.id} perfume={perfume} variant={cardVariant} />
      ))}
    </div>
  );
}

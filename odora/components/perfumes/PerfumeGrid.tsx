import { PerfumeCard, type PerfumeCardItem } from "@/components/perfumes/PerfumeCard";

type PerfumeGridProps = {
  perfumes: PerfumeCardItem[];
};

export function PerfumeGrid({ perfumes }: PerfumeGridProps) {
  if (perfumes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d8c9b6] bg-[#fbf7f0] p-8 text-center text-sm text-[#655444]">
        No perfumes found with the current filters.
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {perfumes.map((perfume) => (
        <PerfumeCard key={perfume.id} perfume={perfume} />
      ))}
    </div>
  );
}

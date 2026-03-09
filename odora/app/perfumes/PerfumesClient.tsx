"use client";

import { PerfumeFilters } from "@/components/perfumes/PerfumeFilters";
import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import type { PerfumeCardItem } from "@/components/perfumes/PerfumeCard";
import type { ParsedPerfumeFilters } from "@/lib/filters";

type PerfumesClientProps = {
  perfumes: PerfumeCardItem[];
  selectedFilters: ParsedPerfumeFilters;
};

export function PerfumesClient({ perfumes, selectedFilters }: PerfumesClientProps) {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
      <PerfumeFilters selectedFilters={selectedFilters} />

      <section className="space-y-4">
        <p className="text-sm text-[#615140]">
          Showing <span className="font-semibold text-[#2a2018]">{perfumes.length}</span> fragrances
        </p>
        <PerfumeGrid perfumes={perfumes} />
      </section>
    </div>
  );
}

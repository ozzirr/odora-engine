import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import type { PerfumeCardItem } from "@/components/perfumes/PerfumeCard";
import { SectionTitle } from "@/components/ui/SectionTitle";

type FeaturedPerfumesProps = {
  perfumes: PerfumeCardItem[];
};

export function FeaturedPerfumes({ perfumes }: FeaturedPerfumesProps) {
  return (
    <section className="mt-24 space-y-8">
      <SectionTitle
        eyebrow="Featured"
        title="Curated perfumes to start your journey"
        subtitle="A mix of Arabic signatures, niche standouts, and designer icons with active offers."
      />
      <PerfumeGrid perfumes={perfumes} />
    </section>
  );
}

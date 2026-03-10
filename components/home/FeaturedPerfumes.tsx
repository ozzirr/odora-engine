import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import type { PerfumeCardItem } from "@/components/perfumes/PerfumeCard";
import { SectionTitle } from "@/components/ui/SectionTitle";

type FeaturedPerfumesProps = {
  perfumes: PerfumeCardItem[];
};

export function FeaturedPerfumes({ perfumes }: FeaturedPerfumesProps) {
  if (perfumes.length === 0) {
    return null;
  }

  return (
    <section className="mt-24 space-y-8">
      <SectionTitle
        eyebrow="Featured"
        title="Featured perfumes"
        subtitle="A considered edit of bottles worth knowing, from easy daily signatures to richer statement scents."
      />
      <PerfumeGrid perfumes={perfumes} />
    </section>
  );
}

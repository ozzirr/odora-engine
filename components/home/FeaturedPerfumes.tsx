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
        subtitle="Real product records selected in the homepage content layer, with graceful fallbacks when offers are missing."
      />
      <PerfumeGrid perfumes={perfumes} />
    </section>
  );
}

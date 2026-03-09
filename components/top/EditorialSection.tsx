import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import type { PerfumeCardItem } from "@/components/perfumes/PerfumeCard";
import { SectionTitle } from "@/components/ui/SectionTitle";

type EditorialSectionProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  perfumes: PerfumeCardItem[];
};

export function EditorialSection({ eyebrow, title, subtitle, perfumes }: EditorialSectionProps) {
  return (
    <section className="space-y-5">
      <SectionTitle eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <PerfumeGrid perfumes={perfumes} />
    </section>
  );
}

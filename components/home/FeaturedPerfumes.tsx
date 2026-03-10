import { useTranslations } from "next-intl";

import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import type { PerfumeCardItem } from "@/components/perfumes/PerfumeCard";
import { SectionTitle } from "@/components/ui/SectionTitle";

type FeaturedPerfumesProps = {
  perfumes: PerfumeCardItem[];
};

export function FeaturedPerfumes({ perfumes }: FeaturedPerfumesProps) {
  const t = useTranslations("home.featured");

  if (perfumes.length === 0) {
    return null;
  }

  return (
    <section className="mt-24 space-y-8">
      <SectionTitle
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <PerfumeGrid perfumes={perfumes} />
    </section>
  );
}

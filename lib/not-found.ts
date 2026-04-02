import type { HomePerfumeRecord } from "@/lib/homepage";

export function pickAlternativePerfumes(perfumes: HomePerfumeRecord[], limit = 4) {
  const seenSlugs = new Set<string>();

  return perfumes.filter((perfume) => {
    if (seenSlugs.has(perfume.slug)) {
      return false;
    }

    seenSlugs.add(perfume.slug);
    return true;
  }).slice(0, limit);
}

import { cleanString } from "./normalize";

const FAMILY_ORDER: Array<{ family: string; keywords: string[] }> = [
  {
    family: "Woody",
    keywords: ["wood", "woody", "oud", "cedar", "sandalwood", "vetiver", "patchouli"],
  },
  {
    family: "Floral",
    keywords: ["floral", "flower", "rose", "jasmine", "iris", "violet", "lily", "peony"],
  },
  {
    family: "Amber",
    keywords: ["amber", "oriental", "resin", "incense", "labdanum", "benzoin"],
  },
  {
    family: "Fresh",
    keywords: ["fresh", "aquatic", "marine", "citrus", "green", "bergamot", "lemon"],
  },
  {
    family: "Gourmand",
    keywords: ["gourmand", "vanilla", "caramel", "chocolate", "praline", "coffee", "tonka"],
  },
  {
    family: "Aromatic",
    keywords: ["aromatic", "lavender", "mint", "sage", "rosemary", "herbal", "spicy"],
  },
];

export function mapFamily(sourceFamily: string | undefined, notes: string[]): string {
  const source = cleanString(sourceFamily).toLowerCase();
  const noteText = notes.join(" ").toLowerCase();
  const searchable = `${source} ${noteText}`.trim();

  for (const entry of FAMILY_ORDER) {
    if (entry.keywords.some((keyword) => searchable.includes(keyword))) {
      return entry.family;
    }
  }

  return "Aromatic";
}


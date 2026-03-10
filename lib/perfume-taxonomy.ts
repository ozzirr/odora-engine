import { Gender, PriceRange } from "@prisma/client";

export const canonicalFragranceFamilies = [
  "Aromatic",
  "Amber",
  "Fresh",
  "Floral",
  "Gourmand",
  "Woody",
] as const;

export type CanonicalFragranceFamily = (typeof canonicalFragranceFamilies)[number];

export const canonicalConcentrations = [
  "Parfum",
  "Extrait de Parfum",
  "Eau de Parfum",
  "Eau de Toilette",
  "Cologne",
] as const;

export type CanonicalConcentration = (typeof canonicalConcentrations)[number];

export type CanonicalGender = "men" | "women" | "unisex" | "unknown";

const genderKeywords: Array<{ gender: CanonicalGender; keywords: string[] }> = [
  { gender: "unisex", keywords: ["unisex", "all genders", "shared"] },
  { gender: "men", keywords: ["male", "men", "masculine", "for him"] },
  { gender: "women", keywords: ["female", "women", "feminine", "for her"] },
];

const familyKeywords: Array<{ family: CanonicalFragranceFamily; keywords: string[] }> = [
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

const noteAliases: Record<string, string> = {
  "aldehyde": "Aldehydes",
  "aldehydes": "Aldehydes",
  "amber gris": "Ambergris",
  "ambergris": "Ambergris",
  "black currant": "Blackcurrant",
  "black peppercorn": "Black Pepper",
  "cassis": "Blackcurrant",
  "cedar wood": "Cedar",
  "cedarwood": "Cedar",
  "eau de cologne": "Cologne",
  "fig leaf": "Fig Leaf",
  "juniper berry": "Juniper Berries",
  "orange blossom": "Orange Blossom",
  "oudh": "Oud",
  "pink peppercorn": "Pink Pepper",
  "tonka": "Tonka Bean",
  "white musk": "Musk",
  "ylang-ylang": "Ylang Ylang",
};

const concentrationKeywords: Array<{ concentration: CanonicalConcentration; keywords: string[] }> = [
  { concentration: "Extrait de Parfum", keywords: ["extrait de parfum", "extrait"] },
  { concentration: "Eau de Parfum", keywords: ["eau de parfum", "edp"] },
  { concentration: "Eau de Toilette", keywords: ["eau de toilette", "edt"] },
  { concentration: "Parfum", keywords: ["parfum", "perfume"] },
  { concentration: "Cologne", keywords: ["cologne", "edc"] },
];

export const priceRangeThresholds = {
  budgetMax: 60,
  midMax: 120,
  premiumMax: 200,
} as const;

export function normalizeGenderLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return "unknown" as const;
  }

  if (normalized === "m") {
    return "men" as const;
  }

  if (normalized === "f") {
    return "women" as const;
  }

  for (const entry of genderKeywords) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      return entry.gender;
    }
  }

  return "unknown" as const;
}

export function canonicalGenderToPrisma(value: CanonicalGender) {
  if (value === "men") {
    return Gender.MEN;
  }

  if (value === "women") {
    return Gender.WOMEN;
  }

  return Gender.UNISEX;
}

export function normalizeFragranceFamily(value: string, notes: string[] = []): CanonicalFragranceFamily {
  const searchable = `${value} ${notes.join(" ")}`.trim().toLowerCase();

  for (const entry of familyKeywords) {
    if (entry.keywords.some((keyword) => searchable.includes(keyword))) {
      return entry.family;
    }
  }

  return "Aromatic";
}

export function normalizeNoteLabel(value: string) {
  const cleaned = value.trim().toLowerCase();
  if (!cleaned) {
    return "";
  }

  const alias = noteAliases[cleaned];
  const canonical = alias ?? cleaned;

  return canonical
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeConcentration(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  for (const entry of concentrationKeywords) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      return entry.concentration;
    }
  }

  return undefined;
}

export function mapPriceRangeFromValue(value: string) {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return PriceRange.MID;
  }

  if (normalized.includes("budget") || normalized.includes("cheap") || normalized.includes("affordable")) {
    return PriceRange.BUDGET;
  }

  if (normalized.includes("luxury") || normalized.includes("ultra premium")) {
    return PriceRange.LUXURY;
  }

  if (normalized.includes("premium") || normalized.includes("high")) {
    return PriceRange.PREMIUM;
  }

  return PriceRange.MID;
}

export function mapPriceRangeFromAmount(amount: number) {
  if (amount <= priceRangeThresholds.budgetMax) {
    return PriceRange.BUDGET;
  }

  if (amount <= priceRangeThresholds.midMax) {
    return PriceRange.MID;
  }

  if (amount <= priceRangeThresholds.premiumMax) {
    return PriceRange.PREMIUM;
  }

  return PriceRange.LUXURY;
}

type TranslationFn = {
  has: (key: string) => boolean;
  (key: string): string;
};

type TaxonomyCategory = "moods" | "seasons" | "occasions" | "notes" | "families";

const familyAliases: Record<string, string[]> = {
  woody: ["woody", "wood"],
  floral: ["floral"],
  amber: ["amber"],
  oriental: ["oriental"],
  fresh: ["fresh"],
  gourmand: ["gourmand"],
  citrus: ["citrus"],
  aromatic: ["aromatic"],
};

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, "")
    .replace(/[\/\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDisplayFallback(value: string) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getFamilyCandidates(value: string) {
  const candidates = [value];

  for (const [familyKey, aliases] of Object.entries(familyAliases)) {
    if (aliases.some((alias) => value === alias || value.includes(alias))) {
      candidates.push(familyKey);
    }
  }

  return [...new Set(candidates)];
}

export function getLocalizedTaxonomyLabel(
  value: string | null | undefined,
  category: TaxonomyCategory,
  t: TranslationFn,
) {
  const raw = value?.trim();
  if (!raw) {
    return "";
  }

  const normalized = toSlug(raw);
  if (!normalized) {
    return raw;
  }

  const candidates = category === "families" ? getFamilyCandidates(normalized) : [normalized];

  for (const candidate of candidates) {
    const key = `${category}.${candidate}`;
    if (t.has(key)) {
      return t(key);
    }
  }

  return toDisplayFallback(raw);
}

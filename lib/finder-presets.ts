export type FinderPresetQuery = Partial<{
  preset: string;
  gender: string;
  mood: string;
  season: string;
  occasion: string;
  budget: string;
  preferredNote: string;
  arabicOnly: "true";
  nicheOnly: "true";
}>;

export const finderPresets = {
  "Vanilla Lovers": {
    preset: "Vanilla Lovers",
    mood: "cozy",
    preferredNote: "vanilla",
  },
  "Fresh Daily": {
    preset: "Fresh Daily",
    mood: "fresh",
    occasion: "daily-wear",
    preferredNote: "bergamot",
  },
  "Arabic Signature": {
    preset: "Arabic Signature",
    arabicOnly: "true",
  },
  "Office Safe": {
    preset: "Office Safe",
    mood: "elegant",
    occasion: "office",
    preferredNote: "musk",
  },
  "Date Night": {
    preset: "Date Night",
    mood: "romantic",
    occasion: "date-night",
    preferredNote: "amber",
  },
  "Summer Citrus": {
    preset: "Summer Citrus",
    mood: "fresh",
    season: "summer",
    preferredNote: "bergamot",
  },
} as const satisfies Record<string, FinderPresetQuery>;

export type FinderPresetName = keyof typeof finderPresets;

export function getFinderPreset(name: string | null | undefined): FinderPresetQuery | null {
  if (!name) return null;
  const normalized = name.trim();
  if (normalized in finderPresets) {
    return finderPresets[normalized as FinderPresetName];
  }
  return null;
}

export function buildFinderQuery(preset: FinderPresetQuery): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(preset)) {
    if (value) params.set(key, value);
  }
  return params;
}

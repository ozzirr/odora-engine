type PerfumeTextRelation = {
  name?: string | null;
  slug?: string | null;
};

type PerfumeTextLabels = {
  family: string;
  notes: string;
  moods: string;
  occasions: string;
};

type PerfumeTextSource = {
  name: string;
  fragranceFamily?: string | null;
  descriptionShort?: string | null;
  descriptionLong?: string | null;
  brand?: {
    name?: string | null;
  } | null;
  notes?: Array<{
    intensity?: number | null;
    note?: PerfumeTextRelation | null;
  }> | null;
  moods?: Array<{
    weight?: number | null;
    mood?: PerfumeTextRelation | null;
  }> | null;
  occasions?: Array<{
    weight?: number | null;
    occasion?: PerfumeTextRelation | null;
  }> | null;
};

const syntheticDescriptionPatterns = [
  /^.+ by .+, .+ profile(?: with .+)?\.$/i,
  /^.+ by .+ is a .+ fragrance from parfumo top lists\.$/i,
  /^.+ by .+ belongs to the .+ family with top notes of .+, (?:a heart of|heart notes of) .+, and (?:a base of|base notes of) .+\.$/i,
  /^.+ by .+ belongs to the .+ family, opening with .+, evolving through .+, and finishing with .+\.$/i,
] as const;

function toDisplayLabel(value: PerfumeTextRelation | null | undefined) {
  const name = value?.name?.trim();
  if (name) {
    return name;
  }

  const slug = value?.slug?.trim();
  if (!slug) {
    return null;
  }

  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function uniqueRankedLabels<T extends { weight?: number | null; intensity?: number | null }>(
  items: T[],
  getLabel: (item: T) => string | null,
  limit: number,
) {
  return items
    .map((item) => ({
      label: getLabel(item),
      rank: item.intensity ?? item.weight ?? 0,
    }))
    .filter((item): item is { label: string; rank: number } => Boolean(item.label))
    .sort((left, right) => right.rank - left.rank || left.label.localeCompare(right.label))
    .filter((item, index, array) => array.findIndex((candidate) => candidate.label === item.label) === index)
    .slice(0, limit)
    .map((item) => item.label);
}

function joinLabels(labels: string[]) {
  return labels.filter(Boolean).join(", ");
}

export function isLikelySyntheticPerfumeDescription(value?: string | null) {
  const text = value?.trim();
  if (!text) {
    return false;
  }

  return syntheticDescriptionPatterns.some((pattern) => pattern.test(text));
}

export function getPerfumeShortText(perfume: PerfumeTextSource) {
  const description = perfume.descriptionShort?.trim();
  if (description && !isLikelySyntheticPerfumeDescription(description)) {
    return description;
  }

  const family = perfume.fragranceFamily?.trim();
  const notes = uniqueRankedLabels(perfume.notes ?? [], (item) => toDisplayLabel(item.note), 3);
  const segments = [family, joinLabels(notes)].filter((value): value is string => Boolean(value));

  if (segments.length > 0) {
    return segments.join(" · ");
  }

  return family ?? perfume.brand?.name?.trim() ?? perfume.name;
}

export function getPerfumeOverviewText(
  perfume: PerfumeTextSource,
  labels: PerfumeTextLabels = {
    family: "Family",
    notes: "Notes",
    moods: "Moods",
    occasions: "Occasions",
  },
) {
  const description = perfume.descriptionLong?.trim();
  if (description && !isLikelySyntheticPerfumeDescription(description)) {
    return description;
  }

  const facts = [
    perfume.fragranceFamily?.trim() ? `${labels.family}: ${perfume.fragranceFamily.trim()}` : null,
    (() => {
      const notes = uniqueRankedLabels(perfume.notes ?? [], (item) => toDisplayLabel(item.note), 5);
      return notes.length > 0 ? `${labels.notes}: ${joinLabels(notes)}` : null;
    })(),
    (() => {
      const moods = uniqueRankedLabels(perfume.moods ?? [], (item) => toDisplayLabel(item.mood), 3);
      return moods.length > 0 ? `${labels.moods}: ${joinLabels(moods)}` : null;
    })(),
    (() => {
      const occasions = uniqueRankedLabels(
        perfume.occasions ?? [],
        (item) => toDisplayLabel(item.occasion),
        3,
      );
      return occasions.length > 0 ? `${labels.occasions}: ${joinLabels(occasions)}` : null;
    })(),
  ].filter((value): value is string => Boolean(value));

  if (facts.length > 0) {
    return facts.join(". ");
  }

  return getPerfumeShortText(perfume);
}

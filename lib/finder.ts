import { Gender, PriceRange, type Prisma } from "@prisma/client";

export type FinderPreferences = {
  gender: "any" | "male" | "female" | "unisex";
  mood: string;
  season: string;
  occasion: string;
  budget: "any" | "budget" | "mid" | "premium" | "luxury";
  preferredNote: string;
  arabicOnly: boolean;
  nicheOnly: boolean;
};

export type FinderPerfume = {
  id: number;
  slug: string;
  name: string;
  descriptionShort: string;
  imageUrl: string | null;
  gender: string;
  fragranceFamily: string;
  priceRange: string;
  isArabic: boolean;
  isNiche: boolean;
  ratingInternal?: number | null;
  bestPriceAmount?: number | null;
  bestTotalPriceAmount?: number | null;
  bestCurrency?: string | null;
  bestStoreName?: string | null;
  bestOfferUrl?: string | null;
  hasAvailableOffer?: boolean | null;
  brand: {
    name: string;
  };
  notes: Array<{
    note: {
      slug: string;
    };
  }>;
  moods: Array<{
    mood: {
      slug: string;
    };
  }>;
  seasons: Array<{
    season: {
      slug: string;
    };
  }>;
  occasions: Array<{
    occasion: {
      slug: string;
    };
  }>;
};

export const defaultFinderPreferences: FinderPreferences = {
  gender: "any",
  mood: "",
  season: "",
  occasion: "",
  budget: "any",
  preferredNote: "",
  arabicOnly: false,
  nicheOnly: false,
};

const budgetRank: Record<"budget" | "mid" | "premium" | "luxury", number> = {
  budget: 1,
  mid: 2,
  premium: 3,
  luxury: 4,
};

const priceRangeToBudget: Record<string, "budget" | "mid" | "premium" | "luxury"> = {
  BUDGET: "budget",
  MID: "mid",
  PREMIUM: "premium",
  LUXURY: "luxury",
};

type FinderQueryInput = Partial<{
  gender: string | null;
  mood: string | null;
  season: string | null;
  occasion: string | null;
  preferredNote: string | null;
  note: string | null;
  budget: string | null;
  family: string | null;
  fragranceFamily: string | null;
  arabicOnly: boolean | string | null;
  nicheOnly: boolean | string | null;
}>;

export type NormalizedFinderFilters = {
  gender?: Gender;
  moodSlug?: string;
  seasonSlug?: string;
  occasionSlug?: string;
  noteSlug?: string;
  priceRange?: PriceRange;
  fragranceFamily?: string;
  isArabic?: boolean;
  isNiche?: boolean;
};

const emptyFinderValues = new Set(["", "any", "all", "null", "undefined"]);

function normalize(input: string | undefined | null) {
  return (input ?? "").trim().toLowerCase();
}

export function normalizeFinderFilter(value?: string | null) {
  if (value == null) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const lowered = trimmed.toLowerCase();
  if (emptyFinderValues.has(lowered)) {
    return undefined;
  }

  return lowered;
}

function normalizeBooleanFilter(value: boolean | string | null | undefined) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = normalizeFinderFilter(typeof value === "string" ? value : undefined);
  return normalized === "true" || normalized === "1";
}

function mapGenderPreferenceToDb(gender: FinderPreferences["gender"]) {
  if (gender === "male") {
    return Gender.MEN;
  }

  if (gender === "female") {
    return Gender.WOMEN;
  }

  if (gender === "unisex") {
    return Gender.UNISEX;
  }

  return null;
}

function mapGenderValueToEnum(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  if (value === "male" || value === "men") {
    return Gender.MEN;
  }

  if (value === "female" || value === "women") {
    return Gender.WOMEN;
  }

  if (value === "unisex") {
    return Gender.UNISEX;
  }

  return undefined;
}

function mapBudgetValueToEnum(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  if (value === "budget") {
    return PriceRange.BUDGET;
  }

  if (value === "mid") {
    return PriceRange.MID;
  }

  if (value === "premium") {
    return PriceRange.PREMIUM;
  }

  if (value === "luxury") {
    return PriceRange.LUXURY;
  }

  return undefined;
}

export function normalizeFinderQueryFilters(input: FinderQueryInput): NormalizedFinderFilters {
  const normalizedGender = normalizeFinderFilter(input.gender);
  const normalizedMood = normalizeFinderFilter(input.mood);
  const normalizedSeason = normalizeFinderFilter(input.season);
  const normalizedOccasion = normalizeFinderFilter(input.occasion);
  const normalizedBudget = normalizeFinderFilter(input.budget);
  const normalizedNote = normalizeFinderFilter(input.preferredNote ?? input.note);
  const normalizedFamily = normalizeFinderFilter(input.fragranceFamily ?? input.family);

  return {
    gender: mapGenderValueToEnum(normalizedGender),
    moodSlug: normalizedMood,
    seasonSlug: normalizedSeason,
    occasionSlug: normalizedOccasion,
    noteSlug: normalizedNote,
    priceRange: mapBudgetValueToEnum(normalizedBudget),
    fragranceFamily: normalizedFamily,
    isArabic: normalizeBooleanFilter(input.arabicOnly) ? true : undefined,
    isNiche: normalizeBooleanFilter(input.nicheOnly) ? true : undefined,
  };
}

export function buildFinderWhere(filters: NormalizedFinderFilters): Prisma.PerfumeWhereInput {
  // Mood/season/occasion/note mappings are currently sparse in the catalog.
  // These relation filters must stay optional; otherwise Finder behaves like
  // an implicit inner-join and collapses results to a tiny subset.
  return {
    ...(filters.gender ? { gender: filters.gender } : {}),
    ...(filters.priceRange ? { priceRange: filters.priceRange } : {}),
    ...(filters.isArabic ? { isArabic: true } : {}),
    ...(filters.isNiche ? { isNiche: true } : {}),
    ...(filters.fragranceFamily ? { fragranceFamily: filters.fragranceFamily } : {}),
    ...(filters.moodSlug
      ? {
          moods: {
            some: {
              mood: {
                slug: filters.moodSlug,
              },
            },
          },
        }
      : {}),
    ...(filters.seasonSlug
      ? {
          seasons: {
            some: {
              season: {
                slug: filters.seasonSlug,
              },
            },
          },
        }
      : {}),
    ...(filters.occasionSlug
      ? {
          occasions: {
            some: {
              occasion: {
                slug: filters.occasionSlug,
              },
            },
          },
        }
      : {}),
    ...(filters.noteSlug
      ? {
          notes: {
            some: {
              note: {
                slug: filters.noteSlug,
              },
            },
          },
        }
      : {}),
  };
}

export function buildFinderPreferencesFromInput(input: FinderQueryInput): FinderPreferences {
  const gender = normalizeFinderFilter(input.gender);
  const budget = normalizeFinderFilter(input.budget);

  return {
    gender:
      gender === "male" || gender === "female" || gender === "unisex"
        ? gender
        : "any",
    mood: normalizeFinderFilter(input.mood) ?? "",
    season: normalizeFinderFilter(input.season) ?? "",
    occasion: normalizeFinderFilter(input.occasion) ?? "",
    budget:
      budget === "budget" || budget === "mid" || budget === "premium" || budget === "luxury"
        ? budget
        : "any",
    preferredNote: normalizeFinderFilter(input.preferredNote ?? input.note) ?? "",
    arabicOnly: normalizeBooleanFilter(input.arabicOnly),
    nicheOnly: normalizeBooleanFilter(input.nicheOnly),
  };
}

export function serializeFinderPreferences(preferences: FinderPreferences) {
  return JSON.stringify({
    gender: preferences.gender,
    mood: preferences.mood || null,
    season: preferences.season || null,
    occasion: preferences.occasion || null,
    budget: preferences.budget,
    preferredNote: preferences.preferredNote || null,
    arabicOnly: preferences.arabicOnly,
    nicheOnly: preferences.nicheOnly,
  });
}

export function hasConfiguredFinderPreferences(preferences: FinderPreferences) {
  return (
    preferences.gender !== defaultFinderPreferences.gender ||
    preferences.mood !== defaultFinderPreferences.mood ||
    preferences.season !== defaultFinderPreferences.season ||
    preferences.occasion !== defaultFinderPreferences.occasion ||
    preferences.budget !== defaultFinderPreferences.budget ||
    preferences.preferredNote !== defaultFinderPreferences.preferredNote ||
    preferences.arabicOnly !== defaultFinderPreferences.arabicOnly ||
    preferences.nicheOnly !== defaultFinderPreferences.nicheOnly
  );
}

export function matchPerfumesFromPreferences(
  preferences: FinderPreferences,
  perfumes: FinderPerfume[],
) {
  if (!hasConfiguredFinderPreferences(preferences)) {
    return [...perfumes].sort((a, b) => {
      const left = a.ratingInternal ?? 0;
      const right = b.ratingInternal ?? 0;

      if (right !== left) {
        return right - left;
      }

      return a.name.localeCompare(b.name);
    });
  }

  const genderTarget = mapGenderPreferenceToDb(preferences.gender);
  const preferredMood = normalizeFinderFilter(preferences.mood);
  const preferredSeason = normalizeFinderFilter(preferences.season);
  const preferredOccasion = normalizeFinderFilter(preferences.occasion);
  const preferredNote = normalizeFinderFilter(preferences.preferredNote);
  const preferredBudget = normalizeFinderFilter(preferences.budget);
  const selectedBudget =
    preferredBudget && preferredBudget in budgetRank
      ? (preferredBudget as keyof typeof budgetRank)
      : undefined;

  return perfumes
    .map((perfume) => {
      if (preferences.arabicOnly && !perfume.isArabic) {
        return null;
      }

      if (preferences.nicheOnly && !perfume.isNiche) {
        return null;
      }

      if (genderTarget && perfume.gender !== genderTarget) {
        return null;
      }

      if (selectedBudget) {
        const perfumeBudget = priceRangeToBudget[perfume.priceRange] ?? "luxury";
        if (perfumeBudget !== selectedBudget) {
          return null;
        }
      }

      if (
        preferredMood &&
        !(perfume.moods ?? []).some((mood) => normalize(mood.mood?.slug ?? "") === preferredMood)
      ) {
        return null;
      }

      if (
        preferredSeason &&
        !(perfume.seasons ?? []).some(
          (season) => normalize(season.season?.slug ?? "") === preferredSeason,
        )
      ) {
        return null;
      }

      if (
        preferredOccasion &&
        !(perfume.occasions ?? []).some(
          (occasion) => normalize(occasion.occasion?.slug ?? "") === preferredOccasion,
        )
      ) {
        return null;
      }

      if (
        preferredNote &&
        !(perfume.notes ?? []).some((note) => {
          const slug = normalize(note.note?.slug ?? "");
          return slug === preferredNote || slug.includes(preferredNote);
        })
      ) {
        return null;
      }

      let score = 0;

      if (genderTarget) {
        score += 4;
      }

      if (
        preferredMood &&
        (perfume.moods ?? []).some((mood) => normalize(mood.mood?.slug ?? "") === preferredMood)
      ) {
        score += 3;
      }

      if (
        preferredSeason &&
        (perfume.seasons ?? []).some(
          (season) => normalize(season.season?.slug ?? "") === preferredSeason,
        )
      ) {
        score += 3;
      }

      if (
        preferredNote &&
        (perfume.notes ?? []).some((note) => {
          const slug = normalize(note.note?.slug ?? "");
          return slug === preferredNote || slug.includes(preferredNote);
        })
      ) {
        score += 4;
      }

      if (selectedBudget) {
        score += 3;
      }

      if (preferences.arabicOnly && perfume.isArabic) {
        score += 2;
      }

      if (preferences.nicheOnly && perfume.isNiche) {
        score += 2;
      }

      return {
        perfume,
        score,
        rating: perfume.ratingInternal ?? 0,
        bestPrice: perfume.bestTotalPriceAmount ?? Number.POSITIVE_INFINITY,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (a.bestPrice !== b.bestPrice) {
        return a.bestPrice - b.bestPrice;
      }

      return b.rating - a.rating;
    })
    .map((item) => item.perfume);
}

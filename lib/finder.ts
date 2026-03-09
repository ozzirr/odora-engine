import { computeBestOffer, type OfferForPricing } from "@/lib/pricing";

export type FinderPreferences = {
  gender: "any" | "male" | "female" | "unisex";
  mood: string;
  season: string;
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
  brand: {
    name: string;
  };
  offers: OfferForPricing[];
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

function normalize(input: string) {
  return input.trim().toLowerCase();
}

function mapGenderPreferenceToDb(gender: FinderPreferences["gender"]) {
  if (gender === "male") {
    return "MEN";
  }

  if (gender === "female") {
    return "WOMEN";
  }

  if (gender === "unisex") {
    return "UNISEX";
  }

  return null;
}

export function matchPerfumesFromPreferences(
  preferences: FinderPreferences,
  perfumes: FinderPerfume[],
) {
  const genderTarget = mapGenderPreferenceToDb(preferences.gender);
  const preferredMood = normalize(preferences.mood);
  const preferredSeason = normalize(preferences.season);
  const preferredNote = normalize(preferences.preferredNote);

  return perfumes
    .map((perfume) => {
      if (preferences.arabicOnly && !perfume.isArabic) {
        return null;
      }

      if (preferences.nicheOnly && !perfume.isNiche) {
        return null;
      }

      let score = 0;

      if (genderTarget) {
        if (perfume.gender === genderTarget) {
          score += 4;
        } else if (perfume.gender === "UNISEX") {
          score += 2;
        }
      }

      if (
        preferredMood &&
        perfume.moods.some((mood) => normalize(mood.mood.slug) === preferredMood)
      ) {
        score += 3;
      }

      if (
        preferredSeason &&
        perfume.seasons.some((season) => normalize(season.season.slug) === preferredSeason)
      ) {
        score += 3;
      }

      if (
        preferredNote &&
        perfume.notes.some((note) => {
          const slug = normalize(note.note.slug);
          return slug === preferredNote || slug.includes(preferredNote);
        })
      ) {
        score += 4;
      }

      if (preferences.budget !== "any") {
        const targetBudget = budgetRank[preferences.budget];
        const perfumeBudget = budgetRank[priceRangeToBudget[perfume.priceRange] ?? "luxury"];

        if (perfumeBudget === targetBudget) {
          score += 3;
        } else if (perfumeBudget < targetBudget) {
          score += 2;
        }
      }

      if (preferences.arabicOnly && perfume.isArabic) {
        score += 2;
      }

      if (preferences.nicheOnly && perfume.isNiche) {
        score += 2;
      }

      const bestOffer = computeBestOffer(perfume.offers);

      return {
        perfume,
        score,
        rating: perfume.ratingInternal ?? 0,
        bestPrice: bestOffer?.bestTotalPrice ?? Number.POSITIVE_INFINITY,
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

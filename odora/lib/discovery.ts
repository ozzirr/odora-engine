import { computeBestOffer, type OfferForPricing } from "@/lib/pricing";

type DiscoveryNote = {
  intensity?: number | null;
  note: {
    name: string;
    slug: string;
    noteType: string;
  };
};

type DiscoveryMood = {
  mood: {
    slug: string;
  };
};

export type DiscoveryPerfume = {
  id: number;
  slug: string;
  name: string;
  fragranceFamily: string;
  gender: string;
  isArabic: boolean;
  isNiche: boolean;
  ratingInternal?: number | null;
  offers: OfferForPricing[];
  notes: DiscoveryNote[];
  moods: DiscoveryMood[];
};

export function getPerfumeNotes(perfume: { notes: DiscoveryNote[] }) {
  const groups: Record<"top" | "heart" | "base", Array<{ name: string; slug: string; intensity: number | null }>> = {
    top: [],
    heart: [],
    base: [],
  };

  const seen = new Set<string>();

  for (const item of perfume.notes) {
    const type = item.note.noteType.toLowerCase();

    if (type !== "top" && type !== "heart" && type !== "base") {
      continue;
    }

    const key = `${type}:${item.note.slug}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    groups[type].push({
      name: item.note.name,
      slug: item.note.slug,
      intensity: item.intensity ?? null,
    });
  }

  return groups;
}

function getNoteSlugSet(perfume: DiscoveryPerfume) {
  return new Set(perfume.notes.map((item) => item.note.slug));
}

function getMoodSlugSet(perfume: DiscoveryPerfume) {
  return new Set(perfume.moods.map((item) => item.mood.slug));
}

function getSetOverlapCount(first: Set<string>, second: Set<string>) {
  let overlap = 0;

  for (const value of first) {
    if (second.has(value)) {
      overlap += 1;
    }
  }

  return overlap;
}

function scoreSimilarity(target: DiscoveryPerfume, candidate: DiscoveryPerfume) {
  const targetNotes = getNoteSlugSet(target);
  const candidateNotes = getNoteSlugSet(candidate);
  const targetMoods = getMoodSlugSet(target);
  const candidateMoods = getMoodSlugSet(candidate);

  const noteOverlap = getSetOverlapCount(targetNotes, candidateNotes);
  const moodOverlap = getSetOverlapCount(targetMoods, candidateMoods);

  let score = 0;

  if (target.fragranceFamily.toLowerCase() === candidate.fragranceFamily.toLowerCase()) {
    score += 5;
  }

  score += Math.min(noteOverlap * 2, 8);

  if (target.gender === candidate.gender) {
    score += 2;
  }

  score += Math.min(moodOverlap, 3);

  if (target.isArabic === candidate.isArabic) {
    score += 1;
  }

  if (target.isNiche === candidate.isNiche) {
    score += 1;
  }

  return {
    score,
    noteOverlap,
    moodOverlap,
  };
}

export function getSimilarPerfumes(
  perfume: DiscoveryPerfume,
  allPerfumes: DiscoveryPerfume[],
  limit = 4,
) {
  return allPerfumes
    .filter((candidate) => candidate.id !== perfume.id)
    .map((candidate) => {
      const similarity = scoreSimilarity(perfume, candidate);
      const best = computeBestOffer(candidate.offers);

      return {
        candidate,
        ...similarity,
        bestTotal: best?.bestTotalPrice ?? Number.POSITIVE_INFINITY,
        rating: candidate.ratingInternal ?? 0,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (b.noteOverlap !== a.noteOverlap) {
        return b.noteOverlap - a.noteOverlap;
      }

      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }

      return a.bestTotal - b.bestTotal;
    })
    .slice(0, limit)
    .map((item) => item.candidate);
}

export function getCheaperAlternatives(
  perfume: DiscoveryPerfume,
  allPerfumes: DiscoveryPerfume[],
  limit = 4,
) {
  const targetBestPrice = computeBestOffer(perfume.offers)?.bestTotalPrice;

  if (targetBestPrice == null) {
    return [];
  }

  return allPerfumes
    .filter((candidate) => candidate.id !== perfume.id)
    .map((candidate) => {
      const similarity = scoreSimilarity(perfume, candidate);
      const best = computeBestOffer(candidate.offers);
      const bestTotal = best?.bestTotalPrice;

      return {
        candidate,
        ...similarity,
        bestTotal,
      };
    })
    .filter((item) => {
      if (item.bestTotal == null || item.bestTotal >= targetBestPrice) {
        return false;
      }

      return (
        item.noteOverlap > 0 ||
        perfume.fragranceFamily.toLowerCase() === item.candidate.fragranceFamily.toLowerCase()
      );
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return (a.bestTotal ?? Number.POSITIVE_INFINITY) - (b.bestTotal ?? Number.POSITIVE_INFINITY);
    })
    .slice(0, limit)
    .map((item) => item.candidate);
}

import { type Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  buildFinderWhere,
  matchPerfumesFromPreferences,
  normalizeFinderFilter,
  normalizeFinderQueryFilters,
  type FinderPerfume,
  type FinderPreferences,
} from "@/lib/finder";
import {
  getCatalogVisibilityWhere,
  logCatalogQueryError,
  mergePerfumeWhere,
} from "@/lib/catalog";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

const finderInclude = {
  brand: true,
  offers: {
    include: {
      store: true,
    },
  },
  notes: {
    include: {
      note: {
        select: {
          slug: true,
        },
      },
    },
  },
  moods: {
    include: {
      mood: {
        select: {
          slug: true,
        },
      },
    },
  },
  seasons: {
    include: {
      season: {
        select: {
          slug: true,
        },
      },
    },
  },
} satisfies Prisma.PerfumeInclude;

function parsePreferenceBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = normalizeFinderFilter(value);
    return normalized === "true" || normalized === "1";
  }

  return false;
}

function parseFinderPreferences(payload: unknown): FinderPreferences {
  const source = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};

  const gender =
    typeof source.gender === "string" ? (source.gender.toLowerCase() as FinderPreferences["gender"]) : "any";
  const budget =
    typeof source.budget === "string" ? (source.budget.toLowerCase() as FinderPreferences["budget"]) : "any";

  return {
    gender:
      gender === "male" || gender === "female" || gender === "unisex"
        ? gender
        : "any",
    mood: typeof source.mood === "string" ? source.mood : "",
    season: typeof source.season === "string" ? source.season : "",
    budget:
      budget === "budget" || budget === "mid" || budget === "premium" || budget === "luxury"
        ? budget
        : "any",
    preferredNote: typeof source.preferredNote === "string" ? source.preferredNote : "",
    arabicOnly: parsePreferenceBoolean(source.arabicOnly),
    nicheOnly: parsePreferenceBoolean(source.nicheOnly),
  };
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured) {
    return NextResponse.json({ results: [], total: 0 });
  }

  const payload = await request.json().catch(() => ({}));
  const preferences = parseFinderPreferences(payload);
  const normalizedFilters = normalizeFinderQueryFilters(preferences);
  const finderWhere = buildFinderWhere(normalizedFilters);
  const where = mergePerfumeWhere(finderWhere, getCatalogVisibilityWhere());

  try {
    const candidates = (await prisma.perfume.findMany({
      where,
      include: finderInclude,
    })) as FinderPerfume[];

    const results = matchPerfumesFromPreferences(preferences, candidates);

    return NextResponse.json({
      results,
      total: results.length,
    });
  } catch (error) {
    logCatalogQueryError("finder:search", error);
    return NextResponse.json(
      { results: [], total: 0, error: "Finder query failed." },
      { status: 500 },
    );
  }
}

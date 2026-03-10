import { type Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  buildFinderPreferencesFromInput,
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
  occasions: {
    include: {
      occasion: {
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
  const normalized = buildFinderPreferencesFromInput({
    gender: typeof source.gender === "string" ? source.gender : null,
    mood: typeof source.mood === "string" ? source.mood : null,
    season: typeof source.season === "string" ? source.season : null,
    occasion: typeof source.occasion === "string" ? source.occasion : null,
    budget: typeof source.budget === "string" ? source.budget : null,
    preferredNote: typeof source.preferredNote === "string" ? source.preferredNote : null,
    arabicOnly: parsePreferenceBoolean(source.arabicOnly),
    nicheOnly: parsePreferenceBoolean(source.nicheOnly),
  });

  return normalized;
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

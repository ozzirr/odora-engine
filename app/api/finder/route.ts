import { type Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  buildFinderPreferencesFromInput,
  buildFinderWhere,
  hasConfiguredFinderPreferences,
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

const FINDER_RESULTS_PAGE_SIZE = 20;
const FINDER_MIN_CANDIDATES = 120;
const FINDER_FILTERED_CANDIDATE_CAP = 320;

const finderInclude = {
  brand: true,
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

function parsePositiveInt(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return fallback;
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured) {
    return NextResponse.json({ results: [], total: 0, hasMore: false, nextOffset: 0 });
  }

  const payload = await request.json().catch(() => ({}));
  const payloadObject =
    payload && typeof payload === "object" ? (payload as Record<string, unknown>) : undefined;
  const preferences = parseFinderPreferences(payload);
  const offset = parsePositiveInt(payloadObject?.offset, 0);
  const limit = Math.min(parsePositiveInt(payloadObject?.limit, FINDER_RESULTS_PAGE_SIZE), 40);
  const normalizedFilters = normalizeFinderQueryFilters(preferences);
  const finderWhere = buildFinderWhere(normalizedFilters);
  const where = mergePerfumeWhere(finderWhere, getCatalogVisibilityWhere());
  const hasConfiguredPreferences = hasConfiguredFinderPreferences(preferences);
  const candidateLimit = hasConfiguredPreferences
    ? Math.min(Math.max(offset + limit + 80, FINDER_MIN_CANDIDATES), FINDER_FILTERED_CANDIDATE_CAP)
    : FINDER_MIN_CANDIDATES;

  try {
    const candidates = (await prisma.perfume.findMany({
      where,
      include: finderInclude,
      orderBy: [{ ratingInternal: "desc" }, { updatedAt: "desc" }, { name: "asc" }],
      take: candidateLimit,
    })) as FinderPerfume[];

    const results = matchPerfumesFromPreferences(preferences, candidates);
    const paginatedResults = results.slice(offset, offset + limit);

    return NextResponse.json({
      results: paginatedResults,
      total: results.length,
      hasMore: offset + paginatedResults.length < results.length,
      nextOffset: offset + paginatedResults.length,
    });
  } catch (error) {
    logCatalogQueryError("finder:search", error);
    return NextResponse.json(
      { results: [], total: 0, hasMore: false, nextOffset: 0, error: "Finder query failed." },
      { status: 500 },
    );
  }
}

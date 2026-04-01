import { NextResponse } from "next/server";

import {
  buildFinderPreferencesFromInput,
  normalizeFinderFilter,
  type FinderPreferences,
} from "@/lib/finder";
import { getFinderSearch, FINDER_RESULTS_PAGE_SIZE } from "@/lib/finder-search";
import { isDatabaseConfigured } from "@/lib/prisma";

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
  const result = await getFinderSearch(preferences, offset, limit);

  return NextResponse.json(result);
}

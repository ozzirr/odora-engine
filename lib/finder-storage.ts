export const FINDER_LAST_SEARCH_STORAGE_KEY = "odora:last-finder-search:v1";

export type StoredFinderPreferences = Partial<{
  gender: string;
  mood: string;
  season: string;
  occasion: string;
  budget: string;
  preferredNote: string;
  arabicOnly: boolean;
  nicheOnly: boolean;
}>;

const allowedKeys = [
  "gender",
  "mood",
  "season",
  "occasion",
  "budget",
  "preferredNote",
] as const;

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function sanitizeStoredFinderPreferences(value: unknown): StoredFinderPreferences {
  if (!value || typeof value !== "object") {
    return {};
  }

  const source = value as Record<string, unknown>;
  const preferences: StoredFinderPreferences = {};

  for (const key of allowedKeys) {
    const stringValue = readString(source[key]);
    if (stringValue) {
      preferences[key] = stringValue;
    }
  }

  if (typeof source.arabicOnly === "boolean") {
    preferences.arabicOnly = source.arabicOnly;
  }

  if (typeof source.nicheOnly === "boolean") {
    preferences.nicheOnly = source.nicheOnly;
  }

  return preferences;
}

export function buildFinderStartSearchParams(preferences: StoredFinderPreferences) {
  const params = new URLSearchParams();
  params.set("start", "1");

  for (const key of allowedKeys) {
    const value = preferences[key];
    if (value && value !== "any") {
      params.set(key, value);
    }
  }

  if (preferences.arabicOnly) {
    params.set("arabicOnly", "true");
  }

  if (preferences.nicheOnly) {
    params.set("nicheOnly", "true");
  }

  return params;
}

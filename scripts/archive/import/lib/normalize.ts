const NOTE_PREFIX_PATTERN = /^(top|middle|heart|base)\s*notes?\s*:/i;

export function cleanString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

export function normalizeCsvHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function toTitleCase(value: string): string {
  const cleaned = cleanString(value).toLowerCase();
  if (!cleaned) {
    return "";
  }

  return cleaned
    .split(" ")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

export function normalizeBoolean(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  const normalized = cleanString(value).toLowerCase();
  return ["1", "true", "yes", "y", "si", "s", "on"].includes(normalized);
}

export function normalizeYear(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(cleanString(value), 10);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  const maxYear = new Date().getFullYear() + 1;
  if (parsed < 1800 || parsed > maxYear) {
    return undefined;
  }

  return parsed;
}

export function normalizeRating(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = cleanString(value).replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  let result = parsed;
  if (result > 5 && result <= 10) {
    result = result / 2;
  }

  if (result < 0 || result > 5) {
    return undefined;
  }

  return Math.round(result * 100) / 100;
}

function parseArrayLike(rawValue: string): string[] | null {
  const trimmed = rawValue.trim();
  if (!(trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    return null;
  }

  const jsonCandidate = trimmed.replace(/'/g, "\"");
  try {
    const parsed = JSON.parse(jsonCandidate) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed
      .map((item) => cleanString(item))
      .filter((item): item is string => item.length > 0);
  } catch {
    return null;
  }
}

export function splitNotes(rawValue: string | undefined): string[] {
  if (!rawValue) {
    return [];
  }

  const cleaned = cleanString(rawValue);
  if (!cleaned) {
    return [];
  }

  const fromArray = parseArrayLike(cleaned);
  const values = fromArray ?? cleaned.split(/[;,|/]+/g);
  const seen = new Set<string>();
  const notes: string[] = [];

  for (const value of values) {
    const note = cleanString(value)
      .replace(NOTE_PREFIX_PATTERN, "")
      .replace(/^[-*•]\s*/, "")
      .replace(/\(.*?\)/g, "")
      .trim();

    if (!note) {
      continue;
    }

    const key = note.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    notes.push(toTitleCase(note));
  }

  return notes;
}


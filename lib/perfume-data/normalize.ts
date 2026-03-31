import { CatalogStatus, DataQuality, SourceType } from "@prisma/client";

import {
  canonicalGenderToPrisma,
  mapPriceRangeFromValue,
  normalizeConcentration,
  normalizeFragranceFamily,
  normalizeGenderLabel,
  normalizeNoteLabel,
} from "@/lib/perfume-taxonomy";
import type {
  NormalizationResult,
  NormalizedPerfumeRecord,
  NoteGroups,
  PerfumeDataSource,
  RawPerfumeRecord,
  ValidationIssue,
} from "@/lib/perfume-data/types";

const notePrefixPattern = /^(top|middle|heart|base)\s*notes?\s*:/i;

const fieldAliases = {
  brand: ["brand", "brand_name", "house", "maker", "manufacturer"],
  perfumeName: ["name", "perfume_name", "perfume", "fragrance", "title", "perfume_title"],
  perfumeSlug: ["slug", "perfume_slug", "perfumeslug"],
  gender: ["gender", "sex", "targetgender", "forgender"],
  concentration: ["concentration", "strength"],
  year: ["release_year", "releaseyear", "year", "launch_year", "launchyear", "released", "release"],
  family: ["family", "fragrance_family", "fragrancefamily", "category", "olfactivefamily", "mainaccord", "mainaccords"],
  topNotes: ["top_notes", "topnotes", "topnote", "notes_top", "top", "headnotes"],
  heartNotes: ["heart_notes", "heartnotes", "heartnote", "middle_notes", "middlenotes", "notes_heart"],
  baseNotes: ["base_notes", "basenotes", "base", "notes_base", "drydown"],
  allNotes: ["notes", "allnotes", "note", "noteslist", "note_list"],
  rating: ["rating_internal", "rating", "score", "community_rating", "communityrating", "avg_rating"],
  longevityScore: ["longevity_score", "longevityscore", "longevity"],
  sillageScore: ["sillage_score", "sillagescore", "sillage"],
  versatilityScore: ["versatility_score", "versatilityscore", "versatility"],
  imageUrl: ["image_url", "imageurl", "image", "photo", "picture", "img"],
  imageSourceUrl: ["image_source_url", "imagesourceurl"],
  imageStoragePath: ["image_storage_path", "imagestoragepath"],
  imagePublicUrl: ["image_public_url", "imagepublicurl"],
  descriptionShort: ["description_short", "short_description", "descriptionshort", "summary", "excerpt"],
  descriptionLong: ["description_long", "long_description", "descriptionlong", "description", "details", "about"],
  priceRange: ["price_range", "pricerange", "price", "pricecategory"],
  isArabic: ["is_arabic", "isarabic", "arabic"],
  isNiche: ["is_niche", "isniche", "niche"],
  catalogStatus: ["catalog_status", "catalogstatus"],
  sourceName: ["source_name", "sourcename"],
  sourceType: ["source_type", "sourcetype"],
  officialSourceUrl: ["official_source_url", "officialsourceurl", "source_url", "sourceurl", "parfumo_url"],
  sourceConfidence: ["source_confidence", "sourceconfidence"],
  dataQuality: ["data_quality", "dataquality"],
  enrichmentStatus: ["enrichment_status", "enrichmentstatus"],
} as const;

export const canonicalCatalogHeaders = [
  "brand",
  "name",
  "slug",
  "gender",
  "concentration",
  "year",
  "top_notes",
  "heart_notes",
  "base_notes",
  "family",
  "rating",
  "longevity_score",
  "sillage_score",
  "versatility_score",
  "imageUrl",
  "image_source_url",
  "image_storage_path",
  "image_public_url",
  "description_short",
  "description_long",
  "price_range",
  "is_arabic",
  "is_niche",
  "catalog_status",
  "source_name",
  "source_type",
  "official_source_url",
  "source_confidence",
  "data_quality",
] as const;

export function cleanString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

export function normalizeCsvHeader(value: string) {
  return value.replace(/^\uFEFF/, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function slugify(input: string) {
  const normalized = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "unknown";
}

export function normalizeBoolean(value: unknown, defaultValue = false) {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  const normalized = cleanString(String(value)).toLowerCase();
  if (!normalized) {
    return defaultValue;
  }

  if (["1", "true", "yes", "y", "si", "s", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "n", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

export function normalizeYear(value: unknown) {
  const cleaned = cleanString(String(value ?? ""));
  if (!cleaned) {
    return undefined;
  }

  const parsed = Number.parseInt(cleaned, 10);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  const maxYear = new Date().getFullYear() + 1;
  if (parsed < 1800 || parsed > maxYear) {
    return undefined;
  }

  return parsed;
}

export function normalizeRating(value: unknown) {
  const cleaned = cleanString(String(value ?? ""));
  if (!cleaned) {
    return undefined;
  }

  const parsed = Number.parseFloat(cleaned.replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  const normalized = parsed > 5 && parsed <= 10 ? parsed / 2 : parsed;
  if (normalized < 0 || normalized > 5) {
    return undefined;
  }

  return Math.round(normalized * 100) / 100;
}

function createIssue(
  sourceRow: number,
  field: string,
  message: string,
  level: ValidationIssue["level"] = "error",
): ValidationIssue {
  return {
    level,
    field,
    message,
    sourceRow,
  };
}

function normalizeTenPointScore(value: unknown) {
  const cleaned = cleanString(String(value ?? ""));
  if (!cleaned) {
    return { value: undefined };
  }

  const parsed = Number.parseFloat(cleaned.replace(",", "."));
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return { issue: "Score must be an integer between 0 and 10." };
  }

  if (parsed < 0 || parsed > 10) {
    return { issue: "Score must be between 0 and 10." };
  }

  return { value: parsed };
}

function parseArrayLike(rawValue: string) {
  const trimmed = rawValue.trim();
  if (!(trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed.replace(/'/g, "\"")) as unknown;
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

function toTitleCase(value: string) {
  return cleanString(value)
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function splitNotes(value: unknown) {
  const cleaned = cleanString(String(value ?? ""));
  if (!cleaned) {
    return [];
  }

  const values = parseArrayLike(cleaned) ?? cleaned.split(/[;,|/]+/g);
  const seen = new Set<string>();
  const notes: string[] = [];

  for (const rawValue of values) {
    const normalized = normalizeNoteLabel(
      toTitleCase(rawValue)
        .replace(notePrefixPattern, "")
        .replace(/^[-*•]\s*/, "")
        .replace(/\(.*?\)/g, "")
        .trim(),
    );

    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    notes.push(normalized);
  }

  return notes;
}

function dedupeNotes(notes: string[]) {
  const seen = new Set<string>();
  const values: string[] = [];

  for (const note of notes) {
    const key = note.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    values.push(note);
  }

  return values;
}

function getRecordValue(record: RawPerfumeRecord, aliases: readonly string[]) {
  for (const alias of aliases) {
    const direct = record[alias];
    if (direct !== undefined && cleanString(String(direct)).length > 0) {
      return direct;
    }

    const normalized = record[normalizeCsvHeader(alias)];
    if (normalized !== undefined && cleanString(String(normalized)).length > 0) {
      return normalized;
    }
  }

  return undefined;
}

function normalizeUrl(value: unknown) {
  const cleaned = cleanString(String(value ?? ""));
  if (!cleaned) {
    return undefined;
  }

  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }
    return cleaned;
  } catch {
    return undefined;
  }
}

function normalizeStoragePath(value: unknown) {
  const cleaned = cleanString(String(value ?? ""));
  if (!cleaned) {
    return undefined;
  }

  return cleaned.replace(/^\/+/, "").replace(/^perfumes\//i, "");
}

function parseCatalogStatus(value: unknown, source: PerfumeDataSource) {
  const normalized = cleanString(String(value ?? "")).toUpperCase();
  if (normalized === "VERIFIED") {
    return CatalogStatus.VERIFIED;
  }

  if (normalized === "IMPORTED_UNVERIFIED") {
    return CatalogStatus.IMPORTED_UNVERIFIED;
  }

  if (normalized === "DEMO") {
    return CatalogStatus.DEMO;
  }

  return source === "verified" ? CatalogStatus.VERIFIED : CatalogStatus.IMPORTED_UNVERIFIED;
}

function parseEnrichmentStatus(
  value: unknown,
): NormalizedPerfumeRecord["enrichmentStatus"] {
  const normalized = cleanString(String(value ?? "")).toLowerCase();

  if (
    normalized === "matched_enriched" ||
    normalized === "matched_provenance_only" ||
    normalized === "low_confidence" ||
    normalized === "ambiguous" ||
    normalized === "unmatched"
  ) {
    return normalized;
  }

  return undefined;
}

function parseSourceType(value: unknown, source: PerfumeDataSource) {
  const normalized = cleanString(String(value ?? "")).toUpperCase();
  if (normalized === "MANUAL_CURATION") {
    return SourceType.MANUAL_CURATION;
  }

  if (normalized === "COMMERCIAL_LICENSED") {
    return SourceType.COMMERCIAL_LICENSED;
  }

  if (normalized === "BRAND_OFFICIAL") {
    return SourceType.BRAND_OFFICIAL;
  }

  if (normalized === "PARTNER_FEED") {
    return SourceType.PARTNER_FEED;
  }

  if (normalized === "INTERNAL_DEMO") {
    return SourceType.INTERNAL_DEMO;
  }

  return source === "verified" ? SourceType.OTHER : SourceType.OTHER;
}

function parseDataQuality(value: unknown, source: PerfumeDataSource) {
  const normalized = cleanString(String(value ?? "")).toUpperCase();
  if (normalized === "HIGH") {
    return DataQuality.HIGH;
  }

  if (normalized === "LOW") {
    return DataQuality.LOW;
  }

  return source === "verified" ? DataQuality.MEDIUM : DataQuality.MEDIUM;
}

function parseSourceConfidence(value: unknown, source: PerfumeDataSource) {
  const cleaned = cleanString(String(value ?? ""));
  const fallback = source === "verified" ? 0.9 : 0.35;
  if (!cleaned) {
    return fallback;
  }

  const parsed = Number.parseFloat(cleaned.replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  if (parsed > 1) {
    return Math.min(Math.max(parsed / 100, 0), 1);
  }

  return Math.min(Math.max(parsed, 0), 1);
}

function collectNotes(record: RawPerfumeRecord): NoteGroups {
  const top = splitNotes(getRecordValue(record, fieldAliases.topNotes));
  const heart = splitNotes(getRecordValue(record, fieldAliases.heartNotes));
  const base = splitNotes(getRecordValue(record, fieldAliases.baseNotes));
  const generic = splitNotes(getRecordValue(record, fieldAliases.allNotes));

  if (top.length === 0 && heart.length === 0 && base.length === 0 && generic.length > 0) {
    return {
      top: dedupeNotes(generic.slice(0, 3)),
      heart: dedupeNotes(generic.slice(3, 6)),
      base: dedupeNotes(generic.slice(6, 9)),
    };
  }

  const nextTop = [...top];
  const nextHeart = [...heart];
  const nextBase = [...base];

  for (const note of generic) {
    const key = note.toLowerCase();
    const exists =
      nextTop.some((item) => item.toLowerCase() === key) ||
      nextHeart.some((item) => item.toLowerCase() === key) ||
      nextBase.some((item) => item.toLowerCase() === key);

    if (!exists) {
      nextHeart.push(note);
    }
  }

  return {
    top: dedupeNotes(nextTop),
    heart: dedupeNotes(nextHeart),
    base: dedupeNotes(nextBase),
  };
}

function collectUniqueNotes(notes: NoteGroups) {
  return dedupeNotes([...notes.top, ...notes.heart, ...notes.base]);
}

function composeShortDescription(params: {
  brandName: string;
  perfumeName: string;
  family: string;
  notes: string[];
}) {
  const sampleNotes = params.notes.slice(0, 3).join(", ");

  if (!sampleNotes) {
    return `${params.perfumeName} by ${params.brandName}, ${params.family.toLowerCase()} profile.`;
  }

  return `${params.perfumeName} by ${params.brandName}, ${params.family.toLowerCase()} profile with ${sampleNotes}.`;
}

function composeLongDescription(params: {
  brandName: string;
  perfumeName: string;
  family: string;
  top: string[];
  heart: string[];
  base: string[];
}) {
  const top = params.top.length > 0 ? params.top.join(", ") : "a bright opening";
  const heart = params.heart.length > 0 ? params.heart.join(", ") : "a balanced heart";
  const base = params.base.length > 0 ? params.base.join(", ") : "a lasting base";

  return `${params.perfumeName} by ${params.brandName} belongs to the ${params.family.toLowerCase()} family with top notes of ${top}, a heart of ${heart}, and a base of ${base}.`;
}

export function makePerfumeLookupKey(brandValue: string, perfumeName: string) {
  return `${slugify(brandValue)}::${cleanString(perfumeName).toLowerCase()}`;
}

export function normalizePerfumeRecord(params: {
  source: PerfumeDataSource;
  sourceRow: number;
  record: RawPerfumeRecord;
}): NormalizationResult {
  const issues: ValidationIssue[] = [];
  const brandName = cleanString(String(getRecordValue(params.record, fieldAliases.brand) ?? ""));
  const perfumeName = cleanString(String(getRecordValue(params.record, fieldAliases.perfumeName) ?? ""));
  const rawSlug = cleanString(String(getRecordValue(params.record, fieldAliases.perfumeSlug) ?? ""));
  const rawGender = cleanString(String(getRecordValue(params.record, fieldAliases.gender) ?? ""));
  const rawFamily = cleanString(String(getRecordValue(params.record, fieldAliases.family) ?? ""));

  if (!brandName) {
    issues.push(createIssue(params.sourceRow, "brand", "Brand is required."));
  }

  if (!perfumeName) {
    issues.push(createIssue(params.sourceRow, "name", "Perfume name is required."));
  }

  if (!rawSlug) {
    issues.push(createIssue(params.sourceRow, "slug", "Slug is required."));
  }

  if (!rawGender) {
    issues.push(createIssue(params.sourceRow, "gender", "Gender is required."));
  }

  if (!rawFamily) {
    issues.push(createIssue(params.sourceRow, "fragranceFamily", "Fragrance family is required."));
  }

  if (!brandName || !perfumeName) {
    return { issues };
  }

  const notes = collectNotes(params.record);
  const uniqueNotes = collectUniqueNotes(notes);
  const normalizedGender = normalizeGenderLabel(rawGender);
  const family = normalizeFragranceFamily(rawFamily, uniqueNotes);
  const concentration =
    normalizeConcentration(cleanString(String(getRecordValue(params.record, fieldAliases.concentration) ?? ""))) ??
    normalizeConcentration(perfumeName);
  const descriptionShort =
    cleanString(String(getRecordValue(params.record, fieldAliases.descriptionShort) ?? "")) ||
    composeShortDescription({
      brandName,
      perfumeName,
      family,
      notes: uniqueNotes,
    });
  const descriptionLong =
    cleanString(String(getRecordValue(params.record, fieldAliases.descriptionLong) ?? "")) ||
    composeLongDescription({
      brandName,
      perfumeName,
      family,
      top: notes.top,
      heart: notes.heart,
      base: notes.base,
    });
  const perfumeSlug = slugify(rawSlug || `${brandName}-${perfumeName}`);

  if (!perfumeSlug || perfumeSlug === "unknown") {
    issues.push(createIssue(params.sourceRow, "slug", "Slug could not be normalized."));
  }

  if (normalizedGender === "unknown") {
    issues.push(
      createIssue(
        params.sourceRow,
        "gender",
        "Gender must normalize to one of MEN, WOMEN, or UNISEX.",
      ),
    );
  }

  const longevityScore = normalizeTenPointScore(getRecordValue(params.record, fieldAliases.longevityScore));
  if (longevityScore.issue) {
    issues.push(createIssue(params.sourceRow, "longevityScore", longevityScore.issue));
  }

  const sillageScore = normalizeTenPointScore(getRecordValue(params.record, fieldAliases.sillageScore));
  if (sillageScore.issue) {
    issues.push(createIssue(params.sourceRow, "sillageScore", sillageScore.issue));
  }

  const versatilityScore = normalizeTenPointScore(getRecordValue(params.record, fieldAliases.versatilityScore));
  if (versatilityScore.issue) {
    issues.push(createIssue(params.sourceRow, "versatilityScore", versatilityScore.issue));
  }

  const imagePublicUrl = normalizeUrl(getRecordValue(params.record, fieldAliases.imagePublicUrl));
  const imageUrl = normalizeUrl(getRecordValue(params.record, fieldAliases.imageUrl)) ?? imagePublicUrl;

  const value: NormalizedPerfumeRecord = {
    source: params.source,
    sourceRow: params.sourceRow,
    brandName,
    brandSlug: slugify(brandName),
    perfumeName,
    perfumeSlug,
    gender: canonicalGenderToPrisma(normalizedGender),
    normalizedGender,
    concentration,
    releaseYear: normalizeYear(getRecordValue(params.record, fieldAliases.year)),
    descriptionShort,
    descriptionLong,
    fragranceFamily: family,
    priceRange: mapPriceRangeFromValue(cleanString(String(getRecordValue(params.record, fieldAliases.priceRange) ?? ""))),
    imageUrl,
    imageSourceUrl: normalizeUrl(getRecordValue(params.record, fieldAliases.imageSourceUrl)),
    imageStoragePath: normalizeStoragePath(getRecordValue(params.record, fieldAliases.imageStoragePath)),
    imagePublicUrl,
    ratingInternal: normalizeRating(getRecordValue(params.record, fieldAliases.rating)),
    longevityScore: longevityScore.value,
    sillageScore: sillageScore.value,
    versatilityScore: versatilityScore.value,
    isArabic: normalizeBoolean(getRecordValue(params.record, fieldAliases.isArabic), false),
    isNiche: normalizeBoolean(getRecordValue(params.record, fieldAliases.isNiche), false),
    catalogStatus: parseCatalogStatus(getRecordValue(params.record, fieldAliases.catalogStatus), params.source),
    sourceName:
      cleanString(String(getRecordValue(params.record, fieldAliases.sourceName) ?? "")) ||
      (params.source === "verified" ? "Verified catalog import" : "Parfumo-style dataset import"),
    sourceType: parseSourceType(getRecordValue(params.record, fieldAliases.sourceType), params.source),
    officialSourceUrl: normalizeUrl(getRecordValue(params.record, fieldAliases.officialSourceUrl)),
    sourceConfidence: parseSourceConfidence(
      getRecordValue(params.record, fieldAliases.sourceConfidence),
      params.source,
    ),
    dataQuality: parseDataQuality(getRecordValue(params.record, fieldAliases.dataQuality), params.source),
    enrichmentStatus: parseEnrichmentStatus(
      getRecordValue(params.record, fieldAliases.enrichmentStatus),
    ),
    notes,
  };

  return { value, issues };
}

export function toCatalogCsvRow(record: NormalizedPerfumeRecord): Record<string, string> {
  return {
    brand: record.brandName,
    name: record.perfumeName,
    slug: record.perfumeSlug,
    gender: record.gender,
    concentration: record.concentration ?? "",
    year: record.releaseYear ? String(record.releaseYear) : "",
    top_notes: record.notes.top.join(";"),
    heart_notes: record.notes.heart.join(";"),
    base_notes: record.notes.base.join(";"),
    family: record.fragranceFamily,
    rating: record.ratingInternal !== undefined ? String(record.ratingInternal) : "",
    longevity_score: record.longevityScore !== undefined ? String(record.longevityScore) : "",
    sillage_score: record.sillageScore !== undefined ? String(record.sillageScore) : "",
    versatility_score: record.versatilityScore !== undefined ? String(record.versatilityScore) : "",
    imageUrl: record.imageUrl ?? "",
    image_source_url: record.imageSourceUrl ?? "",
    image_storage_path: record.imageStoragePath ?? "",
    image_public_url: record.imagePublicUrl ?? "",
    description_short: record.descriptionShort,
    description_long: record.descriptionLong,
    price_range: record.priceRange,
    is_arabic: String(record.isArabic),
    is_niche: String(record.isNiche),
    catalog_status: record.catalogStatus,
    source_name: record.sourceName,
    source_type: record.sourceType,
    official_source_url: record.officialSourceUrl ?? "",
    source_confidence: String(record.sourceConfidence),
    data_quality: record.dataQuality,
  };
}

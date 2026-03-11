import { stat } from "node:fs/promises";
import path from "node:path";

import { loadPerfumeInput } from "@/lib/perfume-data/csv";
import { normalizeCsvHeader, toCatalogCsvRow } from "@/lib/perfume-data/normalize";
import { preparePerfumeRecords } from "@/lib/perfume-data/workflow";
import type {
  EnrichmentConflict,
  EnrichmentConfidenceLevel,
  EnrichmentRowReport,
  EnrichmentSourceAuditEntry,
  EnrichmentStatus,
  EnrichmentSummary,
  NormalizedPerfumeRecord,
  PerfumeDataSource,
} from "@/lib/perfume-data/types";

type TrustedSourceRecord = {
  provider: string;
  sourcePath: string;
  sourceLastCheckedAt: string;
  brand: string;
  name: string;
  parfumoUrl: string;
  imageUrl?: string;
  rating?: number;
  votes?: number;
  safeKey: string;
  variantKey: string;
};

type MatchResult =
  | {
      matched: true;
      confidenceScore: number;
      confidenceLevel: EnrichmentConfidenceLevel;
      source: TrustedSourceRecord;
      strategy: "exact" | "normalized";
    }
  | {
      matched: false;
      confidenceScore: number | null;
      confidenceLevel: EnrichmentConfidenceLevel;
      strategy: "variant" | "ambiguous" | "none";
      source?: TrustedSourceRecord;
      notes: string[];
    };

type EnrichmentOutputRow = Record<string, string>;

const parfumoTopListSources = [
  "data/import/parfumo-top-men.csv",
  "data/import/parfumo-top-women.csv",
  "data/import/parfumo-top-unisex.csv",
] as const;

const defaultProviderName = "Parfumo Top Lists";

export const enrichmentCatalogHeaders = [
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
  "matched_source",
  "matched_url",
  "matched_name",
  "matched_confidence",
  "enrichment_status",
  "enrichment_notes",
  "source_last_checked_at",
] as const;

const scoreNormalizationRules = {
  longevityScore: [
    "Numeric source values from 0-10 are kept as-is.",
    "Numeric source values from 0-5 are multiplied by 2.",
    "Non-numeric or unsupported categorical inputs are rejected and left empty.",
  ],
  sillageScore: [
    "Numeric source values from 0-10 are kept as-is.",
    "Numeric source values from 0-5 are multiplied by 2.",
    "Non-numeric or unsupported categorical inputs are rejected and left empty.",
  ],
  versatilityScore: [
    "Numeric source values from 0-10 are kept as-is.",
    "Numeric source values from 0-5 are multiplied by 2.",
    "Non-numeric or unsupported categorical inputs are rejected and left empty.",
  ],
} as const;

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9()]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizePerfumeNameForSafeMatch(value: string) {
  return normalizeText(value).replace(/\(\d{4}\)/g, " ").trim().replace(/\s+/g, " ");
}

function normalizePerfumeNameForVariantMatch(value: string) {
  return normalizePerfumeNameForSafeMatch(value)
    .replace(/\b(eau de parfum|eau de toilette|eau de cologne)\b/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function buildMatchKey(brand: string, name: string, mode: "safe" | "variant") {
  const normalizedBrand = normalizeText(brand);
  const normalizedName =
    mode === "safe"
      ? normalizePerfumeNameForSafeMatch(name)
      : normalizePerfumeNameForVariantMatch(name);
  return `${normalizedBrand}::${normalizedName}`;
}

function parseNumber(value: unknown) {
  const cleaned = String(value ?? "").trim().replace(",", ".");
  if (!cleaned) {
    return undefined;
  }

  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}

// Numeric-only score normalization avoids inventing semantics for unsupported qualitative labels.
export function normalizeExternalScoreToTenPointScale(value: unknown) {
  const parsed = parseNumber(value);
  if (parsed === undefined) {
    return undefined;
  }

  if (parsed < 0) {
    return undefined;
  }

  if (parsed <= 5) {
    return roundScore(parsed * 2);
  }

  if (parsed <= 10) {
    return roundScore(parsed);
  }

  return undefined;
}

async function loadParfumoTopListSourceRecords(sourcePath: string) {
  const loaded = await loadPerfumeInput({
    inputPath: sourcePath,
    format: "csv",
    normalizeHeader: normalizeCsvHeader,
  });
  const metadata = await stat(path.resolve(process.cwd(), sourcePath));
  const sourceLastCheckedAt = metadata.mtime.toISOString();

  const records: TrustedSourceRecord[] = loaded.records
    .map(({ record }) => {
      const brand = String(record.brand ?? "").trim();
      const name = String(record.name ?? "").trim();
      const parfumoUrl = String(record.parfumourl ?? "").trim();

      if (!brand || !name || !parfumoUrl) {
        return null;
      }

      return {
        provider: defaultProviderName,
        sourcePath,
        sourceLastCheckedAt,
        brand,
        name,
        parfumoUrl,
        imageUrl: String(record.imageurl ?? "").trim() || undefined,
        rating: normalizeExternalScoreToTenPointScale(record.rating),
        votes: parseNumber(record.votes),
        safeKey: buildMatchKey(brand, name, "safe"),
        variantKey: buildMatchKey(brand, name, "variant"),
      };
    })
    .filter((item): item is TrustedSourceRecord => item !== null);

  return {
    sourcePath,
    sourceLastCheckedAt,
    records,
  };
}

async function loadTrustedSourceRecords() {
  const loadedSources = await Promise.all(parfumoTopListSources.map((sourcePath) => loadParfumoTopListSourceRecords(sourcePath)));
  const safeIndex = new Map<string, TrustedSourceRecord[]>();
  const variantIndex = new Map<string, TrustedSourceRecord[]>();

  for (const loaded of loadedSources) {
    for (const record of loaded.records) {
      const safeRecords = safeIndex.get(record.safeKey) ?? [];
      safeRecords.push(record);
      safeIndex.set(record.safeKey, safeRecords);

      const variantRecords = variantIndex.get(record.variantKey) ?? [];
      variantRecords.push(record);
      variantIndex.set(record.variantKey, variantRecords);
    }
  }

  return {
    safeIndex,
    variantIndex,
  };
}

function selectUniqueCandidate(candidates: TrustedSourceRecord[]) {
  const uniqueByUrl = new Map<string, TrustedSourceRecord>();
  for (const candidate of candidates) {
    uniqueByUrl.set(candidate.parfumoUrl, candidate);
  }

  return uniqueByUrl.size === 1 ? [...uniqueByUrl.values()][0] : null;
}

function matchTrustedSourceRecord(
  record: NormalizedPerfumeRecord,
  indexes: Awaited<ReturnType<typeof loadTrustedSourceRecords>>,
): MatchResult {
  const safeKey = buildMatchKey(record.brandName, record.perfumeName, "safe");
  const safeCandidates = indexes.safeIndex.get(safeKey) ?? [];

  if (safeCandidates.length > 0) {
    const candidate = selectUniqueCandidate(safeCandidates);
    if (!candidate) {
      return {
        matched: false,
        confidenceScore: 0.6,
        confidenceLevel: "low",
        strategy: "ambiguous",
        notes: ["Multiple trusted source candidates share the same normalized match key."],
      };
    }

    return {
      matched: true,
      confidenceScore: candidate.brand === record.brandName && candidate.name === record.perfumeName ? 1 : 0.97,
      confidenceLevel: "high",
      source: candidate,
      strategy: candidate.brand === record.brandName && candidate.name === record.perfumeName ? "exact" : "normalized",
    };
  }

  const variantKey = buildMatchKey(record.brandName, record.perfumeName, "variant");
  const variantCandidates = indexes.variantIndex.get(variantKey) ?? [];

  if (variantCandidates.length > 0) {
    const candidate = selectUniqueCandidate(variantCandidates);
    if (!candidate) {
      return {
        matched: false,
        confidenceScore: 0.55,
        confidenceLevel: "low",
        strategy: "ambiguous",
        notes: ["Multiple source variants matched after concentration-stripping fallback."],
      };
    }

    return {
      matched: false,
      confidenceScore: 0.84,
      confidenceLevel: "low",
      strategy: "variant",
      source: candidate,
      notes: [
        "A variant-level match was found only after removing concentration qualifiers; no automatic enrichment was applied.",
      ],
    };
  }

  return {
    matched: false,
    confidenceScore: null,
    confidenceLevel: "none",
    strategy: "none",
    notes: ["No trusted in-repo enrichment source matched this perfume with high confidence."],
  };
}

function createEmptyEnrichmentRow(baseRow: Record<string, string>) {
  return {
    ...baseRow,
    matched_source: "",
    matched_url: "",
    matched_name: "",
    matched_confidence: "",
    enrichment_status: "",
    enrichment_notes: "",
    source_last_checked_at: "",
  };
}

function incrementFieldCount(fieldsEnrichedByType: Record<string, number>, field: string) {
  fieldsEnrichedByType[field] = (fieldsEnrichedByType[field] ?? 0) + 1;
}

function summarizeStatus(params: {
  matched: boolean;
  catalogFieldsEnriched: string[];
  provenanceFieldsEnriched: string[];
  match: MatchResult;
}): EnrichmentStatus {
  if (!params.matched) {
    if (params.match.strategy === "variant") {
      return "low_confidence";
    }

    if (params.match.strategy === "ambiguous") {
      return "ambiguous";
    }

    return "unmatched";
  }

  return params.catalogFieldsEnriched.length > 0 ? "matched_enriched" : "matched_provenance_only";
}

function appendUnique(values: string[], value: string) {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function buildAuditEntries(): EnrichmentSourceAuditEntry[] {
  return [
    {
      path: "scripts/enrich-perfumes.ts",
      classification: "REFACTOR",
      trusted: true,
      reason: "Canonical verified enrichment entrypoint now drives normalize -> validate -> match -> enrich -> export.",
    },
    {
      path: "scripts/verify-perfumes.ts",
      classification: "KEEP",
      trusted: true,
      reason: "Still the canonical validation-only entrypoint.",
    },
    {
      path: "scripts/import-perfumes.ts",
      classification: "KEEP",
      trusted: true,
      reason: "Canonical DB import entrypoint remains valid for the enriched CSV.",
    },
    {
      path: "lib/perfume-data/enrich.ts",
      classification: "KEEP",
      trusted: true,
      reason: "New trusted-source matching, enrichment, provenance, and reporting module.",
    },
    {
      path: "lib/perfume-data/workflow.ts",
      classification: "KEEP",
      trusted: true,
      reason: "Shared normalize and validate stage remains the base of the enrichment pipeline.",
    },
    {
      path: "lib/perfume-data/normalize.ts",
      classification: "KEEP",
      trusted: true,
      reason: "Canonical export row builder and normalization utilities remain authoritative.",
    },
    {
      path: "lib/perfume-data/validate.ts",
      classification: "KEEP",
      trusted: true,
      reason: "Canonical validation rules remain unchanged and are reused before enrichment.",
    },
    {
      path: "lib/perfume-data/import.ts",
      classification: "KEEP",
      trusted: true,
      reason: "Import path still accepts the enriched CSV because extra provenance columns are ignored safely.",
    },
    {
      path: "lib/perfume-data/types.ts",
      classification: "KEEP",
      trusted: true,
      reason: "Shared type definitions now include enrichment report metadata.",
    },
    {
      path: "data/import/parfumo-top-men.csv",
      classification: "KEEP",
      trusted: true,
      reason: "Trusted in-repo Parfumo snapshot used for deterministic verified enrichment matches.",
    },
    {
      path: "data/import/parfumo-top-women.csv",
      classification: "KEEP",
      trusted: true,
      reason: "Trusted in-repo Parfumo snapshot used for deterministic verified enrichment matches.",
    },
    {
      path: "data/import/parfumo-top-unisex.csv",
      classification: "KEEP",
      trusted: true,
      reason: "Trusted in-repo Parfumo snapshot used for deterministic verified enrichment matches.",
    },
    {
      path: "data/parfumo/perfumes.csv",
      classification: "ARCHIVE",
      trusted: false,
      reason: "Synthetic dataset; excluded from real-data enrichment.",
    },
    {
      path: "scripts/archive/import/import-parfumo.ts",
      classification: "ARCHIVE",
      trusted: false,
      reason: "Historical import path not used for trusted verified enrichment.",
    },
    {
      path: "scripts/archive/import/import-parfumo-tops.ts",
      classification: "ARCHIVE",
      trusted: false,
      reason: "Historical append workflow superseded by the shared enrichment module.",
    },
    {
      path: "scripts/archive/import/fetch-parfumo-tops.ts",
      classification: "ARCHIVE",
      trusted: false,
      reason: "Historical collection helper; not part of the maintained local enrichment pipeline.",
    },
    {
      path: "scripts/archive/import/backfill-catalog-provenance.ts",
      classification: "ARCHIVE",
      trusted: false,
      reason: "One-off DB backfill, not a reusable enrichment source integration.",
    },
  ];
}

export async function enrichVerifiedPerfumes(params: {
  inputPath: string;
  format: "auto" | "csv" | "json";
  source: PerfumeDataSource;
  limit?: number;
}) {
  const prepared = await preparePerfumeRecords({
    inputPath: params.inputPath,
    format: params.format,
    source: params.source,
    limit: params.limit,
  });

  const indexes = await loadTrustedSourceRecords();
  const rows: EnrichmentOutputRow[] = [];
  const reportRows: EnrichmentRowReport[] = [];
  const fieldsEnrichedByType: Record<string, number> = {};

  let totalMatched = 0;
  let lowConfidenceMatches = 0;
  let ambiguousMatches = 0;
  let rowsEnriched = 0;
  let rowsWithCatalogFieldChanges = 0;
  let rowsWithProvenanceOnlyChanges = 0;
  let conflicts = 0;

  for (const record of prepared.normalizedRecords) {
    const baseRow = createEmptyEnrichmentRow(toCatalogCsvRow(record));
    const match = matchTrustedSourceRecord(record, indexes);
    const fieldsEnriched: string[] = [];
    const fieldsSkipped: string[] = [];
    const conflictsDetected: EnrichmentConflict[] = [];
    const notes: string[] = [];
    const catalogFieldsEnriched: string[] = [];
    const provenanceFieldsEnriched: string[] = [];

    if (match.matched) {
      totalMatched += 1;
      baseRow.matched_source = match.source.provider;
      baseRow.matched_url = match.source.parfumoUrl;
      baseRow.matched_name = match.source.name;
      baseRow.matched_confidence = String(match.confidenceScore);
      baseRow.source_last_checked_at = match.source.sourceLastCheckedAt;
      provenanceFieldsEnriched.push(
        "matched_source",
        "matched_url",
        "matched_name",
        "matched_confidence",
        "source_last_checked_at",
      );

      if (!baseRow.image_source_url && match.source.imageUrl) {
        baseRow.image_source_url = match.source.imageUrl;
        catalogFieldsEnriched.push("image_source_url");
      } else if (!baseRow.image_source_url) {
        appendUnique(fieldsSkipped, "image_source_url");
      }

      if (!baseRow.source_name) {
        baseRow.source_name = match.source.provider;
        catalogFieldsEnriched.push("source_name");
      } else {
        appendUnique(fieldsSkipped, "source_name");
      }

      if (!baseRow.source_confidence) {
        baseRow.source_confidence = String(match.confidenceScore);
        catalogFieldsEnriched.push("source_confidence");
      } else {
        appendUnique(fieldsSkipped, "source_confidence");
      }

      notes.push(`Matched to ${match.source.provider} using ${match.strategy} brand/name matching.`);
      if (catalogFieldsEnriched.length === 0) {
        notes.push("Trusted source evidence only added provenance metadata; no import fields were safely updated.");
      }
      notes.push(
        "The local trusted source snapshot does not contain release year, note pyramid, family, descriptions, or auxiliary scores for these matches.",
      );
    } else {
      if (match.strategy === "variant") {
        lowConfidenceMatches += 1;
      }
      if (match.strategy === "ambiguous") {
        ambiguousMatches += 1;
      }

      if (match.source) {
        notes.push(...match.notes);
        notes.push(`Potential candidate: ${match.source.name} (${match.source.parfumoUrl}).`);
      } else {
        notes.push(...match.notes);
      }
    }

    const status = summarizeStatus({
      matched: match.matched,
      catalogFieldsEnriched,
      provenanceFieldsEnriched,
      match,
    });

    baseRow.enrichment_status = status;
    baseRow.enrichment_notes = notes.join(" ");

    fieldsEnriched.push(...catalogFieldsEnriched, ...provenanceFieldsEnriched);
    if (fieldsEnriched.length > 0) {
      rowsEnriched += 1;
      if (catalogFieldsEnriched.length > 0) {
        rowsWithCatalogFieldChanges += 1;
      }
      if (catalogFieldsEnriched.length === 0 && provenanceFieldsEnriched.length > 0) {
        rowsWithProvenanceOnlyChanges += 1;
      }
      for (const field of fieldsEnriched) {
        incrementFieldCount(fieldsEnrichedByType, field);
      }
    }

    conflicts += conflictsDetected.length;
    rows.push(baseRow);
    reportRows.push({
      rowIndex: record.sourceRow,
      brand: record.brandName,
      name: record.perfumeName,
      slug: record.perfumeSlug,
      matched: match.matched,
      matchedSource: match.matched ? match.source.provider : null,
      matchedUrl: match.matched ? match.source.parfumoUrl : match.source?.parfumoUrl ?? null,
      matchedName: match.matched ? match.source.name : match.source?.name ?? null,
      confidenceScore: match.confidenceScore,
      confidenceLevel: match.confidenceLevel,
      enrichmentStatus: status,
      fieldsEnriched,
      fieldsSkipped,
      conflictsDetected,
      notes,
    });
  }

  const summary: EnrichmentSummary = {
    totalRowsProcessed: prepared.normalizedRecords.length,
    totalMatched,
    totalUnmatched: prepared.normalizedRecords.length - totalMatched,
    lowConfidenceMatches,
    ambiguousMatches,
    rowsEnriched,
    rowsUnchanged: prepared.normalizedRecords.length - rowsEnriched,
    rowsWithCatalogFieldChanges,
    rowsWithProvenanceOnlyChanges,
    conflicts,
    fieldsEnrichedByType,
  };

  return {
    prepared,
    rows,
    report: {
      summary,
      scoreNormalizationRules,
      sourceAudit: buildAuditEntries(),
      rows: reportRows,
    },
  };
}

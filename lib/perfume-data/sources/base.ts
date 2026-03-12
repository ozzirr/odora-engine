import type {
  EnrichmentCandidate,
  EnrichmentConfidenceLevel,
  EnrichmentTargetField,
  EnrichmentSourceAuditEntry,
  NormalizedPerfumeRecord,
} from "@/lib/perfume-data/types";

export type SourceRecordFieldValue = {
  field: EnrichmentTargetField;
  value: number | string | string[];
  sourceField: string;
  sourceUrl: string;
  confidence: number;
  lastCheckedAt: string;
  notes?: string[];
};

export type SourceRecordResult = {
  sourceId: string;
  sourceName: string;
  matchedName: string;
  matchedUrl: string;
  supportedFields: EnrichmentTargetField[];
  unsupportedFields: EnrichmentTargetField[];
  fields: Partial<Record<EnrichmentTargetField, SourceRecordFieldValue>>;
  notes: string[];
};

export interface PerfumeSourceAdapter {
  id: string;
  label: string;
  trusted: boolean;
  implemented: boolean;
  supportedFields: EnrichmentTargetField[];
  plannedFields: EnrichmentTargetField[];
  searchCandidates(record: NormalizedPerfumeRecord): Promise<EnrichmentCandidate[]>;
  fetchSourceRecord(candidate: EnrichmentCandidate): Promise<SourceRecordResult | null>;
  getAuditEntries(): EnrichmentSourceAuditEntry[];
}

export function normalizeText(value: string) {
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

export function normalizePerfumeNameForSafeMatch(value: string) {
  return normalizeText(value).replace(/\(\d{4}\)/g, " ").trim().replace(/\s+/g, " ");
}

export function normalizePerfumeNameForVariantMatch(value: string) {
  return normalizePerfumeNameForSafeMatch(value)
    .replace(/\b(eau de parfum|eau de toilette|eau de cologne)\b/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function buildMatchKey(brand: string, name: string, mode: "safe" | "variant") {
  const normalizedBrand = normalizeText(brand);
  const normalizedName =
    mode === "safe"
      ? normalizePerfumeNameForSafeMatch(name)
      : normalizePerfumeNameForVariantMatch(name);
  return `${normalizedBrand}::${normalizedName}`;
}

export function createCandidate(params: {
  source: string;
  sourceId: string;
  name: string;
  url: string;
  confidenceScore: number;
  confidenceLevel: EnrichmentConfidenceLevel;
  matchReason: string;
}): EnrichmentCandidate {
  return {
    source: params.source,
    sourceId: params.sourceId,
    name: params.name,
    url: params.url,
    confidenceScore: params.confidenceScore,
    confidenceLevel: params.confidenceLevel,
    matchReason: params.matchReason,
  };
}

import { CatalogStatus, DataQuality, Gender, NoteType, PriceRange, SourceType } from "@prisma/client";

import type { CanonicalConcentration, CanonicalFragranceFamily, CanonicalGender } from "@/lib/perfume-taxonomy";

export type PerfumeDataSource = "verified" | "parfumo";

export type RawPerfumeRecord = Record<string, unknown>;

export type NoteGroups = {
  top: string[];
  heart: string[];
  base: string[];
};

export type NormalizedPerfumeRecord = {
  source: PerfumeDataSource;
  sourceRow: number;
  brandName: string;
  brandSlug: string;
  perfumeName: string;
  perfumeSlug: string;
  gender: Gender;
  normalizedGender: CanonicalGender;
  concentration?: CanonicalConcentration;
  releaseYear?: number;
  descriptionShort: string;
  descriptionLong: string;
  fragranceFamily: CanonicalFragranceFamily;
  priceRange: PriceRange;
  imageUrl?: string;
  imageSourceUrl?: string;
  imageStoragePath?: string;
  imagePublicUrl?: string;
  ratingInternal?: number;
  longevityScore?: number;
  sillageScore?: number;
  versatilityScore?: number;
  isArabic: boolean;
  isNiche: boolean;
  catalogStatus: CatalogStatus;
  sourceName: string;
  sourceType: SourceType;
  officialSourceUrl?: string;
  sourceConfidence: number;
  dataQuality: DataQuality;
  notes: NoteGroups;
};

export type ValidationIssue = {
  level: "error" | "warning";
  field: string;
  message: string;
  sourceRow: number;
};

export type ValidationReportEntry = {
  rowIndex: number;
  field: string;
  message: string;
  severity: ValidationIssue["level"];
};

export type NormalizationResult = {
  value?: NormalizedPerfumeRecord;
  issues: ValidationIssue[];
};

export type LoadedInputRecord = {
  sourceRow: number;
  record: RawPerfumeRecord;
};

export type LoadedPerfumeInput = {
  format: "csv" | "json";
  malformedRows: string[];
  records: LoadedInputRecord[];
};

export type VerificationSummary = {
  rowsRead: number;
  validRows: number;
  invalidRows: number;
  malformedRows: number;
  warnings: number;
  errors: number;
  duplicateSlugs: number;
  missingFields: number;
};

export type EnrichmentStatus =
  | "matched_enriched"
  | "matched_provenance_only"
  | "low_confidence"
  | "ambiguous"
  | "unmatched";

export type EnrichmentConfidenceLevel = "high" | "low" | "none";

export type EnrichmentConflict = {
  field: string;
  currentValue: string;
  sourceValue: string;
  message: string;
};

export type EnrichmentRowReport = {
  rowIndex: number;
  brand: string;
  name: string;
  slug: string;
  matched: boolean;
  matchedSource: string | null;
  matchedUrl: string | null;
  matchedName: string | null;
  confidenceScore: number | null;
  confidenceLevel: EnrichmentConfidenceLevel;
  enrichmentStatus: EnrichmentStatus;
  fieldsEnriched: string[];
  fieldsSkipped: string[];
  conflictsDetected: EnrichmentConflict[];
  notes: string[];
};

export type EnrichmentSummary = {
  totalRowsProcessed: number;
  totalMatched: number;
  totalUnmatched: number;
  lowConfidenceMatches: number;
  ambiguousMatches: number;
  rowsEnriched: number;
  rowsUnchanged: number;
  rowsWithCatalogFieldChanges: number;
  rowsWithProvenanceOnlyChanges: number;
  conflicts: number;
  fieldsEnrichedByType: Record<string, number>;
};

export type EnrichmentSourceAuditEntry = {
  path: string;
  classification: "KEEP" | "REFACTOR" | "ARCHIVE";
  trusted: boolean;
  reason: string;
};

export type ImportMode = "upsert" | "notes";

export type ImportStats = {
  rowsRead: number;
  validRows: number;
  processedRows: number;
  malformedRows: number;
  invalidRows: number;
  skippedRows: number;
  insertedBrands: number;
  insertedPerfumes: number;
  updatedPerfumes: number;
  insertedNotes: number;
  insertedPerfumeNotes: number;
  matchedPerfumesBySlug: number;
  matchedPerfumesByNameFallback: number;
  missingPerfumeMatches: number;
};

export type CachedBrand = {
  id: number;
  name: string;
};

export type CachedNote = {
  id: number;
  slug: string;
  noteType: NoteType;
  name: string;
};

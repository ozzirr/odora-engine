import { canonicalCatalogHeaders, toCatalogCsvRow } from "@/lib/perfume-data/normalize";
import { ARCHIVED_SYNTHETIC_PARFUMO_PATH } from "@/lib/perfume-data/paths";
import { fieldPolicyByField } from "@/lib/perfume-data/enrichment-policy";
import { createOfficialBrandAdapter } from "@/lib/perfume-data/sources/official-brand";
import { createParfumoTopListAdapter } from "@/lib/perfume-data/sources/parfumo";
import { createFragranticaAdapter } from "@/lib/perfume-data/sources/fragrantica";
import type { PerfumeSourceAdapter, SourceRecordFieldValue, SourceRecordResult } from "@/lib/perfume-data/sources/base";
import type {
  EnrichmentCandidate,
  EnrichmentConflict,
  EnrichmentRowReport,
  EnrichmentSourceAuditEntry,
  EnrichmentStatus,
  EnrichmentSummary,
  enrichmentTargetFields,
  EnrichmentTargetField,
  FieldOverwriteDecision,
  FieldProvenanceEntry,
  NormalizedPerfumeRecord,
  PerfumeDataSource,
  ReviewQueueItem,
} from "@/lib/perfume-data/types";
import { preparePerfumeRecords } from "@/lib/perfume-data/workflow";

type EnrichmentOutputRow = Record<string, string>;

type AdapterCoverageEntry = {
  id: string;
  label: string;
  trusted: boolean;
  implemented: boolean;
  supportedFields: EnrichmentTargetField[];
  plannedFields: EnrichmentTargetField[];
};

type CandidateClassification =
  | {
      status: "matched";
      acceptedCandidates: EnrichmentCandidate[];
      candidates: EnrichmentCandidate[];
    }
  | {
      status: "low_confidence" | "ambiguous" | "unmatched";
      acceptedCandidates: EnrichmentCandidate[];
      candidates: EnrichmentCandidate[];
      notes: string[];
    };

export const enrichmentCatalogHeaders = [
  ...canonicalCatalogHeaders,
  "matched_source",
  "matched_url",
  "matched_name",
  "matched_confidence",
  "enrichment_status",
  "enrichment_notes",
  "source_last_checked_at",
] as const;

export const reviewQueueCsvHeaders = [
  "row_index",
  "brand",
  "name",
  "slug",
  "issue_type",
  "candidate_matches",
  "recommended_next_action",
  "notes",
] as const;

export const scoreNormalizationRules = {
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

const targetFields = [
  "releaseYear",
  "topNotes",
  "middleNotes",
  "baseNotes",
  "fragranceFamily",
  "descriptionShort",
  "descriptionLong",
  "longevityScore",
  "sillageScore",
  "versatilityScore",
  "officialSourceUrl",
  "imageSourceUrl",
] as const satisfies readonly EnrichmentTargetField[];

function createAdapters() {
  return [
    createParfumoTopListAdapter(),
    createFragranticaAdapter(),
    createOfficialBrandAdapter(),
  ] satisfies PerfumeSourceAdapter[];
}

function buildAdapterCoverage(adapters: PerfumeSourceAdapter[]): AdapterCoverageEntry[] {
  return adapters.map((adapter) => ({
    id: adapter.id,
    label: adapter.label,
    trusted: adapter.trusted,
    implemented: adapter.implemented,
    supportedFields: [...adapter.supportedFields],
    plannedFields: [...adapter.plannedFields],
  }));
}

function buildAuditEntries(adapters: PerfumeSourceAdapter[]): EnrichmentSourceAuditEntry[] {
  const entries: EnrichmentSourceAuditEntry[] = [
    {
      path: "scripts/enrich-perfumes.ts",
      classification: "REFACTOR",
      trusted: true,
      reason: "Canonical verified enrichment entrypoint now delegates to adapters, field policy, provenance, and review queue generation.",
    },
    {
      path: "lib/perfume-data/enrich.ts",
      classification: "KEEP",
      trusted: true,
      reason: "Canonical enrichment orchestrator applying adapter search results, field policy, provenance, and review queue output.",
    },
    {
      path: "lib/perfume-data/enrichment-policy.ts",
      classification: "KEEP",
      trusted: true,
      reason: "Canonical field map, source priority, overwrite rules, and conflict policy.",
    },
    {
      path: "lib/perfume-data/sources/base.ts",
      classification: "KEEP",
      trusted: true,
      reason: "Shared adapter contract and reusable matching primitives.",
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
      reason: "Canonical row normalization and CSV export mapping remain authoritative.",
    },
    {
      path: "lib/perfume-data/validate.ts",
      classification: "KEEP",
      trusted: true,
      reason: "Canonical validation rules are reused before enrichment and after export verification.",
    },
    {
      path: "lib/perfume-data/import.ts",
      classification: "KEEP",
      trusted: true,
      reason: "DB import still accepts enriched CSVs because extra provenance columns are safely ignored.",
    },
    {
      path: "lib/perfume-data/types.ts",
      classification: "KEEP",
      trusted: true,
      reason: "Shared types now model adapter coverage, field-level provenance, and review queue items.",
    },
    {
      path: "scripts/verify-perfumes.ts",
      classification: "KEEP",
      trusted: true,
      reason: "Canonical validation entrypoint remains unchanged.",
    },
    {
      path: "scripts/import-perfumes.ts",
      classification: "KEEP",
      trusted: true,
      reason: "Canonical DB import entrypoint remains the downstream consumer for verified catalog exports.",
    },
    {
      path: ARCHIVED_SYNTHETIC_PARFUMO_PATH,
      classification: "ARCHIVE",
      trusted: false,
      reason: "Synthetic dataset; excluded from trusted enrichment and left documented as untrusted.",
    },
  ];

  for (const adapter of adapters) {
    entries.push(...adapter.getAuditEntries());
  }

  return entries;
}

function createOutputRow(baseRow: Record<string, string>): EnrichmentOutputRow {
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

function targetFieldToRowKey(field: EnrichmentTargetField) {
  switch (field) {
    case "releaseYear":
      return "year";
    case "topNotes":
      return "top_notes";
    case "middleNotes":
      return "heart_notes";
    case "baseNotes":
      return "base_notes";
    case "fragranceFamily":
      return "family";
    case "descriptionShort":
      return "description_short";
    case "descriptionLong":
      return "description_long";
    case "longevityScore":
      return "longevity_score";
    case "sillageScore":
      return "sillage_score";
    case "versatilityScore":
      return "versatility_score";
    case "officialSourceUrl":
      return "official_source_url";
    case "imageSourceUrl":
      return "image_source_url";
  }
}

function isBlankValue(value: string | undefined) {
  return !String(value ?? "").trim();
}

function isGeneratedDescriptionShort(value: string) {
  return /\sby\s.+,\s.+profile(?: with .+)?\.$/i.test(value);
}

function isGeneratedDescriptionLong(value: string) {
  return /\sby\s.+ opens with .+ then moves through .+ and settles on .+\.$/i.test(value);
}

function isValidUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function isInvalidCurrentValue(field: EnrichmentTargetField, row: EnrichmentOutputRow) {
  const value = row[targetFieldToRowKey(field)] ?? "";
  if (isBlankValue(value)) {
    return true;
  }

  switch (field) {
    case "releaseYear": {
      const parsed = Number.parseInt(value, 10);
      const maxYear = new Date().getFullYear() + 1;
      return !Number.isFinite(parsed) || parsed < 1800 || parsed > maxYear;
    }
    case "topNotes":
    case "middleNotes":
    case "baseNotes":
      return value.split(";").map((item) => item.trim()).filter(Boolean).length === 0;
    case "descriptionShort":
      return isGeneratedDescriptionShort(value);
    case "descriptionLong":
      return isGeneratedDescriptionLong(value);
    case "longevityScore":
    case "sillageScore":
    case "versatilityScore": {
      const parsed = Number.parseFloat(value);
      return !Number.isFinite(parsed) || parsed < 0 || parsed > 10;
    }
    case "officialSourceUrl":
    case "imageSourceUrl":
      return !isValidUrl(value);
    default:
      return false;
  }
}

function sourceFieldValueToRowValue(fieldValue: SourceRecordFieldValue) {
  if (Array.isArray(fieldValue.value)) {
    return fieldValue.value.join(";");
  }

  return String(fieldValue.value);
}

function createFieldProvenance(
  field: EnrichmentTargetField,
  decision: FieldOverwriteDecision,
  params?: {
    source?: string | null;
    sourceUrl?: string | null;
    sourceField?: string | null;
    confidence?: number | null;
    lastCheckedAt?: string | null;
    notes?: string[];
  },
): FieldProvenanceEntry {
  return {
    field,
    source: params?.source ?? null,
    sourceUrl: params?.sourceUrl ?? null,
    sourceField: params?.sourceField ?? null,
    confidence: params?.confidence ?? null,
    lastCheckedAt: params?.lastCheckedAt ?? null,
    overwriteDecision: decision,
    notes: params?.notes ?? [],
  };
}

function compareRowAndSourceValue(field: EnrichmentTargetField, currentValue: string, sourceValue: string) {
  if (field === "topNotes" || field === "middleNotes" || field === "baseNotes") {
    const normalize = (value: string) =>
      value
        .split(";")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
        .sort()
        .join(";");
    return normalize(currentValue) === normalize(sourceValue);
  }

  return currentValue.trim().toLowerCase() === sourceValue.trim().toLowerCase();
}

async function fetchAcceptedSourceRecords(params: {
  acceptedCandidates: EnrichmentCandidate[];
  adaptersById: Map<string, PerfumeSourceAdapter>;
}) {
  const sourceRecords = new Map<string, SourceRecordResult>();

  for (const candidate of params.acceptedCandidates) {
    const adapter = params.adaptersById.get(candidate.sourceId);
    if (!adapter) {
      continue;
    }

    const record = await adapter.fetchSourceRecord(candidate);
    if (record) {
      sourceRecords.set(candidate.sourceId, record);
    }
  }

  return sourceRecords;
}

function classifyCandidates(candidates: EnrichmentCandidate[]): CandidateClassification {
  const sorted = [...candidates].sort((left, right) => right.confidenceScore - left.confidenceScore);
  const highCandidates = sorted.filter((candidate) => candidate.confidenceLevel === "high");

  if (highCandidates.length > 0) {
    return {
      status: "matched",
      acceptedCandidates: highCandidates,
      candidates: sorted,
    };
  }

  const lowCandidates = sorted.filter((candidate) => candidate.confidenceLevel === "low");
  if (lowCandidates.length === 1) {
    return {
      status: "low_confidence",
      acceptedCandidates: [],
      candidates: sorted,
      notes: [lowCandidates[0].matchReason],
    };
  }

  if (lowCandidates.length > 1) {
    return {
      status: "ambiguous",
      acceptedCandidates: [],
      candidates: sorted,
      notes: ["Multiple low-confidence candidates require manual disambiguation."],
    };
  }

  return {
    status: "unmatched",
    acceptedCandidates: [],
    candidates: [],
    notes: ["No trusted adapter returned a usable source candidate for this perfume."],
  };
}

function summarizeStatus(params: {
  candidateStatus: CandidateClassification["status"];
  matched: boolean;
  catalogFieldsEnriched: string[];
}) {
  if (!params.matched) {
    if (params.candidateStatus === "low_confidence") {
      return "low_confidence" as const;
    }
    if (params.candidateStatus === "ambiguous") {
      return "ambiguous" as const;
    }
    return "unmatched" as const;
  }

  return params.catalogFieldsEnriched.length > 0 ? "matched_enriched" : "matched_provenance_only";
}

function incrementFieldCount(fieldsEnrichedByType: Record<string, number>, field: string) {
  fieldsEnrichedByType[field] = (fieldsEnrichedByType[field] ?? 0) + 1;
}

function recommendedNextAction(status: EnrichmentStatus) {
  switch (status) {
    case "low_confidence":
      return "Review the suggested candidate and approve or reject the match before any catalog fields are applied.";
    case "ambiguous":
      return "Choose the correct trusted source candidate manually or tighten the matching rules.";
    case "unmatched":
      return "Find a trusted source manually or add a new adapter that can search this perfume safely.";
    default:
      return "Review conflicting field values manually before applying any overwrite.";
  }
}

function buildReviewQueue(rows: EnrichmentRowReport[]) {
  const items: ReviewQueueItem[] = [];

  for (const row of rows) {
    if (
      row.enrichmentStatus !== "low_confidence" &&
      row.enrichmentStatus !== "ambiguous" &&
      row.enrichmentStatus !== "unmatched" &&
      row.conflictsDetected.length === 0
    ) {
      continue;
    }

    const issueType =
      row.conflictsDetected.length > 0
        ? "conflict"
        : row.enrichmentStatus === "ambiguous"
          ? "ambiguous"
          : row.enrichmentStatus === "low_confidence"
            ? "low_confidence"
            : "unmatched";

    items.push({
      rowIndex: row.rowIndex,
      brand: row.brand,
      name: row.name,
      slug: row.slug,
      issueType,
      candidateMatches: row.candidateMatches,
      recommendedNextAction: recommendedNextAction(row.enrichmentStatus),
      notes: row.notes,
    });
  }

  return items;
}

function reviewQueueItemToCsvRow(item: ReviewQueueItem) {
  return {
    row_index: String(item.rowIndex),
    brand: item.brand,
    name: item.name,
    slug: item.slug,
    issue_type: item.issueType,
    candidate_matches: item.candidateMatches
      .map((candidate) => `${candidate.source}:${candidate.name}:${candidate.url}:${candidate.confidenceScore}`)
      .join(" | "),
    recommended_next_action: item.recommendedNextAction,
    notes: item.notes.join(" "),
  };
}

function buildRowReport(params: {
  record: NormalizedPerfumeRecord;
  candidateMatches: EnrichmentCandidate[];
  candidateStatus: CandidateClassification["status"];
  matched: boolean;
  matchedSourceRecord?: SourceRecordResult;
  matchedCandidate?: EnrichmentCandidate;
  fieldsEnriched: string[];
  fieldsSkipped: string[];
  conflictsDetected: EnrichmentConflict[];
  fieldProvenance: Record<EnrichmentTargetField, FieldProvenanceEntry>;
  notes: string[];
  status: EnrichmentStatus;
}): EnrichmentRowReport {
  return {
    rowIndex: params.record.sourceRow,
    brand: params.record.brandName,
    name: params.record.perfumeName,
    slug: params.record.perfumeSlug,
    matched: params.matched,
    matchedSource: params.matchedSourceRecord?.sourceName ?? null,
    matchedUrl: params.matchedSourceRecord?.matchedUrl ?? params.matchedCandidate?.url ?? null,
    matchedName: params.matchedSourceRecord?.matchedName ?? params.matchedCandidate?.name ?? null,
    confidenceScore: params.matchedCandidate?.confidenceScore ?? params.candidateMatches[0]?.confidenceScore ?? null,
    confidenceLevel: params.matched ? "high" : params.candidateMatches[0]?.confidenceLevel ?? "none",
    enrichmentStatus: params.status,
    candidateMatches: params.candidateMatches,
    fieldsEnriched: params.fieldsEnriched,
    fieldsSkipped: params.fieldsSkipped,
    conflictsDetected: params.conflictsDetected,
    fieldProvenance: params.fieldProvenance,
    notes: params.notes,
  };
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

  const adapters = createAdapters();
  const adaptersById = new Map(adapters.map((adapter) => [adapter.id, adapter]));
  const adapterCoverage = buildAdapterCoverage(adapters);
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
    const outputRow = createOutputRow(toCatalogCsvRow(record));
    const candidateLists = await Promise.all(adapters.map((adapter) => adapter.searchCandidates(record)));
    const candidateMatches = candidateLists.flat().sort((left, right) => right.confidenceScore - left.confidenceScore);
    const candidateClassification = classifyCandidates(candidateMatches);
    const acceptedSourceRecords = await fetchAcceptedSourceRecords({
      acceptedCandidates: candidateClassification.acceptedCandidates,
      adaptersById,
    });

    const fieldsEnriched: string[] = [];
    const fieldsSkipped: string[] = [];
    const conflictsDetected: EnrichmentConflict[] = [];
    const notes = [...("notes" in candidateClassification ? candidateClassification.notes : [])];
    const fieldProvenance = Object.fromEntries(
      targetFields.map((field) => [
        field,
        createFieldProvenance(
          field,
          candidateClassification.status === "unmatched"
            ? "no_source_match"
            : candidateClassification.status === "low_confidence" || candidateClassification.status === "ambiguous"
              ? "low_confidence_match"
              : "source_value_missing",
        ),
      ]),
    ) as Record<EnrichmentTargetField, FieldProvenanceEntry>;

    const catalogFieldsEnriched: string[] = [];
    const provenanceFieldsEnriched: string[] = [];

    for (const field of targetFields) {
      const policy = fieldPolicyByField[field];
      const rowKey = targetFieldToRowKey(field);
      const acceptedProviderRecord = policy.trustedSourcePriority
        .map((sourceId) => acceptedSourceRecords.get(sourceId))
        .find((item): item is SourceRecordResult => item !== undefined);

      if (!acceptedProviderRecord) {
        const missingAdapters = policy.trustedSourcePriority
          .map((sourceId) => adaptersById.get(sourceId))
          .filter((adapter): adapter is PerfumeSourceAdapter => Boolean(adapter))
          .filter((adapter) => !adapter.implemented)
          .map((adapter) => adapter.label);

        if (missingAdapters.length > 0) {
          fieldProvenance[field] = createFieldProvenance(field, "not_implemented", {
            notes: [
              `Awaiting implementation for trusted adapter(s): ${missingAdapters.join(", ")}.`,
            ],
          });
          continue;
        }

        continue;
      }

      const sourceField = acceptedProviderRecord.fields[field];
      if (!sourceField) {
        fieldProvenance[field] = createFieldProvenance(
          field,
          acceptedProviderRecord.unsupportedFields.includes(field) ? "unsupported_by_adapter" : "source_value_missing",
          {
            source: acceptedProviderRecord.sourceName,
            sourceUrl: acceptedProviderRecord.matchedUrl,
            confidence: candidateClassification.acceptedCandidates[0]?.confidenceScore ?? null,
            lastCheckedAt: acceptedProviderRecord.fields.imageSourceUrl?.lastCheckedAt ?? null,
            notes: acceptedProviderRecord.notes,
          },
        );
        continue;
      }

      const currentValue = outputRow[rowKey] ?? "";
      const sourceValue = sourceFieldValueToRowValue(sourceField);
      const currentValueMissing = isBlankValue(currentValue);
      const currentValueInvalid = isInvalidCurrentValue(field, outputRow);

      if (currentValueMissing || currentValueInvalid) {
        outputRow[rowKey] = sourceValue;
        fieldsEnriched.push(field);
        catalogFieldsEnriched.push(field);
        fieldProvenance[field] = createFieldProvenance(
          field,
          currentValueMissing ? "applied" : "replaced_invalid_value",
          {
            source: acceptedProviderRecord.sourceName,
            sourceUrl: sourceField.sourceUrl,
            sourceField: sourceField.sourceField,
            confidence: sourceField.confidence,
            lastCheckedAt: sourceField.lastCheckedAt,
            notes: sourceField.notes,
          },
        );
        continue;
      }

      if (compareRowAndSourceValue(field, currentValue, sourceValue)) {
        fieldsSkipped.push(field);
        fieldProvenance[field] = createFieldProvenance(field, "preserved_curated_value", {
          source: acceptedProviderRecord.sourceName,
          sourceUrl: sourceField.sourceUrl,
          sourceField: sourceField.sourceField,
          confidence: sourceField.confidence,
          lastCheckedAt: sourceField.lastCheckedAt,
          notes: ["Existing verified value already matches the trusted source."],
        });
        continue;
      }

      conflictsDetected.push({
        field,
        currentValue,
        sourceValue,
        message: "Trusted source value differs from the existing verified value and was not auto-applied.",
      });
      fieldsSkipped.push(field);
      fieldProvenance[field] = createFieldProvenance(field, "conflict_logged", {
        source: acceptedProviderRecord.sourceName,
        sourceUrl: sourceField.sourceUrl,
        sourceField: sourceField.sourceField,
        confidence: sourceField.confidence,
        lastCheckedAt: sourceField.lastCheckedAt,
        notes: ["Existing verified value was preserved and the conflict was logged for manual review."],
      });
    }

    const matchedCandidate = candidateClassification.acceptedCandidates[0];
    const matchedSourceRecord = matchedCandidate
      ? acceptedSourceRecords.get(matchedCandidate.sourceId)
      : undefined;

    if (matchedCandidate && matchedSourceRecord) {
      totalMatched += 1;
      outputRow.matched_source = matchedSourceRecord.sourceName;
      outputRow.matched_url = matchedSourceRecord.matchedUrl;
      outputRow.matched_name = matchedSourceRecord.matchedName;
      outputRow.matched_confidence = String(matchedCandidate.confidenceScore);
      outputRow.source_last_checked_at =
        Object.values(matchedSourceRecord.fields)[0]?.lastCheckedAt ?? "";
      provenanceFieldsEnriched.push(
        "matched_source",
        "matched_url",
        "matched_name",
        "matched_confidence",
        "source_last_checked_at",
      );
      notes.push(`Accepted trusted ${matchedSourceRecord.sourceName} candidate: ${matchedSourceRecord.matchedName}.`);
    } else if (candidateClassification.status === "low_confidence") {
      lowConfidenceMatches += 1;
    } else if (candidateClassification.status === "ambiguous") {
      ambiguousMatches += 1;
    }

    const status = summarizeStatus({
      candidateStatus: candidateClassification.status,
      matched: Boolean(matchedCandidate && matchedSourceRecord),
      catalogFieldsEnriched,
    });

    outputRow.enrichment_status = status;
    outputRow.enrichment_notes = notes.join(" ");

    if (catalogFieldsEnriched.length > 0 || provenanceFieldsEnriched.length > 0) {
      rowsEnriched += 1;
      if (catalogFieldsEnriched.length > 0) {
        rowsWithCatalogFieldChanges += 1;
      }
      if (catalogFieldsEnriched.length === 0 && provenanceFieldsEnriched.length > 0) {
        rowsWithProvenanceOnlyChanges += 1;
      }
      for (const field of [...catalogFieldsEnriched, ...provenanceFieldsEnriched]) {
        incrementFieldCount(fieldsEnrichedByType, field);
      }
    }

    conflicts += conflictsDetected.length;
    rows.push(outputRow);
    reportRows.push(
      buildRowReport({
        record,
        candidateMatches,
        candidateStatus: candidateClassification.status,
        matched: Boolean(matchedCandidate && matchedSourceRecord),
        matchedSourceRecord,
        matchedCandidate,
        fieldsEnriched: [...catalogFieldsEnriched, ...provenanceFieldsEnriched],
        fieldsSkipped,
        conflictsDetected,
        fieldProvenance,
        notes,
        status,
      }),
    );
  }

  const reviewQueue = buildReviewQueue(reportRows);

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
    reviewQueue,
    reviewQueueCsvRows: reviewQueue.map((item) => reviewQueueItemToCsvRow(item)),
    report: {
      summary,
      adapterCoverage,
      fieldPolicy: fieldPolicyByField,
      scoreNormalizationRules,
      sourceAudit: buildAuditEntries(adapters),
      rows: reportRows,
    },
  };
}

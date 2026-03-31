import { CatalogStatus } from "@prisma/client";

import { loadPerfumeInput } from "@/lib/perfume-data/csv";
import { normalizeCsvHeader, normalizePerfumeRecord } from "@/lib/perfume-data/normalize";
import { validatePerfumeRecord } from "@/lib/perfume-data/validate";
import type {
  NormalizedPerfumeRecord,
  PerfumeDataSource,
  ValidationIssue,
  ValidationReportEntry,
  VerificationSummary,
} from "@/lib/perfume-data/types";

const requiredFieldNames = new Set(["brand", "name", "slug", "gender", "fragranceFamily"]);
const acceptedVerifiedCatalogStatuses = new Set<CatalogStatus>([
  CatalogStatus.VERIFIED,
  CatalogStatus.IMPORTED_UNVERIFIED,
]);

function hasNormalizedNotes(record: NormalizedPerfumeRecord) {
  return record.notes.top.length > 0 || record.notes.heart.length > 0 || record.notes.base.length > 0;
}

function hasGeneratedDescriptionShort(value: string) {
  return /\sby\s.+,\s.+profile(?: with .+)?\.$/i.test(value);
}

function hasGeneratedDescriptionLong(value: string) {
  return /\sby\s.+ opens with .+ then moves through .+ and settles on .+\.$/i.test(value);
}

function getVerifiedDowngradeReasons(record: NormalizedPerfumeRecord) {
  const reasons: string[] = [];

  if (
    record.enrichmentStatus === "low_confidence" ||
    record.enrichmentStatus === "ambiguous" ||
    record.enrichmentStatus === "unmatched"
  ) {
    reasons.push(`enrichment_status=${record.enrichmentStatus}`);
  }

  if (!hasNormalizedNotes(record)) {
    reasons.push("missing normalized notes");
  }

  if (
    hasGeneratedDescriptionShort(record.descriptionShort) &&
    hasGeneratedDescriptionLong(record.descriptionLong)
  ) {
    reasons.push("placeholder generated descriptions");
  }

  return reasons;
}

function addIssue(
  issuesByRow: Map<number, ValidationIssue[]>,
  validationIssues: ValidationIssue[],
  issue: ValidationIssue,
) {
  const rowIssues = issuesByRow.get(issue.sourceRow) ?? [];
  rowIssues.push(issue);
  issuesByRow.set(issue.sourceRow, rowIssues);
  validationIssues.push(issue);
}

function addIssues(
  issuesByRow: Map<number, ValidationIssue[]>,
  validationIssues: ValidationIssue[],
  issues: ValidationIssue[],
) {
  for (const issue of issues) {
    addIssue(issuesByRow, validationIssues, issue);
  }
}

function formatInvalidRowLog(sourceRow: number, issues: ValidationIssue[]) {
  return `row ${sourceRow}: ${issues
    .filter((issue) => issue.level === "error")
    .map((issue) => `${issue.field}: ${issue.message}`)
    .join("; ")}`;
}

function parseMalformedRowIndex(message: string) {
  const match = message.match(/row\s+(\d+)/i);
  return match ? Number.parseInt(match[1] ?? "", 10) : 0;
}

export function createValidationReportEntries(params: {
  validationIssues: ValidationIssue[];
  malformedRows: string[];
}) {
  const issueEntries: ValidationReportEntry[] = params.validationIssues.map((issue) => ({
    rowIndex: issue.sourceRow,
    field: issue.field,
    message: issue.message,
    severity: issue.level,
  }));

  const malformedEntries: ValidationReportEntry[] = params.malformedRows.map((message) => ({
    rowIndex: parseMalformedRowIndex(message),
    field: "row",
    message,
    severity: "error",
  }));

  return [...issueEntries, ...malformedEntries].sort((left, right) => {
    if (left.rowIndex !== right.rowIndex) {
      return left.rowIndex - right.rowIndex;
    }

    return left.field.localeCompare(right.field);
  });
}

export async function preparePerfumeRecords(params: {
  inputPath: string;
  format: "auto" | "csv" | "json";
  source: PerfumeDataSource;
  limit?: number;
}) {
  const loaded = await loadPerfumeInput({
    inputPath: params.inputPath,
    format: params.format,
    normalizeHeader: normalizeCsvHeader,
  });

  const rawRecords = params.limit ? loaded.records.slice(0, params.limit) : loaded.records;
  const normalizedRecords: NormalizedPerfumeRecord[] = [];
  const candidateRecords: NormalizedPerfumeRecord[] = [];
  const validationIssues: ValidationIssue[] = [];
  const invalidLogs: string[] = [];
  const issuesByRow = new Map<number, ValidationIssue[]>();

  for (const item of rawRecords) {
    const normalized = normalizePerfumeRecord({
      source: params.source,
      sourceRow: item.sourceRow,
      record: item.record,
    });

    addIssues(issuesByRow, validationIssues, normalized.issues);

    if (!normalized.value) {
      continue;
    }

    const record = normalized.value;
    if (params.source === "verified" && record.catalogStatus === CatalogStatus.VERIFIED) {
      const downgradeReasons = getVerifiedDowngradeReasons(record);

      if (downgradeReasons.length > 0) {
        record.catalogStatus = CatalogStatus.IMPORTED_UNVERIFIED;
        addIssue(issuesByRow, validationIssues, {
          level: "warning",
          field: "catalog_status",
          message: `Downgraded to IMPORTED_UNVERIFIED: ${downgradeReasons.join(", ")}.`,
          sourceRow: record.sourceRow,
        });
      }
    }

    const issues = validatePerfumeRecord(record);
    addIssues(issuesByRow, validationIssues, issues);
    candidateRecords.push(record);
  }

  if (params.source === "verified") {
    for (const record of candidateRecords) {
      if (acceptedVerifiedCatalogStatuses.has(record.catalogStatus)) {
        continue;
      }

      addIssue(issuesByRow, validationIssues, {
        level: "error",
        field: "catalog_status",
        message:
          "Verified pipeline only accepts rows with catalog_status=VERIFIED or IMPORTED_UNVERIFIED.",
        sourceRow: record.sourceRow,
      });
    }
  }

  const recordsBySlug = new Map<string, NormalizedPerfumeRecord[]>();
  for (const record of candidateRecords) {
    const slugRecords = recordsBySlug.get(record.perfumeSlug) ?? [];
    slugRecords.push(record);
    recordsBySlug.set(record.perfumeSlug, slugRecords);
  }

  const duplicateSlugRecords = [...recordsBySlug.entries()].filter(([, records]) => records.length > 1);
  for (const [slug, records] of duplicateSlugRecords) {
    for (const record of records) {
      addIssue(issuesByRow, validationIssues, {
        level: "error",
        field: "slug",
        message: `Duplicate slug "${slug}" found in dataset.`,
        sourceRow: record.sourceRow,
      });
    }
  }

  for (const item of rawRecords) {
    const rowIssues = issuesByRow.get(item.sourceRow) ?? [];
    if (rowIssues.some((issue) => issue.level === "error")) {
      invalidLogs.push(formatInvalidRowLog(item.sourceRow, rowIssues));
    }
  }

  for (const record of candidateRecords) {
    const rowIssues = issuesByRow.get(record.sourceRow) ?? [];
    if (rowIssues.some((issue) => issue.level === "error")) {
      continue;
    }
    normalizedRecords.push(record);
  }

  const summary: VerificationSummary = {
    rowsRead: rawRecords.length,
    validRows: normalizedRecords.length,
    invalidRows: invalidLogs.length,
    malformedRows: loaded.malformedRows.length,
    warnings: validationIssues.filter((issue) => issue.level === "warning").length,
    errors: validationIssues.filter((issue) => issue.level === "error").length,
    duplicateSlugs: duplicateSlugRecords.length,
    missingFields: validationIssues.filter(
      (issue) => issue.level === "error" && requiredFieldNames.has(issue.field) && issue.message.includes("required"),
    ).length,
  };

  const validationReportEntries = createValidationReportEntries({
    validationIssues,
    malformedRows: loaded.malformedRows,
  });

  return {
    inputPath: loaded.inputPath,
    format: loaded.format,
    malformedRows: loaded.malformedRows,
    normalizedRecords,
    validationIssues,
    validationReportEntries,
    invalidLogs,
    summary,
  };
}

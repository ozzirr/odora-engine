import { loadPerfumeInput } from "@/lib/perfume-data/csv";
import { normalizeCsvHeader, normalizePerfumeRecord } from "@/lib/perfume-data/normalize";
import { validatePerfumeRecord } from "@/lib/perfume-data/validate";
import type {
  NormalizedPerfumeRecord,
  PerfumeDataSource,
  ValidationIssue,
  VerificationSummary,
} from "@/lib/perfume-data/types";

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
  const validationIssues: ValidationIssue[] = [];
  const invalidLogs: string[] = [];

  for (const item of rawRecords) {
    const normalized = normalizePerfumeRecord({
      source: params.source,
      sourceRow: item.sourceRow,
      record: item.record,
    });

    if (!normalized.value) {
      invalidLogs.push(`row ${item.sourceRow}: ${normalized.reason ?? "invalid record"}`);
      continue;
    }

    const record = normalized.value;
    const issues = validatePerfumeRecord(record);
    validationIssues.push(...issues);

    if (issues.some((issue) => issue.level === "error")) {
      invalidLogs.push(
        `row ${item.sourceRow}: ${issues
          .filter((issue) => issue.level === "error")
          .map((issue) => issue.message)
          .join("; ")}`,
      );
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
  };

  return {
    inputPath: loaded.inputPath,
    format: loaded.format,
    malformedRows: loaded.malformedRows,
    normalizedRecords,
    validationIssues,
    invalidLogs,
    summary,
  };
}

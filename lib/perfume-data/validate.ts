import { CatalogStatus, DataQuality } from "@prisma/client";

import type { NormalizedPerfumeRecord, ValidationIssue } from "@/lib/perfume-data/types";

export function validatePerfumeRecord(record: NormalizedPerfumeRecord): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!record.brandName) {
    issues.push({
      level: "error",
      field: "brand",
      message: "Brand name is required.",
      sourceRow: record.sourceRow,
    });
  }

  if (!record.perfumeName) {
    issues.push({
      level: "error",
      field: "name",
      message: "Perfume name is required.",
      sourceRow: record.sourceRow,
    });
  }

  if (record.notes.top.length === 0 && record.notes.heart.length === 0 && record.notes.base.length === 0) {
    issues.push({
      level: "warning",
      field: "notes",
      message: "Perfume has no normalized notes.",
      sourceRow: record.sourceRow,
    });
  }

  if (record.normalizedGender === "unknown") {
    issues.push({
      level: "warning",
      field: "gender",
      message: "Gender could not be normalized and fell back to UNISEX.",
      sourceRow: record.sourceRow,
    });
  }

  if (record.catalogStatus === CatalogStatus.VERIFIED && !record.officialSourceUrl) {
    issues.push({
      level: "warning",
      field: "official_source_url",
      message: "Verified rows should include an official source URL.",
      sourceRow: record.sourceRow,
    });
  }

  if (record.catalogStatus === CatalogStatus.VERIFIED && record.dataQuality === DataQuality.LOW) {
    issues.push({
      level: "warning",
      field: "data_quality",
      message: "Verified rows marked LOW quality should be reviewed.",
      sourceRow: record.sourceRow,
    });
  }

  if (!record.descriptionShort) {
    issues.push({
      level: "warning",
      field: "description_short",
      message: "Short description is empty after normalization.",
      sourceRow: record.sourceRow,
    });
  }

  return issues;
}

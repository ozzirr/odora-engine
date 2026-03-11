import { CatalogStatus, DataQuality } from "@prisma/client";

import type { NormalizedPerfumeRecord, ValidationIssue } from "@/lib/perfume-data/types";

const canonicalSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

  if (!record.perfumeSlug) {
    issues.push({
      level: "error",
      field: "slug",
      message: "Slug is required.",
      sourceRow: record.sourceRow,
    });
  } else if (!canonicalSlugPattern.test(record.perfumeSlug)) {
    issues.push({
      level: "error",
      field: "slug",
      message: "Slug must be lowercase and dash-separated.",
      sourceRow: record.sourceRow,
    });
  }

  if (!record.fragranceFamily) {
    issues.push({
      level: "error",
      field: "fragranceFamily",
      message: "Fragrance family is required.",
      sourceRow: record.sourceRow,
    });
  }

  if (record.normalizedGender === "unknown") {
    issues.push({
      level: "error",
      field: "gender",
      message: "Gender must normalize to MEN, WOMEN, or UNISEX.",
      sourceRow: record.sourceRow,
    });
  }

  for (const [field, value] of [
    ["longevityScore", record.longevityScore],
    ["sillageScore", record.sillageScore],
    ["versatilityScore", record.versatilityScore],
  ] as const) {
    if (value === undefined) {
      continue;
    }

    if (!Number.isInteger(value) || value < 0 || value > 10) {
      issues.push({
        level: "error",
        field,
        message: "Score must be an integer between 0 and 10.",
        sourceRow: record.sourceRow,
      });
    }
  }

  if (record.notes.top.length === 0 && record.notes.heart.length === 0 && record.notes.base.length === 0) {
    issues.push({
      level: "warning",
      field: "notes",
      message: "Perfume has no normalized notes.",
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

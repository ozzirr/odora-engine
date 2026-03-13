import path from "node:path";

import type { PerfumeDataSource } from "@/lib/perfume-data/types";

export const VERIFIED_INPUT_PATH = "data/verified/perfumes.csv";

export const VERIFIED_GENERATED_DIR = "data/generated/verified";
export const VERIFIED_CLEANED_PATH = `${VERIFIED_GENERATED_DIR}/perfumes.cleaned.csv`;
export const VERIFIED_ENRICHED_PATH = `${VERIFIED_GENERATED_DIR}/perfumes.enriched.csv`;
export const VERIFIED_VALIDATION_REPORT_PATH = `${VERIFIED_GENERATED_DIR}/perfume-validation-report.json`;
export const VERIFIED_ENRICHMENT_REPORT_PATH = `${VERIFIED_GENERATED_DIR}/perfume-enrichment-report.json`;
export const VERIFIED_REVIEW_QUEUE_JSON_PATH = `${VERIFIED_GENERATED_DIR}/perfume-review-queue.json`;
export const VERIFIED_REVIEW_QUEUE_CSV_PATH = `${VERIFIED_GENERATED_DIR}/perfume-review-queue.csv`;

export const PARFUMO_SOURCE_DIR = "data/sources/parfumo";
export const PARFUMO_TOP_MEN_PATH = `${PARFUMO_SOURCE_DIR}/top-men.csv`;
export const PARFUMO_TOP_WOMEN_PATH = `${PARFUMO_SOURCE_DIR}/top-women.csv`;
export const PARFUMO_TOP_UNISEX_PATH = `${PARFUMO_SOURCE_DIR}/top-unisex.csv`;
export const PARFUMO_TOP_LIST_PATHS = [
  PARFUMO_TOP_MEN_PATH,
  PARFUMO_TOP_WOMEN_PATH,
  PARFUMO_TOP_UNISEX_PATH,
] as const;

export const ARCHIVED_SYNTHETIC_PARFUMO_PATH = "data/archive/synthetic/parfumo/perfumes.csv";

export const ARCHIVED_VERIFIED_IMAGES_DIR = "data/archive/verified/images";
export const ARCHIVED_VERIFIED_APPROVED_IMAGES_MANIFEST_PATH =
  `${ARCHIVED_VERIFIED_IMAGES_DIR}/approved-images-manifest.csv`;
export const ARCHIVED_VERIFIED_IMAGE_WORKLIST_DIR = `${ARCHIVED_VERIFIED_IMAGES_DIR}/worklists`;
export const ARCHIVED_VERIFIED_IMAGE_SOURCE_SUGGESTIONS_CSV_PATH =
  `${ARCHIVED_VERIFIED_IMAGE_WORKLIST_DIR}/image-source-suggestions.csv`;
export const ARCHIVED_VERIFIED_IMAGE_SOURCE_SUGGESTIONS_JSON_PATH =
  `${ARCHIVED_VERIFIED_IMAGE_WORKLIST_DIR}/image-source-suggestions.json`;
export const ARCHIVED_VERIFIED_IMAGE_SOURCING_WORKLIST_CSV_PATH =
  `${ARCHIVED_VERIFIED_IMAGE_WORKLIST_DIR}/image-sourcing-worklist.csv`;
export const ARCHIVED_VERIFIED_IMAGE_SOURCING_WORKLIST_JSON_PATH =
  `${ARCHIVED_VERIFIED_IMAGE_WORKLIST_DIR}/image-sourcing-worklist.json`;

function siblingArtifactPath(inputPath: string, filename: string) {
  const parsed = path.parse(inputPath);
  return path.join(parsed.dir, filename);
}

export function defaultVerifyInputPath(source: PerfumeDataSource) {
  return source === "verified" ? VERIFIED_INPUT_PATH : ARCHIVED_SYNTHETIC_PARFUMO_PATH;
}

export function defaultEnrichInputPath(source: PerfumeDataSource) {
  return source === "verified" ? VERIFIED_INPUT_PATH : ARCHIVED_SYNTHETIC_PARFUMO_PATH;
}

export function defaultImportInputPath(source: PerfumeDataSource) {
  return source === "verified" ? VERIFIED_ENRICHED_PATH : ARCHIVED_SYNTHETIC_PARFUMO_PATH;
}

export function defaultCleanedOutputPath(source: PerfumeDataSource, inputPath: string) {
  return source === "verified"
    ? VERIFIED_CLEANED_PATH
    : siblingArtifactPath(inputPath, `${path.parse(inputPath).name}.cleaned.csv`);
}

export function defaultEnrichedOutputPath(source: PerfumeDataSource, inputPath: string) {
  return source === "verified"
    ? VERIFIED_ENRICHED_PATH
    : siblingArtifactPath(inputPath, `${path.parse(inputPath).name}.enriched.csv`);
}

export function defaultValidationReportPath(source: PerfumeDataSource, inputPath: string) {
  return source === "verified"
    ? VERIFIED_VALIDATION_REPORT_PATH
    : siblingArtifactPath(inputPath, `${path.parse(inputPath).name}.validation-report.json`);
}

export function defaultEnrichmentReportPath(source: PerfumeDataSource, inputPath: string) {
  return source === "verified"
    ? VERIFIED_ENRICHMENT_REPORT_PATH
    : siblingArtifactPath(inputPath, `${path.parse(inputPath).name}.enrichment-report.json`);
}

export function defaultReviewQueueJsonPath(source: PerfumeDataSource, inputPath: string) {
  return source === "verified"
    ? VERIFIED_REVIEW_QUEUE_JSON_PATH
    : siblingArtifactPath(inputPath, `${path.parse(inputPath).name}.review-queue.json`);
}

export function defaultReviewQueueCsvPath(source: PerfumeDataSource, inputPath: string) {
  return source === "verified"
    ? VERIFIED_REVIEW_QUEUE_CSV_PATH
    : siblingArtifactPath(inputPath, `${path.parse(inputPath).name}.review-queue.csv`);
}

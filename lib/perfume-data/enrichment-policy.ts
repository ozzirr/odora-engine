import type { EnrichmentTargetField } from "@/lib/perfume-data/types";

export type FieldPolicy = {
  trustedSourcePriority: string[];
  overwritePolicy: "fill_missing_or_invalid_only";
  missingValuePolicy: "leave_empty";
  conflictPolicy: "log_keep_verified";
};

export const fieldPolicyByField: Record<EnrichmentTargetField, FieldPolicy> = {
  releaseYear: {
    trustedSourcePriority: ["official-brand", "fragrantica", "parfumo-top-lists"],
    overwritePolicy: "fill_missing_or_invalid_only",
    missingValuePolicy: "leave_empty",
    conflictPolicy: "log_keep_verified",
  },
  topNotes: {
    trustedSourcePriority: ["official-brand", "fragrantica", "parfumo-top-lists"],
    overwritePolicy: "fill_missing_or_invalid_only",
    missingValuePolicy: "leave_empty",
    conflictPolicy: "log_keep_verified",
  },
  middleNotes: {
    trustedSourcePriority: ["official-brand", "fragrantica", "parfumo-top-lists"],
    overwritePolicy: "fill_missing_or_invalid_only",
    missingValuePolicy: "leave_empty",
    conflictPolicy: "log_keep_verified",
  },
  baseNotes: {
    trustedSourcePriority: ["official-brand", "fragrantica", "parfumo-top-lists"],
    overwritePolicy: "fill_missing_or_invalid_only",
    missingValuePolicy: "leave_empty",
    conflictPolicy: "log_keep_verified",
  },
  fragranceFamily: {
    trustedSourcePriority: ["official-brand", "fragrantica", "parfumo-top-lists"],
    overwritePolicy: "fill_missing_or_invalid_only",
    missingValuePolicy: "leave_empty",
    conflictPolicy: "log_keep_verified",
  },
  descriptionShort: {
    trustedSourcePriority: ["official-brand", "fragrantica"],
    overwritePolicy: "fill_missing_or_invalid_only",
    missingValuePolicy: "leave_empty",
    conflictPolicy: "log_keep_verified",
  },
  descriptionLong: {
    trustedSourcePriority: ["official-brand", "fragrantica"],
    overwritePolicy: "fill_missing_or_invalid_only",
    missingValuePolicy: "leave_empty",
    conflictPolicy: "log_keep_verified",
  },
  longevityScore: {
    trustedSourcePriority: ["fragrantica", "parfumo-top-lists"],
    overwritePolicy: "fill_missing_or_invalid_only",
    missingValuePolicy: "leave_empty",
    conflictPolicy: "log_keep_verified",
  },
  sillageScore: {
    trustedSourcePriority: ["fragrantica", "parfumo-top-lists"],
    overwritePolicy: "fill_missing_or_invalid_only",
    missingValuePolicy: "leave_empty",
    conflictPolicy: "log_keep_verified",
  },
  versatilityScore: {
    trustedSourcePriority: ["fragrantica", "parfumo-top-lists"],
    overwritePolicy: "fill_missing_or_invalid_only",
    missingValuePolicy: "leave_empty",
    conflictPolicy: "log_keep_verified",
  },
  officialSourceUrl: {
    trustedSourcePriority: ["official-brand"],
    overwritePolicy: "fill_missing_or_invalid_only",
    missingValuePolicy: "leave_empty",
    conflictPolicy: "log_keep_verified",
  },
  imageSourceUrl: {
    trustedSourcePriority: ["official-brand", "parfumo-top-lists", "fragrantica"],
    overwritePolicy: "fill_missing_or_invalid_only",
    missingValuePolicy: "leave_empty",
    conflictPolicy: "log_keep_verified",
  },
};

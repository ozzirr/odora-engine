import { stat } from "node:fs/promises";
import path from "node:path";

import { loadPerfumeInput } from "@/lib/perfume-data/csv";
import { normalizeCsvHeader } from "@/lib/perfume-data/normalize";
import { enrichmentTargetFields } from "@/lib/perfume-data/types";
import type { EnrichmentCandidate, EnrichmentSourceAuditEntry, NormalizedPerfumeRecord } from "@/lib/perfume-data/types";
import { createCandidate, buildMatchKey, type PerfumeSourceAdapter, type SourceRecordResult } from "@/lib/perfume-data/sources/base";

type ParfumoSnapshotRecord = {
  brand: string;
  name: string;
  parfumoUrl: string;
  imageUrl?: string;
  sourcePath: string;
  sourceLastCheckedAt: string;
  safeKey: string;
  variantKey: string;
};

const adapterId = "parfumo-top-lists";
const adapterLabel = "Parfumo Top Lists";
const sourcePaths = [
  "data/import/parfumo-top-men.csv",
  "data/import/parfumo-top-women.csv",
  "data/import/parfumo-top-unisex.csv",
] as const;

const supportedFields = ["imageSourceUrl"] as const;
const plannedFields = [...supportedFields] as const;

function selectUniqueCandidates(records: ParfumoSnapshotRecord[]) {
  const uniqueByUrl = new Map<string, ParfumoSnapshotRecord>();
  for (const record of records) {
    uniqueByUrl.set(record.parfumoUrl, record);
  }
  return [...uniqueByUrl.values()];
}

function candidateFromRecord(
  record: ParfumoSnapshotRecord,
  confidenceScore: number,
  matchReason: string,
): EnrichmentCandidate {
  return createCandidate({
    source: adapterLabel,
    sourceId: adapterId,
    name: record.name,
    url: record.parfumoUrl,
    confidenceScore,
    confidenceLevel: confidenceScore >= 0.95 ? "high" : "low",
    matchReason,
  });
}

function parseRecordFromLoaded(
  sourcePath: string,
  sourceLastCheckedAt: string,
  record: Record<string, unknown>,
) {
  const brand = String(record.brand ?? "").trim();
  const name = String(record.name ?? "").trim();
  const parfumoUrl = String(record.parfumourl ?? "").trim();

  if (!brand || !name || !parfumoUrl) {
    return null;
  }

  return {
    brand,
    name,
    parfumoUrl,
    imageUrl: String(record.imageurl ?? "").trim() || undefined,
    sourcePath,
    sourceLastCheckedAt,
    safeKey: buildMatchKey(brand, name, "safe"),
    variantKey: buildMatchKey(brand, name, "variant"),
  } satisfies ParfumoSnapshotRecord;
}

async function loadSourceRecords() {
  const safeIndex = new Map<string, ParfumoSnapshotRecord[]>();
  const variantIndex = new Map<string, ParfumoSnapshotRecord[]>();
  const recordByUrl = new Map<string, ParfumoSnapshotRecord>();

  for (const sourcePath of sourcePaths) {
    const loaded = await loadPerfumeInput({
      inputPath: sourcePath,
      format: "csv",
      normalizeHeader: normalizeCsvHeader,
    });
    const metadata = await stat(path.resolve(process.cwd(), sourcePath));
    const sourceLastCheckedAt = metadata.mtime.toISOString();

    for (const item of loaded.records) {
      const parsed = parseRecordFromLoaded(sourcePath, sourceLastCheckedAt, item.record);
      if (!parsed) {
        continue;
      }

      recordByUrl.set(parsed.parfumoUrl, parsed);

      const safeRecords = safeIndex.get(parsed.safeKey) ?? [];
      safeRecords.push(parsed);
      safeIndex.set(parsed.safeKey, safeRecords);

      const variantRecords = variantIndex.get(parsed.variantKey) ?? [];
      variantRecords.push(parsed);
      variantIndex.set(parsed.variantKey, variantRecords);
    }
  }

  return {
    safeIndex,
    variantIndex,
    recordByUrl,
  };
}

export function createParfumoTopListAdapter(): PerfumeSourceAdapter {
  let cachePromise: Promise<Awaited<ReturnType<typeof loadSourceRecords>>> | undefined;

  const getCache = () => {
    cachePromise ??= loadSourceRecords();
    return cachePromise;
  };

  return {
    id: adapterId,
    label: adapterLabel,
    trusted: true,
    implemented: true,
    supportedFields: [...supportedFields],
    plannedFields: [...plannedFields],
    async searchCandidates(record: NormalizedPerfumeRecord) {
      const cache = await getCache();
      const safeKey = buildMatchKey(record.brandName, record.perfumeName, "safe");
      const safeCandidates = selectUniqueCandidates(cache.safeIndex.get(safeKey) ?? []);

      if (safeCandidates.length === 1) {
        const candidate = safeCandidates[0];
        const isExact = candidate.brand === record.brandName && candidate.name === record.perfumeName;
        return [
          candidateFromRecord(
            candidate,
            isExact ? 1 : 0.97,
            isExact ? "Exact brand and name match." : "Accent/year-normalized brand and name match.",
          ),
        ];
      }

      if (safeCandidates.length > 1) {
        return safeCandidates.map((candidate) =>
          candidateFromRecord(candidate, 0.6, "Multiple trusted Parfumo candidates share the same normalized key."),
        );
      }

      const variantKey = buildMatchKey(record.brandName, record.perfumeName, "variant");
      const variantCandidates = selectUniqueCandidates(cache.variantIndex.get(variantKey) ?? []);
      if (variantCandidates.length === 1) {
        return [
          candidateFromRecord(
            variantCandidates[0],
            0.84,
            "Variant-only match after concentration-stripping fallback; manual review required.",
          ),
        ];
      }

      if (variantCandidates.length > 1) {
        return variantCandidates.map((candidate) =>
          candidateFromRecord(
            candidate,
            0.55,
            "Multiple Parfumo variant candidates matched after concentration-stripping fallback.",
          ),
        );
      }

      return [];
    },
    async fetchSourceRecord(candidate: EnrichmentCandidate) {
      const cache = await getCache();
      const record = cache.recordByUrl.get(candidate.url);
      if (!record) {
        return null;
      }

      const result: SourceRecordResult = {
        sourceId: adapterId,
        sourceName: adapterLabel,
        matchedName: record.name,
        matchedUrl: record.parfumoUrl,
        supportedFields: [...supportedFields],
        unsupportedFields: (enrichmentTargetFields as readonly string[]).filter(
          (field) => !supportedFields.includes(field as (typeof supportedFields)[number]),
        ) as SourceRecordResult["unsupportedFields"],
        fields: {},
        notes: [
          "Top-list snapshots currently provide trusted identity, URL, rating metadata, and image URL only.",
        ],
      };

      if (record.imageUrl) {
        result.fields.imageSourceUrl = {
          field: "imageSourceUrl",
          value: record.imageUrl,
          sourceField: "image_url",
          sourceUrl: record.parfumoUrl,
          confidence: candidate.confidenceScore,
          lastCheckedAt: record.sourceLastCheckedAt,
          notes: ["Applied only when the verified row is missing imageSourceUrl or the existing value is invalid."],
        };
      }

      return result;
    },
    getAuditEntries() {
      const entries: EnrichmentSourceAuditEntry[] = sourcePaths.map((sourcePath) => ({
        path: sourcePath,
        classification: "KEEP",
        trusted: true,
        reason: "Trusted local Parfumo snapshot used for conservative verified enrichment matches.",
      }));

      entries.push({
        path: "scripts/archive/import/import-parfumo-tops.ts",
        classification: "ARCHIVE",
        trusted: false,
        reason: "Historical append workflow superseded by the reusable Parfumo source adapter.",
      });

      entries.push({
        path: "scripts/archive/import/fetch-parfumo-tops.ts",
        classification: "ARCHIVE",
        trusted: false,
        reason: "Historical collection helper; not part of the maintained adapter-based enrichment pipeline.",
      });

      return entries;
    },
  };
}

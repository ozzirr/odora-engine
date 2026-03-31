import type { EnrichmentCandidate, EnrichmentSourceAuditEntry, NormalizedPerfumeRecord } from "@/lib/perfume-data/types";
import type { PerfumeSourceAdapter } from "@/lib/perfume-data/sources/base";

const adapterId = "fragrantica";
const adapterLabel = "Fragrantica";
const plannedFields = [
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
  "imageSourceUrl",
] as const;

export function createFragranticaAdapter(): PerfumeSourceAdapter {
  return {
    id: adapterId,
    label: adapterLabel,
    trusted: false,
    implemented: false,
    supportedFields: [],
    plannedFields: [...plannedFields],
    async searchCandidates(_record: NormalizedPerfumeRecord): Promise<EnrichmentCandidate[]> {
      return [];
    },
    async fetchSourceRecord() {
      return null;
    },
    getAuditEntries() {
      const entries: EnrichmentSourceAuditEntry[] = [
        {
          path: "lib/perfume-data/sources/fragrantica.ts",
          classification: "REFACTOR",
          trusted: false,
          reason: "Placeholder adapter; not implemented until a trusted Fragrantica ingestion path exists.",
        },
      ];

      return entries;
    },
  };
}

import type {
  EnrichmentCandidate,
  EnrichmentSourceAuditEntry,
} from "@/lib/perfume-data/types";
import type { PerfumeSourceAdapter } from "@/lib/perfume-data/sources/base";

const adapterId = "official-brand";
const adapterLabel = "Official Brand Sites";
const plannedFields = [
  "releaseYear",
  "topNotes",
  "middleNotes",
  "baseNotes",
  "fragranceFamily",
  "descriptionShort",
  "descriptionLong",
  "officialSourceUrl",
  "imageSourceUrl",
] as const;

export function createOfficialBrandAdapter(): PerfumeSourceAdapter {
  return {
    id: adapterId,
    label: adapterLabel,
    trusted: true,
    implemented: false,
    supportedFields: [],
    plannedFields: [...plannedFields],
    async searchCandidates(): Promise<EnrichmentCandidate[]> {
      return [];
    },
    async fetchSourceRecord() {
      return null;
    },
    getAuditEntries() {
      const entries: EnrichmentSourceAuditEntry[] = [
        {
          path: "lib/perfume-data/sources/official-brand.ts",
          classification: "REFACTOR",
          trusted: true,
          reason: "Placeholder adapter for future official-site integrations; no trusted local ingestion path exists yet.",
        },
      ];

      return entries;
    },
  };
}

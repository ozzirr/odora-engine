import path from "node:path";

export const DEFAULT_OFFERS_BACKUP_PATH = "data/generated/backups/offers.backup.json";

export type OfferBackupRow = {
  perfumeSlug: string;
  store: {
    slug: string;
    name: string;
    websiteUrl: string;
    affiliateProgram: string | null;
    logoUrl: string | null;
    isActive: boolean;
  };
  productUrl: string;
  affiliateUrl: string | null;
  priceAmount: number;
  currency: string;
  shippingCost: number | null;
  lastCheckedAt: string;
  isBestPrice: boolean;
};

export type PerfumeRelationBackupRow = {
  perfumeSlug: string;
  moods: Array<{
    slug: string;
    weight: number | null;
  }>;
  seasons: Array<{
    slug: string;
    weight: number | null;
  }>;
  occasions: Array<{
    slug: string;
    weight: number | null;
  }>;
};

export type HomepagePlacementBackupRow = {
  perfumeSlug: string;
  section: string;
  priority: number;
};

export type OffersBackupFile = {
  version: 3;
  createdAt: string;
  offers: OfferBackupRow[];
  perfumeRelations: PerfumeRelationBackupRow[];
  homepagePlacements: HomepagePlacementBackupRow[];
};

export function resolveOffersBackupPath(inputPath?: string) {
  return path.resolve(process.cwd(), inputPath ?? DEFAULT_OFFERS_BACKUP_PATH);
}

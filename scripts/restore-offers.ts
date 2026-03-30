import "dotenv/config";

import { readFile } from "node:fs/promises";

import { HomepageSection, PrismaClient } from "@prisma/client";

import { syncPerfumePrices } from "@/lib/perfume-data/prices";

import {
  resolveOffersBackupPath,
  type HomepagePlacementBackupRow,
  type OfferBackupRow,
  type OffersBackupFile,
  type PerfumeRelationBackupRow,
} from "./lib/offers-backup";

type CliOptions = {
  inputPath?: string;
  dryRun: boolean;
  replaceExisting: boolean;
};

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    replaceExisting: false,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--replace-existing") {
      options.replaceExisting = true;
      continue;
    }

    if (arg.startsWith("--input=")) {
      options.inputPath = arg.replace("--input=", "");
    }
  }

  return options;
}

function isOfferBackupRow(value: unknown): value is OfferBackupRow {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Partial<OfferBackupRow>;
  return (
    typeof row.perfumeSlug === "string" &&
    typeof row.productUrl === "string" &&
    typeof row.currency === "string" &&
    typeof row.priceAmount === "number" &&
    typeof row.availability === "string" &&
    typeof row.lastCheckedAt === "string" &&
    typeof row.isBestPrice === "boolean" &&
    Boolean(row.store) &&
    typeof row.store?.slug === "string" &&
    typeof row.store?.name === "string" &&
    typeof row.store?.websiteUrl === "string"
  );
}

function isPerfumeRelationBackupRow(value: unknown): value is PerfumeRelationBackupRow {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Partial<PerfumeRelationBackupRow>;
  return (
    typeof row.perfumeSlug === "string" &&
    Array.isArray(row.moods) &&
    Array.isArray(row.seasons) &&
    Array.isArray(row.occasions)
  );
}

function isHomepagePlacementBackupRow(value: unknown): value is HomepagePlacementBackupRow {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Partial<HomepagePlacementBackupRow>;
  return (
    typeof row.perfumeSlug === "string" &&
    typeof row.section === "string" &&
    typeof row.priority === "number"
  );
}

function parseBackupFile(raw: string): OffersBackupFile {
  const parsed = JSON.parse(raw) as Partial<OffersBackupFile> & {
    version?: number;
    perfumeRelations?: unknown;
    homepagePlacements?: unknown;
  };

  if (
    ![1, 2].includes(parsed.version ?? 0) ||
    !Array.isArray(parsed.offers) ||
    !parsed.offers.every(isOfferBackupRow)
  ) {
    throw new Error("Invalid offers backup payload.");
  }

  return {
    version: 2,
    createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : new Date().toISOString(),
    offers: parsed.offers,
    perfumeRelations:
      Array.isArray(parsed.perfumeRelations) && parsed.perfumeRelations.every(isPerfumeRelationBackupRow)
        ? parsed.perfumeRelations
        : [],
    homepagePlacements:
      Array.isArray(parsed.homepagePlacements) && parsed.homepagePlacements.every(isHomepagePlacementBackupRow)
        ? parsed.homepagePlacements
        : [],
  };
}

function toDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const prisma = new PrismaClient();
  const inputPath = resolveOffersBackupPath(options.inputPath);
  const payload = parseBackupFile(await readFile(inputPath, "utf8"));

  const storesBySlug = new Map(
    payload.offers.map((offer) => [offer.store.slug, offer.store] as const),
  );
  const perfumeSlugs = [
    ...new Set([
      ...payload.offers.map((offer) => offer.perfumeSlug),
      ...payload.perfumeRelations.map((entry) => entry.perfumeSlug),
      ...payload.homepagePlacements.map((entry) => entry.perfumeSlug),
    ]),
  ];

  if (options.dryRun) {
    const [matchedPerfumes, existingOffers] = await Promise.all([
      prisma.perfume.count({
        where: {
          slug: { in: perfumeSlugs },
        },
      }),
      prisma.offer.count(),
    ]);

    console.log(`[offers:restore] dryRun=true input=${inputPath}`);
    console.log(`[offers:restore] offers in backup=${payload.offers.length}`);
    console.log(`[offers:restore] unique perfumes in backup=${perfumeSlugs.length}`);
    console.log(`[offers:restore] matched perfumes in db=${matchedPerfumes}`);
    console.log(`[offers:restore] stores in backup=${storesBySlug.size}`);
    console.log(`[offers:restore] perfume relation sets in backup=${payload.perfumeRelations.length}`);
    console.log(`[offers:restore] homepage placements in backup=${payload.homepagePlacements.length}`);
    console.log(`[offers:restore] existing offers in db=${existingOffers}`);
    console.log(`[offers:restore] replaceExisting=${options.replaceExisting}`);
    await prisma.$disconnect();
    return;
  }

  for (const store of storesBySlug.values()) {
    await prisma.store.upsert({
      where: { slug: store.slug },
      update: {
        name: store.name,
        websiteUrl: store.websiteUrl,
        affiliateProgram: store.affiliateProgram,
        logoUrl: store.logoUrl,
        isActive: store.isActive,
      },
      create: {
        slug: store.slug,
        name: store.name,
        websiteUrl: store.websiteUrl,
        affiliateProgram: store.affiliateProgram,
        logoUrl: store.logoUrl,
        isActive: store.isActive,
      },
    });
  }

  const [perfumes, stores] = await Promise.all([
    prisma.perfume.findMany({
      where: {
        slug: { in: perfumeSlugs },
      },
      select: {
        id: true,
        slug: true,
      },
    }),
    prisma.store.findMany({
      where: {
        slug: { in: [...storesBySlug.keys()] },
      },
      select: {
        id: true,
        slug: true,
      },
    }),
  ]);

  const perfumeIdBySlug = new Map(perfumes.map((perfume) => [perfume.slug, perfume.id]));
  const storeIdBySlug = new Map(stores.map((store) => [store.slug, store.id]));
  const missingPerfumeSlugs = [...new Set(perfumeSlugs.filter((slug) => !perfumeIdBySlug.has(slug)))];

  const [moods, seasons, occasions] = await Promise.all([
    prisma.mood.findMany({ select: { id: true, slug: true } }),
    prisma.season.findMany({ select: { id: true, slug: true } }),
    prisma.occasion.findMany({ select: { id: true, slug: true } }),
  ]);

  const moodIdBySlug = new Map(moods.map((mood) => [mood.slug, mood.id]));
  const seasonIdBySlug = new Map(seasons.map((season) => [season.slug, season.id]));
  const occasionIdBySlug = new Map(occasions.map((occasion) => [occasion.slug, occasion.id]));

  if (options.replaceExisting) {
    await prisma.offer.deleteMany();
    await prisma.perfumeHomepagePlacement.deleteMany();
    await prisma.perfumeOccasion.deleteMany();
    await prisma.perfumeSeason.deleteMany();
    await prisma.perfumeMood.deleteMany();
  }

  const rowsToCreate = payload.offers.flatMap((offer) => {
    const perfumeId = perfumeIdBySlug.get(offer.perfumeSlug);
    const storeId = storeIdBySlug.get(offer.store.slug);

    if (!perfumeId || !storeId) {
      return [];
    }

    return [
      {
        perfumeId,
        storeId,
        productUrl: offer.productUrl,
        affiliateUrl: offer.affiliateUrl,
        priceAmount: offer.priceAmount,
        currency: offer.currency,
        shippingCost: offer.shippingCost,
        availability: offer.availability as
          | "IN_STOCK"
          | "LIMITED"
          | "OUT_OF_STOCK"
          | "PREORDER",
        lastCheckedAt: toDate(offer.lastCheckedAt),
        isBestPrice: offer.isBestPrice,
      },
    ];
  });

  if (rowsToCreate.length > 0) {
    await prisma.offer.createMany({
      data: rowsToCreate,
    });
  }

  const moodRows = payload.perfumeRelations.flatMap((entry) => {
    const perfumeId = perfumeIdBySlug.get(entry.perfumeSlug);
    if (!perfumeId) {
      return [];
    }

    return entry.moods.flatMap((mood) => {
      const moodId = moodIdBySlug.get(mood.slug);
      if (!moodId) {
        return [];
      }

      return [{ perfumeId, moodId, weight: mood.weight }];
    });
  });

  const seasonRows = payload.perfumeRelations.flatMap((entry) => {
    const perfumeId = perfumeIdBySlug.get(entry.perfumeSlug);
    if (!perfumeId) {
      return [];
    }

    return entry.seasons.flatMap((season) => {
      const seasonId = seasonIdBySlug.get(season.slug);
      if (!seasonId) {
        return [];
      }

      return [{ perfumeId, seasonId, weight: season.weight }];
    });
  });

  const occasionRows = payload.perfumeRelations.flatMap((entry) => {
    const perfumeId = perfumeIdBySlug.get(entry.perfumeSlug);
    if (!perfumeId) {
      return [];
    }

    return entry.occasions.flatMap((occasion) => {
      const occasionId = occasionIdBySlug.get(occasion.slug);
      if (!occasionId) {
        return [];
      }

      return [{ perfumeId, occasionId, weight: occasion.weight }];
    });
  });

  if (moodRows.length > 0) {
    await prisma.perfumeMood.createMany({
      data: moodRows,
      skipDuplicates: true,
    });
  }

  if (seasonRows.length > 0) {
    await prisma.perfumeSeason.createMany({
      data: seasonRows,
      skipDuplicates: true,
    });
  }

  if (occasionRows.length > 0) {
    await prisma.perfumeOccasion.createMany({
      data: occasionRows,
      skipDuplicates: true,
    });
  }

  for (const placement of payload.homepagePlacements) {
    const perfumeId = perfumeIdBySlug.get(placement.perfumeSlug);
    if (!perfumeId) {
      continue;
    }

    await prisma.perfumeHomepagePlacement.upsert({
      where: {
        perfumeId_section: {
          perfumeId,
          section: placement.section as HomepageSection,
        },
      },
      update: {
        priority: placement.priority,
      },
      create: {
        perfumeId,
        section: placement.section as HomepageSection,
        priority: placement.priority,
      },
    });
  }

  const priceStats = await syncPerfumePrices({
    prisma,
    dryRun: false,
  });

  console.log(`[offers:restore] dryRun=false input=${inputPath}`);
  console.log(`[offers:restore] stores upserted=${storesBySlug.size}`);
  console.log(`[offers:restore] offers restored=${rowsToCreate.length}`);
  console.log(`[offers:restore] mood relations restored=${moodRows.length}`);
  console.log(`[offers:restore] season relations restored=${seasonRows.length}`);
  console.log(`[offers:restore] occasion relations restored=${occasionRows.length}`);
  console.log(`[offers:restore] homepage placements restored=${payload.homepagePlacements.length}`);
  console.log(`[offers:restore] missing perfumes=${missingPerfumeSlugs.length}`);
  if (missingPerfumeSlugs.length > 0) {
    console.log(`[offers:restore] missing perfume slugs=${missingPerfumeSlugs.join(", ")}`);
  }
  console.log(`[offers:restore] replaceExisting=${options.replaceExisting}`);
  console.log(`[offers:restore] best offer snapshots updated=${priceStats.bestOfferSnapshotsUpdated}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("[offers:restore] failed:", error);
  process.exitCode = 1;
});

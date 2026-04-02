import "dotenv/config";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import {
  resolveOffersBackupPath,
  type OffersBackupFile,
} from "./lib/offers-backup";

type CliOptions = {
  outputPath?: string;
};

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {};

  for (const arg of argv) {
    if (arg.startsWith("--output=")) {
      options.outputPath = arg.replace("--output=", "");
    }
  }

  return options;
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const prisma = new PrismaClient();
  const outputPath = resolveOffersBackupPath(options.outputPath);

  const offers = await prisma.offer.findMany({
    select: {
      productUrl: true,
      affiliateUrl: true,
      priceAmount: true,
      currency: true,
      shippingCost: true,
      lastCheckedAt: true,
      isBestPrice: true,
      perfume: {
        select: {
          slug: true,
        },
      },
      store: {
        select: {
          slug: true,
          name: true,
          websiteUrl: true,
          affiliateProgram: true,
          logoUrl: true,
          isActive: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  const perfumeRelations = await prisma.perfume.findMany({
    select: {
      slug: true,
      moods: {
        select: {
          weight: true,
          mood: {
            select: {
              slug: true,
            },
          },
        },
      },
      seasons: {
        select: {
          weight: true,
          season: {
            select: {
              slug: true,
            },
          },
        },
      },
      occasions: {
        select: {
          weight: true,
          occasion: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
    orderBy: {
      slug: "asc",
    },
  });

  const homepagePlacements = await prisma.perfumeHomepagePlacement.findMany({
    select: {
      section: true,
      priority: true,
      perfume: {
        select: {
          slug: true,
        },
      },
    },
    orderBy: [{ section: "asc" }, { priority: "asc" }],
  });

  const payload: OffersBackupFile = {
    version: 3,
    createdAt: new Date().toISOString(),
    offers: offers.map((offer) => ({
      perfumeSlug: offer.perfume.slug,
      store: {
        slug: offer.store.slug,
        name: offer.store.name,
        websiteUrl: offer.store.websiteUrl,
        affiliateProgram: offer.store.affiliateProgram,
        logoUrl: offer.store.logoUrl,
        isActive: offer.store.isActive,
      },
      productUrl: offer.productUrl,
      affiliateUrl: offer.affiliateUrl,
      priceAmount: offer.priceAmount,
      currency: offer.currency,
      shippingCost: offer.shippingCost,
      lastCheckedAt: offer.lastCheckedAt.toISOString(),
      isBestPrice: offer.isBestPrice,
    })),
    perfumeRelations: perfumeRelations.map((perfume) => ({
      perfumeSlug: perfume.slug,
      moods: perfume.moods.flatMap((entry) =>
        entry.mood?.slug ? [{ slug: entry.mood.slug, weight: entry.weight }] : [],
      ),
      seasons: perfume.seasons.flatMap((entry) =>
        entry.season?.slug ? [{ slug: entry.season.slug, weight: entry.weight }] : [],
      ),
      occasions: perfume.occasions.flatMap((entry) =>
        entry.occasion?.slug ? [{ slug: entry.occasion.slug, weight: entry.weight }] : [],
      ),
    })),
    homepagePlacements: homepagePlacements.flatMap((placement) =>
      placement.perfume?.slug
        ? [
            {
              perfumeSlug: placement.perfume.slug,
              section: placement.section,
              priority: placement.priority,
            },
          ]
        : [],
    ),
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(`[offers:backup] saved ${payload.offers.length} offers`);
  console.log(`[offers:backup] saved ${payload.perfumeRelations.length} perfume relation sets`);
  console.log(`[offers:backup] saved ${payload.homepagePlacements.length} homepage placements`);
  console.log(`[offers:backup] output=${outputPath}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("[offers:backup] failed:", error);
  process.exitCode = 1;
});

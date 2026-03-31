import { PrismaClient } from "@prisma/client";

import { PUBLIC_CACHE_TAGS } from "@/lib/cache-tags";
import { syncPerfumePrices } from "@/lib/perfume-data/prices";

type CliOptions = {
  dryRun: boolean;
};

function parseCliOptions(argv: string[]): CliOptions {
  return {
    dryRun: argv.includes("--dry-run"),
  };
}

async function revalidatePublicCatalogCache(perfumeSlugs: string[], dryRun: boolean) {
  const revalidateUrl = process.env.ODORA_REVALIDATE_URL?.trim();
  const revalidateToken = process.env.ODORA_REVALIDATE_TOKEN?.trim();

  if (!revalidateUrl || !revalidateToken) {
    console.log("[prices:sync] cache revalidation skipped (missing ODORA_REVALIDATE_URL or ODORA_REVALIDATE_TOKEN)");
    return;
  }

  if (dryRun) {
    console.log("[prices:sync] cache revalidation skipped (dry run)");
    return;
  }

  const response = await fetch(revalidateUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${revalidateToken}`,
    },
    body: JSON.stringify({
      tags: [PUBLIC_CACHE_TAGS.catalog],
      perfumeSlugs,
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Cache revalidation failed (${response.status}): ${message}`);
  }

  console.log(`[prices:sync] cache revalidated for ${perfumeSlugs.length} perfume detail pages`);
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const prisma = new PrismaClient();
  const stats = await syncPerfumePrices({
    prisma,
    dryRun: options.dryRun,
  });

  await revalidatePublicCatalogCache(stats.updatedPerfumeSlugs, options.dryRun);

  console.log(`[prices:sync] dryRun=${options.dryRun}`);
  console.log("");
  console.log("Price sync summary");
  console.log("------------------");
  console.log(`perfumes read: ${stats.perfumesRead}`);
  console.log(`perfumes with offers: ${stats.perfumesWithOffers}`);
  console.log(`skipped without offers: ${stats.skippedWithoutOffers}`);
  console.log(`price ranges updated: ${stats.priceRangesUpdated}`);
  console.log(`best offers updated: ${stats.bestOffersUpdated}`);
  console.log(`best offer snapshots updated: ${stats.bestOfferSnapshotsUpdated}`);
  console.log(`public cache candidates: ${stats.updatedPerfumeSlugs.length}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("[prices:sync] failed:", error);
  process.exitCode = 1;
});

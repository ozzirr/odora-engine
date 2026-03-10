import { PrismaClient } from "@prisma/client";

import { syncPerfumePrices } from "@/lib/perfume-data/prices";

type CliOptions = {
  dryRun: boolean;
};

function parseCliOptions(argv: string[]): CliOptions {
  return {
    dryRun: argv.includes("--dry-run"),
  };
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const prisma = new PrismaClient();
  const stats = await syncPerfumePrices({
    prisma,
    dryRun: options.dryRun,
  });

  console.log(`[prices:sync] dryRun=${options.dryRun}`);
  console.log("");
  console.log("Price sync summary");
  console.log("------------------");
  console.log(`perfumes read: ${stats.perfumesRead}`);
  console.log(`perfumes with offers: ${stats.perfumesWithOffers}`);
  console.log(`skipped without offers: ${stats.skippedWithoutOffers}`);
  console.log(`price ranges updated: ${stats.priceRangesUpdated}`);
  console.log(`best offers updated: ${stats.bestOffersUpdated}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("[prices:sync] failed:", error);
  process.exitCode = 1;
});

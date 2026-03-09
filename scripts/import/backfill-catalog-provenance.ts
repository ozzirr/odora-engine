import { CatalogStatus, DataQuality, PrismaClient, SourceType } from "@prisma/client";

type CliOptions = {
  dryRun: boolean;
};

function parseCliOptions(argv: string[]): CliOptions {
  return {
    dryRun: !argv.includes("--apply"),
  };
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const prisma = new PrismaClient();

  const totalPerfumes = await prisma.perfume.count();
  const missingSourceName = await prisma.perfume.count({
    where: {
      sourceName: null,
    },
  });
  const existingVerified = await prisma.perfume.count({
    where: {
      catalogStatus: CatalogStatus.VERIFIED,
    },
  });

  if (options.dryRun) {
    console.log("[backfill] dry run");
    console.log(`[backfill] total perfumes: ${totalPerfumes}`);
    console.log(`[backfill] rows with missing sourceName: ${missingSourceName}`);
    console.log(`[backfill] already verified: ${existingVerified}`);
    console.log("[backfill] run with --apply to execute update.");
    await prisma.$disconnect();
    return;
  }

  const result = await prisma.perfume.updateMany({
    where: {
      sourceName: null,
    },
    data: {
      catalogStatus: CatalogStatus.DEMO,
      sourceName: "Odora legacy demo dataset",
      sourceType: SourceType.INTERNAL_DEMO,
      sourceConfidence: 0.2,
      dataQuality: DataQuality.LOW,
    },
  });

  console.log("[backfill] completed");
  console.log(`[backfill] total perfumes: ${totalPerfumes}`);
  console.log(`[backfill] updated rows: ${result.count}`);
  console.log(`[backfill] already verified: ${existingVerified}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("[backfill] failed:", error);
  process.exitCode = 1;
});


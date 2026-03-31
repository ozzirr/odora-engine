import "dotenv/config";

import { PrismaClient } from "@prisma/client";

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

  const before = await Promise.all([
    prisma.brand.count(),
    prisma.note.count(),
    prisma.perfume.count(),
    prisma.perfumeNote.count(),
    prisma.perfumeMood.count(),
    prisma.perfumeSeason.count(),
    prisma.perfumeOccasion.count(),
    prisma.perfumeHomepagePlacement.count(),
    prisma.offer.count(),
  ]);

  const summary = {
    brands: before[0],
    notes: before[1],
    perfumes: before[2],
    perfumeNotes: before[3],
    perfumeMoods: before[4],
    perfumeSeasons: before[5],
    perfumeOccasions: before[6],
    homepagePlacements: before[7],
    offers: before[8],
  };

  if (options.dryRun) {
    console.log("[catalog:reset-db] dryRun=true");
    console.log(JSON.stringify(summary, null, 2));
    await prisma.$disconnect();
    return;
  }

  await prisma.offer.deleteMany();
  await prisma.perfumeHomepagePlacement.deleteMany();
  await prisma.perfumeOccasion.deleteMany();
  await prisma.perfumeSeason.deleteMany();
  await prisma.perfumeMood.deleteMany();
  await prisma.perfumeNote.deleteMany();
  await prisma.perfume.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.note.deleteMany();

  console.log("[catalog:reset-db] dryRun=false");
  console.log(JSON.stringify(summary, null, 2));

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("[catalog:reset-db] failed:", error);
  process.exitCode = 1;
});

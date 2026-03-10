import { PrismaClient } from "@prisma/client";

import { importPerfumeRecords } from "@/lib/perfume-data/import";
import { preparePerfumeRecords } from "@/lib/perfume-data/workflow";
import type { ImportMode, PerfumeDataSource } from "@/lib/perfume-data/types";

type CliOptions = {
  source: PerfumeDataSource;
  inputPath?: string;
  format: "auto" | "csv" | "json";
  limit?: number;
  dryRun: boolean;
  batchSize: number;
  mode: ImportMode;
};

function defaultInputPath(source: PerfumeDataSource) {
  return source === "verified" ? "data/verified/perfumes.csv" : "data/parfumo/perfumes.csv";
}

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    source: "verified",
    format: "auto",
    dryRun: false,
    batchSize: 100,
    mode: "upsert",
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg.startsWith("--source=")) {
      const value = arg.replace("--source=", "").toLowerCase();
      if (value === "verified" || value === "parfumo") {
        options.source = value;
      }
      continue;
    }

    if (arg.startsWith("--input=")) {
      options.inputPath = arg.replace("--input=", "");
      continue;
    }

    if (arg.startsWith("--format=")) {
      const value = arg.replace("--format=", "").toLowerCase();
      if (value === "auto" || value === "csv" || value === "json") {
        options.format = value;
      }
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const parsed = Number.parseInt(arg.replace("--limit=", ""), 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.limit = parsed;
      }
      continue;
    }

    if (arg.startsWith("--batch-size=")) {
      const parsed = Number.parseInt(arg.replace("--batch-size=", ""), 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.batchSize = parsed;
      }
      continue;
    }

    if (arg.startsWith("--mode=")) {
      const value = arg.replace("--mode=", "").toLowerCase();
      if (value === "upsert" || value === "notes") {
        options.mode = value;
      }
    }
  }

  return options;
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const prisma = new PrismaClient();
  const prepared = await preparePerfumeRecords({
    inputPath: options.inputPath ?? defaultInputPath(options.source),
    format: options.format,
    source: options.source,
    limit: options.limit,
  });

  console.log(
    `[perfumes:import] source=${options.source} mode=${options.mode} dryRun=${options.dryRun} input=${prepared.inputPath}`,
  );
  console.log(
    `[perfumes:import] format=${prepared.format} rows=${prepared.summary.rowsRead} valid=${prepared.summary.validRows} malformed=${prepared.summary.malformedRows} warnings=${prepared.summary.warnings}`,
  );

  const result = await importPerfumeRecords({
    prisma,
    records: prepared.normalizedRecords,
    rowsRead: prepared.summary.rowsRead,
    source: options.source,
    mode: options.mode,
    dryRun: options.dryRun,
    batchSize: options.batchSize,
    malformedRows: prepared.summary.malformedRows,
    invalidRows: prepared.summary.invalidRows,
    onBatchComplete: (batchIndex, totalBatches, processed, total) => {
      console.log(`[perfumes:import] batch ${batchIndex}/${totalBatches} completed (${processed}/${total})`);
    },
  });

  console.log("");
  console.log("Perfume import summary");
  console.log("----------------------");
  console.log(`rows read: ${prepared.summary.rowsRead}`);
  console.log(`valid rows: ${prepared.summary.validRows}`);
  console.log(`processed rows: ${result.stats.processedRows}`);
  console.log(`inserted brands: ${result.stats.insertedBrands}`);
  console.log(`inserted perfumes: ${result.stats.insertedPerfumes}`);
  console.log(`updated perfumes: ${result.stats.updatedPerfumes}`);
  console.log(`inserted notes: ${result.stats.insertedNotes}`);
  console.log(`inserted perfume-note relations: ${result.stats.insertedPerfumeNotes}`);
  console.log(`matched perfumes by slug: ${result.stats.matchedPerfumesBySlug}`);
  console.log(`matched perfumes by brand+name fallback: ${result.stats.matchedPerfumesByNameFallback}`);
  console.log(`missing perfume matches: ${result.stats.missingPerfumeMatches}`);
  console.log(`malformed rows: ${prepared.summary.malformedRows}`);
  console.log(`invalid rows: ${prepared.summary.invalidRows}`);
  console.log(`skipped rows: ${result.stats.skippedRows}`);

  if (prepared.malformedRows.length > 0) {
    console.log("");
    console.log("Malformed samples:");
    for (const line of prepared.malformedRows.slice(0, 10)) {
      console.log(`- ${line}`);
    }
  }

  const logLines = [...prepared.invalidLogs, ...result.invalidLogs].slice(0, 10);
  if (logLines.length > 0) {
    console.log("");
    console.log("Invalid samples:");
    for (const line of logLines) {
      console.log(`- ${line}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("[perfumes:import] failed:", error);
  process.exitCode = 1;
});

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { toCsv } from "@/lib/perfume-data/csv";
import { canonicalCatalogHeaders, toCatalogCsvRow } from "@/lib/perfume-data/normalize";
import { preparePerfumeRecords } from "@/lib/perfume-data/workflow";
import type { PerfumeDataSource } from "@/lib/perfume-data/types";

type CliOptions = {
  source: PerfumeDataSource;
  inputPath?: string;
  outputPath?: string;
  format: "auto" | "csv" | "json";
  limit?: number;
  dryRun: boolean;
};

function defaultInputPath(source: PerfumeDataSource) {
  return source === "verified" ? "data/verified/perfumes.csv" : "data/parfumo/perfumes.csv";
}

function defaultOutputPath(source: PerfumeDataSource, inputPath: string) {
  if (source === "verified") {
    return inputPath;
  }

  const parsed = path.parse(inputPath);
  return path.join(parsed.dir, `${parsed.name}.enriched.csv`);
}

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    source: "verified",
    format: "auto",
    dryRun: false,
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

    if (arg.startsWith("--output=")) {
      options.outputPath = arg.replace("--output=", "");
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
    }
  }

  return options;
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const inputPath = options.inputPath ?? defaultInputPath(options.source);
  const outputPath = options.outputPath ?? defaultOutputPath(options.source, inputPath);
  const prepared = await preparePerfumeRecords({
    inputPath,
    format: options.format,
    source: options.source,
    limit: options.limit,
  });

  console.log(
    `[perfumes:enrich] source=${options.source} dryRun=${options.dryRun} input=${prepared.inputPath} output=${path.resolve(process.cwd(), outputPath)}`,
  );
  console.log(
    `[perfumes:enrich] valid=${prepared.summary.validRows} invalid=${prepared.summary.invalidRows} malformed=${prepared.summary.malformedRows} warnings=${prepared.summary.warnings}`,
  );

  if (!options.dryRun) {
    const rows = prepared.normalizedRecords.map((record) => toCatalogCsvRow(record));
    const resolvedOutputPath = path.resolve(process.cwd(), outputPath);
    await mkdir(path.dirname(resolvedOutputPath), { recursive: true });
    await writeFile(resolvedOutputPath, toCsv([...canonicalCatalogHeaders], rows), "utf8");
  }

  if (prepared.validationIssues.length > 0) {
    console.log("");
    console.log("Issue samples:");
    for (const issue of prepared.validationIssues.slice(0, 10)) {
      console.log(`- row ${issue.sourceRow} [${issue.level}] ${issue.field}: ${issue.message}`);
    }
  }
}

main().catch((error) => {
  console.error("[perfumes:enrich] failed:", error);
  process.exitCode = 1;
});

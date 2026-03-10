import { preparePerfumeRecords } from "@/lib/perfume-data/workflow";
import type { PerfumeDataSource } from "@/lib/perfume-data/types";

type CliOptions = {
  source: PerfumeDataSource;
  inputPath?: string;
  format: "auto" | "csv" | "json";
  limit?: number;
};

function defaultInputPath(source: PerfumeDataSource) {
  return source === "verified" ? "data/verified/perfumes.csv" : "data/parfumo/perfumes.csv";
}

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    source: "verified",
    format: "auto",
  };

  for (const arg of argv) {
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
    }
  }

  return options;
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const prepared = await preparePerfumeRecords({
    inputPath: options.inputPath ?? defaultInputPath(options.source),
    format: options.format,
    source: options.source,
    limit: options.limit,
  });

  console.log(`[perfumes:verify] source=${options.source} input=${prepared.inputPath}`);
  console.log(`[perfumes:verify] format=${prepared.format}`);
  console.log("");
  console.log("Perfume verification summary");
  console.log("---------------------------");
  console.log(`rows read: ${prepared.summary.rowsRead}`);
  console.log(`valid rows: ${prepared.summary.validRows}`);
  console.log(`invalid rows: ${prepared.summary.invalidRows}`);
  console.log(`malformed rows: ${prepared.summary.malformedRows}`);
  console.log(`warnings: ${prepared.summary.warnings}`);
  console.log(`errors: ${prepared.summary.errors}`);

  if (prepared.validationIssues.length > 0) {
    console.log("");
    console.log("Issue samples:");
    for (const issue of prepared.validationIssues.slice(0, 15)) {
      console.log(`- row ${issue.sourceRow} [${issue.level}] ${issue.field}: ${issue.message}`);
    }
  }

  if (prepared.invalidLogs.length > 0 || prepared.malformedRows.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[perfumes:verify] failed:", error);
  process.exitCode = 1;
});

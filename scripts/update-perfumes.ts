import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  defaultEnrichInputPath,
  defaultEnrichedOutputPath,
  defaultEnrichmentReportPath,
} from "@/lib/perfume-data/paths";
import type { ImportMode, PerfumeDataSource } from "@/lib/perfume-data/types";

type CliOptions = {
  source: PerfumeDataSource;
  inputPath?: string;
  outputPath?: string;
  reportPath?: string;
  format?: "auto" | "csv" | "json";
  limit?: number;
  dryRun: boolean;
  batchSize?: number;
  mode?: ImportMode;
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    source: "verified",
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

    if (arg.startsWith("--report=")) {
      options.reportPath = arg.replace("--report=", "");
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

function buildVerifyArgs(options: CliOptions, inputPath: string) {
  const args = ["scripts/verify-perfumes.ts", `--source=${options.source}`, `--input=${inputPath}`];
  if (options.format) {
    args.push(`--format=${options.format}`);
  }
  if (options.limit) {
    args.push(`--limit=${options.limit}`);
  }
  return args;
}

function buildEnrichArgs(options: CliOptions, inputPath: string, outputPath: string, reportPath: string) {
  const args = [
    "scripts/enrich-perfumes.ts",
    `--source=${options.source}`,
    `--input=${inputPath}`,
    `--output=${outputPath}`,
    `--report=${reportPath}`,
  ];
  if (options.format) {
    args.push(`--format=${options.format}`);
  }
  if (options.limit) {
    args.push(`--limit=${options.limit}`);
  }
  return args;
}

function buildImportArgs(options: CliOptions, inputPath: string) {
  const args = [
    "scripts/import-perfumes.ts",
    `--source=${options.source}`,
    `--input=${inputPath}`,
    "--format=csv",
  ];
  if (options.batchSize) {
    args.push(`--batch-size=${options.batchSize}`);
  }
  if (options.mode) {
    args.push(`--mode=${options.mode}`);
  }
  if (options.dryRun) {
    args.push("--dry-run");
  }
  return args;
}

async function runStage(label: string, args: string[]) {
  console.log(`[perfumes:update] ${label}`);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, ["--import", "tsx", ...args], {
      cwd: repoRoot,
      env: process.env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Stage failed: ${label} (exit code ${code ?? "unknown"})`));
    });
  });
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const inputPath = options.inputPath ?? defaultEnrichInputPath(options.source);
  const outputPath = options.outputPath ?? defaultEnrichedOutputPath(options.source, inputPath);
  const reportPath = options.reportPath ?? defaultEnrichmentReportPath(options.source, inputPath);

  console.log(
    `[perfumes:update] source=${options.source} input=${inputPath} enriched=${outputPath} importMode=${options.mode ?? "upsert"} dryRun=${options.dryRun}`,
  );
  if (options.dryRun) {
    console.log(
      "[perfumes:update] dry-run runs verify and enrich only, regenerates files/reports, and skips the DB import step.",
    );
  }

  await runStage("verify", buildVerifyArgs(options, inputPath));
  await runStage("enrich", buildEnrichArgs(options, inputPath, outputPath, reportPath));
  if (options.dryRun) {
    console.log("[perfumes:update] import skipped because --dry-run was requested.");
    return;
  }

  await runStage("import", buildImportArgs(options, outputPath));
}

main().catch((error) => {
  console.error("[perfumes:update] failed:", error);
  process.exitCode = 1;
});

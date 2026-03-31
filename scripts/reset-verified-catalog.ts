import "dotenv/config";

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

type CliOptions = {
  batchSize: number;
  dryRun: boolean;
  rebuildHomepage: boolean;
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    batchSize: 200,
    dryRun: false,
    rebuildHomepage: false,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--rebuild-homepage") {
      options.rebuildHomepage = true;
      continue;
    }

    if (arg.startsWith("--batch-size=")) {
      const parsed = Number.parseInt(arg.replace("--batch-size=", ""), 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.batchSize = parsed;
      }
    }
  }

  return options;
}

async function runStage(label: string, args: string[]) {
  console.log(`[catalog:reset:verified] ${label}`);

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

  console.log(
    `[catalog:reset:verified] dryRun=${options.dryRun} batchSize=${options.batchSize} rebuildHomepage=${options.rebuildHomepage}`,
  );

  await runStage("verify + enrich verified catalog", [
    "scripts/update-perfumes.ts",
    "--source=verified",
    "--dry-run",
  ]);

  await runStage("backup offers", ["scripts/backup-offers.ts"]);

  if (options.dryRun) {
    await runStage("preview catalog reset", ["scripts/reset-catalog-db.ts", "--dry-run"]);
    await runStage("preview offers restore", ["scripts/restore-offers.ts", "--dry-run"]);
    console.log("[catalog:reset:verified] dry-run completed before DB deletion/import.");
    return;
  }

  await runStage("reset catalog tables", ["scripts/reset-catalog-db.ts"]);
  await runStage("import verified catalog", [
    "scripts/import-perfumes.ts",
    "--source=verified",
    "--format=csv",
    `--batch-size=${options.batchSize}`,
  ]);
  await runStage("restore offers", ["scripts/restore-offers.ts", "--replace-existing"]);

  if (options.rebuildHomepage) {
    await runStage("bootstrap homepage placements", ["scripts/homepage/bootstrap-content.ts"]);
  }
}

main().catch((error) => {
  console.error("[catalog:reset:verified] failed:", error);
  process.exitCode = 1;
});

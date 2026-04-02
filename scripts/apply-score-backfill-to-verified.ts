import { applyScoreBackfillToCatalog } from "@/lib/perfume-data/score-backfill";

type CliOptions = {
  inputPath?: string;
  outputPath?: string;
  reportPath?: string;
};

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {};

  for (const arg of argv) {
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
    }
  }

  return options;
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const result = await applyScoreBackfillToCatalog(options);

  console.log(
    `[perfumes:scores:sync] input=${result.inputPath} output=${result.outputPath} report=${result.reportPath} updatedRows=${result.updatedRows}`,
  );
}

main().catch((error) => {
  console.error("[perfumes:scores:sync] failed:", error);
  process.exitCode = 1;
});

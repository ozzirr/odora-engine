import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { toCsv } from "@/lib/perfume-data/csv";
import {
  defaultCleanedOutputPath,
  defaultEnrichInputPath,
  defaultEnrichedOutputPath,
  defaultEnrichmentReportPath,
  defaultReviewQueueCsvPath,
  defaultReviewQueueJsonPath,
  defaultValidationReportPath,
} from "@/lib/perfume-data/paths";
import { applyScoreBackfillToCatalog } from "@/lib/perfume-data/score-backfill";
import {
  enrichVerifiedPerfumes,
  enrichmentCatalogHeaders,
  reviewQueueCsvHeaders,
} from "@/lib/perfume-data/enrich";
import { canonicalCatalogHeaders, toCatalogCsvRow } from "@/lib/perfume-data/normalize";
import { preparePerfumeRecords } from "@/lib/perfume-data/workflow";
import type { PerfumeDataSource } from "@/lib/perfume-data/types";

type CliOptions = {
  source: PerfumeDataSource;
  inputPath?: string;
  outputPath?: string;
  reportPath?: string;
  format: "auto" | "csv" | "json";
  limit?: number;
  dryRun: boolean;
};

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
    }
  }

  return options;
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const inputPath = options.inputPath ?? defaultEnrichInputPath(options.source);
  const cleanedOutputPath = defaultCleanedOutputPath(options.source, inputPath);
  const validationReportPath = defaultValidationReportPath(options.source, inputPath);
  const outputPath = options.outputPath ?? defaultEnrichedOutputPath(options.source, inputPath);
  const reportPath = options.reportPath ?? defaultEnrichmentReportPath(options.source, inputPath);
  const reviewQueueJsonPath = defaultReviewQueueJsonPath(options.source, inputPath);
  const reviewQueueCsvPath = defaultReviewQueueCsvPath(options.source, inputPath);

  if (options.source === "verified") {
    const enriched = await enrichVerifiedPerfumes({
      inputPath,
      format: options.format,
      source: options.source,
      limit: options.limit,
    });

    console.log(
      `[perfumes:enrich] source=${options.source} dryRun=${options.dryRun} input=${enriched.prepared.inputPath} cleaned=${path.resolve(process.cwd(), cleanedOutputPath)} enriched=${path.resolve(process.cwd(), outputPath)} validation=${path.resolve(process.cwd(), validationReportPath)} report=${path.resolve(process.cwd(), reportPath)} reviewQueue=${path.resolve(process.cwd(), reviewQueueJsonPath)}`,
    );
    console.log(
      `[perfumes:enrich] valid=${enriched.prepared.summary.validRows} invalid=${enriched.prepared.summary.invalidRows} matched=${enriched.report.summary.totalMatched} lowConfidence=${enriched.report.summary.lowConfidenceMatches} ambiguous=${enriched.report.summary.ambiguousMatches} rowsEnriched=${enriched.report.summary.rowsEnriched} catalogFieldChanges=${enriched.report.summary.rowsWithCatalogFieldChanges}`,
    );

    if (!options.dryRun) {
      const cleanedRows = enriched.prepared.normalizedRecords.map((record) => toCatalogCsvRow(record));
      const resolvedCleanedOutputPath = path.resolve(process.cwd(), cleanedOutputPath);
      const resolvedValidationReportPath = path.resolve(process.cwd(), validationReportPath);
      const resolvedOutputPath = path.resolve(process.cwd(), outputPath);
      const resolvedReportPath = path.resolve(process.cwd(), reportPath);
      const resolvedReviewQueueJsonPath = path.resolve(process.cwd(), reviewQueueJsonPath);
      const resolvedReviewQueueCsvPath = path.resolve(process.cwd(), reviewQueueCsvPath);
      await mkdir(path.dirname(resolvedCleanedOutputPath), { recursive: true });
      await mkdir(path.dirname(resolvedValidationReportPath), { recursive: true });
      await mkdir(path.dirname(resolvedOutputPath), { recursive: true });
      await mkdir(path.dirname(resolvedReportPath), { recursive: true });
      await mkdir(path.dirname(resolvedReviewQueueJsonPath), { recursive: true });
      await mkdir(path.dirname(resolvedReviewQueueCsvPath), { recursive: true });
      await writeFile(resolvedCleanedOutputPath, toCsv([...canonicalCatalogHeaders], cleanedRows), "utf8");
      await writeFile(
        resolvedValidationReportPath,
        `${JSON.stringify(
          {
            summary: enriched.prepared.summary,
            issues: enriched.prepared.validationReportEntries,
          },
          null,
          2,
        )}\n`,
        "utf8",
      );
      await writeFile(resolvedOutputPath, toCsv([...enrichmentCatalogHeaders], enriched.rows), "utf8");
      await writeFile(resolvedReportPath, `${JSON.stringify(enriched.report, null, 2)}\n`, "utf8");
      await writeFile(
        resolvedReviewQueueJsonPath,
        `${JSON.stringify(
          {
            summary: {
              totalItems: enriched.reviewQueue.length,
            },
            items: enriched.reviewQueue,
          },
          null,
          2,
        )}\n`,
        "utf8",
      );
      await writeFile(
        resolvedReviewQueueCsvPath,
        toCsv([...reviewQueueCsvHeaders], enriched.reviewQueueCsvRows),
        "utf8",
      );
      const syncedScores = await applyScoreBackfillToCatalog({
        inputPath: outputPath,
        outputPath,
      });
      console.log(`[perfumes:enrich] scoreBackfill updatedRows=${syncedScores.updatedRows}`);

      const verifiedOutput = await preparePerfumeRecords({
        inputPath: outputPath,
        format: "csv",
        source: options.source,
      });
      console.log(
        `[perfumes:enrich] verify output valid=${verifiedOutput.summary.validRows} invalid=${verifiedOutput.summary.invalidRows} malformed=${verifiedOutput.summary.malformedRows}`,
      );
    }

    const sampleRows = enriched.report.rows.filter((row) => row.fieldsEnriched.length > 0).slice(0, 10);
    if (sampleRows.length > 0) {
      console.log("");
      console.log("Enrichment samples:");
      for (const row of sampleRows) {
        console.log(
          `- row ${row.rowIndex} ${row.brand} ${row.name}: ${row.fieldsEnriched.join(", ")} (${row.enrichmentStatus})`,
        );
      }
    }

    const reviewRows = enriched.report.rows
      .filter((row) => row.enrichmentStatus === "low_confidence" || row.enrichmentStatus === "ambiguous")
      .slice(0, 10);
    if (reviewRows.length > 0) {
      console.log("");
      console.log("Manual review samples:");
      for (const row of reviewRows) {
        console.log(
          `- row ${row.rowIndex} ${row.brand} ${row.name}: ${row.enrichmentStatus} ${row.matchedName ? `candidate=${row.matchedName}` : ""}`.trim(),
        );
      }
    }

    return;
  }

  const prepared = await preparePerfumeRecords({
    inputPath,
    format: options.format,
    source: options.source,
    limit: options.limit,
  });

  console.log(
    `[perfumes:enrich] source=${options.source} dryRun=${options.dryRun} input=${prepared.inputPath} output=${path.resolve(process.cwd(), outputPath)} report=${path.resolve(process.cwd(), reportPath)}`,
  );
  console.log(
    `[perfumes:enrich] valid=${prepared.summary.validRows} invalid=${prepared.summary.invalidRows} malformed=${prepared.summary.malformedRows} warnings=${prepared.summary.warnings} duplicateSlugs=${prepared.summary.duplicateSlugs} missingFields=${prepared.summary.missingFields}`,
  );

  if (!options.dryRun) {
    const rows = prepared.normalizedRecords.map((record) => toCatalogCsvRow(record));
    const resolvedOutputPath = path.resolve(process.cwd(), outputPath);
    const resolvedReportPath = path.resolve(process.cwd(), reportPath);
    await mkdir(path.dirname(resolvedOutputPath), { recursive: true });
    await mkdir(path.dirname(resolvedReportPath), { recursive: true });
    await writeFile(resolvedOutputPath, toCsv([...canonicalCatalogHeaders], rows), "utf8");
    await writeFile(
      resolvedReportPath,
      `${JSON.stringify(
        {
          summary: prepared.summary,
          issues: prepared.validationReportEntries,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
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

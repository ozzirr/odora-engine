import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { toCsv } from "@/lib/perfume-data/csv";
import {
  VERIFIED_ENRICHED_PATH,
  VERIFIED_SCORE_GAP_REPORT_PATH,
  VERIFIED_SCORE_WORKLIST_CSV_PATH,
} from "@/lib/perfume-data/paths";
import { loadPerfumeInput } from "@/lib/perfume-data/csv";
import { normalizeCsvHeader } from "@/lib/perfume-data/normalize";

type CliOptions = {
  inputPath: string;
  reportPath: string;
  worklistPath: string;
};

type ScoreWorklistRow = {
  row_index: string;
  brand: string;
  name: string;
  slug: string;
  longevity_score: string;
  sillage_score: string;
  versatility_score: string;
  matched_source: string;
  matched_url: string;
  matched_confidence: string;
  recommended_next_action: string;
  notes: string;
};

const worklistHeaders = [
  "row_index",
  "brand",
  "name",
  "slug",
  "longevity_score",
  "sillage_score",
  "versatility_score",
  "matched_source",
  "matched_url",
  "matched_confidence",
  "recommended_next_action",
  "notes",
] as const;

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    inputPath: VERIFIED_ENRICHED_PATH,
    reportPath: VERIFIED_SCORE_GAP_REPORT_PATH,
    worklistPath: VERIFIED_SCORE_WORKLIST_CSV_PATH,
  };

  for (const arg of argv) {
    if (arg.startsWith("--input=")) {
      options.inputPath = arg.replace("--input=", "");
      continue;
    }
    if (arg.startsWith("--report=")) {
      options.reportPath = arg.replace("--report=", "");
      continue;
    }
    if (arg.startsWith("--worklist=")) {
      options.worklistPath = arg.replace("--worklist=", "");
    }
  }

  return options;
}

function valueFromRecord(record: Record<string, unknown>, field: string) {
  const value = record[field];
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function recommendedNextAction(matchedSource: string) {
  if (matchedSource) {
    return "Add a trusted score-capable adapter for this source or curate these scores manually with provenance.";
  }

  return "Find a trusted score source before curating this perfume manually.";
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const loaded = await loadPerfumeInput({
    inputPath: options.inputPath,
    format: "csv",
    normalizeHeader: normalizeCsvHeader,
  });

  const worklistRows: ScoreWorklistRow[] = [];
  let missingLongevity = 0;
  let missingSillage = 0;
  let missingVersatility = 0;
  let rowsWithAllScores = 0;
  let rowsWithAnyScore = 0;
  let rowsWithMatchedSource = 0;

  for (const item of loaded.records) {
    const longevityScore = valueFromRecord(item.record, "longevityscore");
    const sillageScore = valueFromRecord(item.record, "sillagescore");
    const versatilityScore = valueFromRecord(item.record, "versatilityscore");
    const matchedSource = valueFromRecord(item.record, "matchedsource");
    const matchedUrl = valueFromRecord(item.record, "matchedurl");
    const matchedConfidence = valueFromRecord(item.record, "matchedconfidence");

    if (!longevityScore) {
      missingLongevity += 1;
    }
    if (!sillageScore) {
      missingSillage += 1;
    }
    if (!versatilityScore) {
      missingVersatility += 1;
    }

    if (matchedSource) {
      rowsWithMatchedSource += 1;
    }

    const hasAllScores = Boolean(longevityScore && sillageScore && versatilityScore);
    const hasAnyScore = Boolean(longevityScore || sillageScore || versatilityScore);

    if (hasAllScores) {
      rowsWithAllScores += 1;
      rowsWithAnyScore += 1;
      continue;
    }

    if (hasAnyScore) {
      rowsWithAnyScore += 1;
    }

    worklistRows.push({
      row_index: String(item.sourceRow),
      brand: valueFromRecord(item.record, "brand"),
      name: valueFromRecord(item.record, "name"),
      slug: valueFromRecord(item.record, "slug"),
      longevity_score: longevityScore,
      sillage_score: sillageScore,
      versatility_score: versatilityScore,
      matched_source: matchedSource,
      matched_url: matchedUrl,
      matched_confidence: matchedConfidence,
      recommended_next_action: recommendedNextAction(matchedSource),
      notes: matchedSource
        ? "Trusted match exists, but no implemented adapter currently provides score fields."
        : "No trusted score-capable source is connected to the pipeline yet.",
    });
  }

  const summary = {
    totalRows: loaded.records.length,
    rowsWithAllScores,
    rowsWithAnyScore,
    rowsMissingAnyScore: worklistRows.length,
    missingLongevity,
    missingSillage,
    missingVersatility,
    rowsWithMatchedSource,
    rowsWithoutMatchedSource: loaded.records.length - rowsWithMatchedSource,
    scoreSourceSupport: {
      implementedTrustedAdapters: [],
      plannedAdapters: ["fragrantica"],
      note: "No implemented trusted adapter currently emits longevity, sillage, or versatility scores.",
    },
  };

  const resolvedReportPath = path.resolve(process.cwd(), options.reportPath);
  const resolvedWorklistPath = path.resolve(process.cwd(), options.worklistPath);

  await mkdir(path.dirname(resolvedReportPath), { recursive: true });
  await mkdir(path.dirname(resolvedWorklistPath), { recursive: true });

  await writeFile(
    resolvedReportPath,
    `${JSON.stringify(
      {
        summary,
        rows: worklistRows,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  await writeFile(resolvedWorklistPath, toCsv([...worklistHeaders], worklistRows), "utf8");

  console.log(`[perfumes:scores:audit] input=${path.resolve(process.cwd(), options.inputPath)}`);
  console.log(
    `[perfumes:scores:audit] rows=${summary.totalRows} missingLongevity=${summary.missingLongevity} missingSillage=${summary.missingSillage} missingVersatility=${summary.missingVersatility} rowsMissingAnyScore=${summary.rowsMissingAnyScore}`,
  );
  console.log(
    `[perfumes:scores:audit] report=${resolvedReportPath} worklist=${resolvedWorklistPath}`,
  );
}

main().catch((error) => {
  console.error("[perfumes:scores:audit] failed:", error);
  process.exitCode = 1;
});

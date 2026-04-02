import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { parseCsvRows } from "@/lib/perfume-data/csv";
import { VERIFIED_ENRICHED_PATH } from "@/lib/perfume-data/paths";

type ScoreBackfillReportRow = {
  slug: string;
  proposedLongevity: {
    value: number;
  };
  proposedSillage: {
    value: number;
  };
  proposedVersatility: {
    value: number;
  };
};

export const VERIFIED_SCORE_BACKFILL_CSV_PATH = "data/generated/verified/perfume-score-db-backfill.csv";
export const VERIFIED_SCORE_BACKFILL_JSON_PATH = "data/generated/verified/perfume-score-db-backfill.json";

export async function applyScoreBackfillToCatalog(params?: {
  inputPath?: string;
  outputPath?: string;
  reportPath?: string;
}) {
  const inputPath = path.resolve(process.cwd(), params?.inputPath ?? VERIFIED_ENRICHED_PATH);
  const outputPath = path.resolve(process.cwd(), params?.outputPath ?? params?.inputPath ?? VERIFIED_ENRICHED_PATH);
  const reportPath = path.resolve(process.cwd(), params?.reportPath ?? VERIFIED_SCORE_BACKFILL_JSON_PATH);

  const [csvContent, reportContent] = await Promise.all([
    readFile(inputPath, "utf8"),
    readFile(reportPath, "utf8"),
  ]);

  const rows = parseCsvRows(csvContent);
  if (rows.length < 2) {
    throw new Error(`CSV has no data rows: ${inputPath}`);
  }

  const headers = rows[0];
  const slugIndex = headers.indexOf("slug");
  const longevityIndex = headers.indexOf("longevity_score");
  const sillageIndex = headers.indexOf("sillage_score");
  const versatilityIndex = headers.indexOf("versatility_score");

  if (slugIndex === -1 || longevityIndex === -1 || sillageIndex === -1 || versatilityIndex === -1) {
    throw new Error(`CSV is missing one or more score columns: ${inputPath}`);
  }

  const report = JSON.parse(reportContent) as {
    rows: ScoreBackfillReportRow[];
  };

  const scoreBySlug = new Map(
    report.rows.map((row) => [
      row.slug,
      {
        longevity: String(row.proposedLongevity.value),
        sillage: String(row.proposedSillage.value),
        versatility: String(row.proposedVersatility.value),
      },
    ]),
  );

  let updatedRows = 0;

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    const slug = row[slugIndex]?.trim();
    if (!slug) {
      continue;
    }

    const scores = scoreBySlug.get(slug);
    if (!scores) {
      continue;
    }

    row[longevityIndex] = scores.longevity;
    row[sillageIndex] = scores.sillage;
    row[versatilityIndex] = scores.versatility;
    updatedRows += 1;
  }

  const serialized = `${rows
    .map((row) =>
      row
        .map((cell) => {
          if (cell.includes("\"")) {
            return `"${cell.replace(/"/g, "\"\"")}"`;
          }
          if (cell.includes(",") || cell.includes("\n") || cell.includes("\r")) {
            return `"${cell}"`;
          }
          return cell;
        })
        .join(","),
    )
    .join("\n")}\n`;

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, serialized, "utf8");

  return {
    inputPath,
    outputPath,
    reportPath,
    updatedRows,
  };
}

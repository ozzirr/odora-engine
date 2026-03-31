import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

type CliOptions = {
  dryRun: boolean;
  skipDb: boolean;
  csvPaths: string[];
};

type RowObject = Record<string, string>;

type CsvRepairStats = {
  filePath: string;
  rows: number;
  changedRows: number;
  changedStoragePaths: number;
  changedUrls: number;
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..");
const rootEnvPath = path.join(repoRoot, ".env");

const DEFAULT_CSV_PATHS = [
  "data/verified/perfumes.csv",
  "data/archive/verified/images/approved-images-manifest.csv",
  "data/archive/verified/images/worklists/image-sourcing-worklist.csv",
  "data/archive/verified/images/worklists/image-source-suggestions.csv",
];

function parseCliOptions(argv: string[]): CliOptions {
  const csvPaths: string[] = [];
  let dryRun = false;
  let skipDb = false;

  for (const arg of argv) {
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--skip-db") {
      skipDb = true;
      continue;
    }

    if (arg.startsWith("--csv=")) {
      const csvPath = arg.replace("--csv=", "").trim();
      if (csvPath) {
        csvPaths.push(csvPath);
      }
    }
  }

  return {
    dryRun,
    skipDb,
    csvPaths: csvPaths.length > 0 ? csvPaths : DEFAULT_CSV_PATHS,
  };
}

function parseDotenvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const withoutExport = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
  const separatorIndex = withoutExport.indexOf("=");
  if (separatorIndex <= 0) {
    return null;
  }

  const key = withoutExport.slice(0, separatorIndex).trim();
  let value = withoutExport.slice(separatorIndex + 1).trim();
  if (!key) {
    return null;
  }

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  return [key, value];
}

async function loadRootDotenv() {
  try {
    await access(rootEnvPath);
  } catch {
    return;
  }

  const content = await readFile(rootEnvPath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const parsed = parseDotenvLine(line);
    if (!parsed) {
      continue;
    }

    const [key, value] = parsed;
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function cleanString(value: string | undefined): string {
  if (!value) {
    return "";
  }

  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeHeader(value: string): string {
  return cleanString(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function parseCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];

    if (char === '"') {
      if (inQuotes && content[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && content[index + 1] === "\n") {
        index += 1;
      }

      row.push(field);
      field = "";

      if (row.some((cell) => cleanString(cell).length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cleanString(cell).length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

function escapeCsvValue(value: string): string {
  if (value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  if (value.includes(",") || value.includes("\n") || value.includes("\r")) {
    return `"${value}"`;
  }
  return value;
}

function toCsv(headers: string[], rows: RowObject[]): string {
  const outputRows = [headers.join(",")];

  for (const row of rows) {
    const values = headers.map((header) => escapeCsvValue(row[header] ?? ""));
    outputRows.push(values.join(","));
  }

  return `${outputRows.join("\n")}\n`;
}

function normalizeStoragePath(value: string): string {
  return cleanString(value).replace(/^\/+/, "").replace(/^perfumes\//i, "");
}

function repairPublicUrl(value: string): string {
  return cleanString(value)
    .replace(/\/public\/perfumes\/perfumes\//g, "/public/perfumes/")
    .replace(/\/object\/public\/perfumes\/perfumes\//g, "/object/public/perfumes/");
}

async function repairCsv(filePath: string, dryRun: boolean): Promise<CsvRepairStats> {
  const resolvedPath = path.resolve(repoRoot, filePath);
  await access(resolvedPath);

  const content = await readFile(resolvedPath, "utf8");
  const parsed = parseCsvRows(content);

  if (parsed.length === 0) {
    return {
      filePath: resolvedPath,
      rows: 0,
      changedRows: 0,
      changedStoragePaths: 0,
      changedUrls: 0,
    };
  }

  const headers = parsed[0];
  const dataRows = parsed.slice(1);
  const headerNormalized = headers.map((header) => normalizeHeader(header));

  const rows: RowObject[] = dataRows.map((dataRow) => {
    const row: RowObject = {};
    for (let index = 0; index < headers.length; index += 1) {
      row[headers[index]] = dataRow[index] ?? "";
    }
    return row;
  });

  let changedRows = 0;
  let changedStoragePaths = 0;
  let changedUrls = 0;

  for (const row of rows) {
    let rowChanged = false;

    for (let index = 0; index < headers.length; index += 1) {
      const header = headers[index];
      const normalized = headerNormalized[index];
      const original = row[header] ?? "";
      let next = original;

      if (normalized === "imagestoragepath") {
        const repaired = normalizeStoragePath(original);
        if (repaired !== original) {
          next = repaired;
          changedStoragePaths += 1;
        }
      }

      const repairedUrl = repairPublicUrl(next);
      if (repairedUrl !== next) {
        next = repairedUrl;
        changedUrls += 1;
      }

      if (next !== original) {
        row[header] = next;
        rowChanged = true;
      }
    }

    if (rowChanged) {
      changedRows += 1;
    }
  }

  if (!dryRun && changedRows > 0) {
    await writeFile(resolvedPath, toCsv(headers, rows), "utf8");
  }

  return {
    filePath: resolvedPath,
    rows: rows.length,
    changedRows,
    changedStoragePaths,
    changedUrls,
  };
}

async function repairDb(dryRun: boolean): Promise<{ checked: number; updated: number; skipped: boolean }> {
  await loadRootDotenv();

  const databaseUrl = cleanString(process.env.DATABASE_URL);
  if (!databaseUrl) {
    return { checked: 0, updated: 0, skipped: true };
  }

  const prisma = new PrismaClient();

  try {
    const candidates = await prisma.perfume.findMany({
      where: {
        imageUrl: {
          contains: "/public/perfumes/perfumes/",
        },
      },
      select: {
        id: true,
        imageUrl: true,
      },
    });

    let updated = 0;

    for (const record of candidates) {
      const current = cleanString(record.imageUrl ?? "");
      const repaired = repairPublicUrl(current);

      if (!repaired || repaired === current) {
        continue;
      }

      if (!dryRun) {
        await prisma.perfume.update({
          where: {
            id: record.id,
          },
          data: {
            imageUrl: repaired,
          },
        });
      }

      updated += 1;
    }

    return {
      checked: candidates.length,
      updated,
      skipped: false,
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));

  console.log(`[images-repair] dryRun=${options.dryRun} skipDb=${options.skipDb}`);

  const csvStats: CsvRepairStats[] = [];

  for (const csvPath of options.csvPaths) {
    try {
      const stats = await repairCsv(csvPath, options.dryRun);
      csvStats.push(stats);
      console.log(
        `[csv] ${stats.filePath} rows=${stats.rows} changedRows=${stats.changedRows} changedStoragePaths=${stats.changedStoragePaths} changedUrls=${stats.changedUrls}`,
      );
    } catch (error) {
      console.log(`[csv] ${csvPath} skipped (${error instanceof Error ? error.message : "read error"})`);
    }
  }

  let dbResult = { checked: 0, updated: 0, skipped: true };

  if (!options.skipDb) {
    dbResult = await repairDb(options.dryRun);
    if (dbResult.skipped) {
      console.log("[db] skipped (DATABASE_URL missing)");
    } else {
      console.log(`[db] checked=${dbResult.checked} updated=${dbResult.updated}`);
    }
  } else {
    console.log("[db] skipped by --skip-db");
  }

  const csvChangedRows = csvStats.reduce((sum, item) => sum + item.changedRows, 0);
  const csvChangedStoragePaths = csvStats.reduce((sum, item) => sum + item.changedStoragePaths, 0);
  const csvChangedUrls = csvStats.reduce((sum, item) => sum + item.changedUrls, 0);

  console.log("\nRepair summary");
  console.log("--------------");
  console.log(`csv files processed: ${csvStats.length}`);
  console.log(`csv changed rows: ${csvChangedRows}`);
  console.log(`csv storage path fixes: ${csvChangedStoragePaths}`);
  console.log(`csv public url fixes: ${csvChangedUrls}`);
  console.log(`db rows fixed: ${dbResult.updated}`);
}

main().catch((error) => {
  console.error("[images-repair] failed:", error);
  process.exitCode = 1;
});

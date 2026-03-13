import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { cleanString, normalizeCsvHeader } from "./lib/normalize";
import { slugify } from "./lib/slug";

type CliOptions = {
  inputPath: string;
  worklistCsvPath: string;
  worklistJsonPath: string;
  status?: string;
  limit?: number;
  missingImagesOnly: boolean;
};

type RowObject = Record<string, string>;

type WorklistRow = {
  brand: string;
  name: string;
  slug: string;
  official_source_url: string;
  image_source_url: string;
  image_storage_path: string;
  image_public_url: string;
  catalog_status: string;
  data_quality: string;
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..");

const DEFAULT_INPUT_PATH = "data/verified/perfumes.csv";
const DEFAULT_WORKLIST_CSV_PATH = "data/archive/verified/images/worklists/image-sourcing-worklist.csv";
const DEFAULT_WORKLIST_JSON_PATH = "data/archive/verified/images/worklists/image-sourcing-worklist.json";

const WORKLIST_FIELDS: Array<keyof WorklistRow> = [
  "brand",
  "name",
  "slug",
  "official_source_url",
  "image_source_url",
  "image_storage_path",
  "image_public_url",
  "catalog_status",
  "data_quality",
];

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    inputPath: DEFAULT_INPUT_PATH,
    worklistCsvPath: DEFAULT_WORKLIST_CSV_PATH,
    worklistJsonPath: DEFAULT_WORKLIST_JSON_PATH,
    missingImagesOnly: false,
  };

  for (const arg of argv) {
    if (arg.startsWith("--input=")) {
      options.inputPath = arg.replace("--input=", "");
      continue;
    }

    if (arg.startsWith("--status=")) {
      const status = cleanString(arg.replace("--status=", ""));
      if (status) {
        options.status = status.toUpperCase();
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

    if (arg === "--missing-images-only") {
      options.missingImagesOnly = true;
      continue;
    }

    if (arg.startsWith("--output-csv=")) {
      options.worklistCsvPath = arg.replace("--output-csv=", "");
      continue;
    }

    if (arg.startsWith("--output-json=")) {
      options.worklistJsonPath = arg.replace("--output-json=", "");
    }
  }

  return options;
}

function parseCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];

    if (char === "\"") {
      if (inQuotes && content[index + 1] === "\"") {
        field += "\"";
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
  if (value.includes("\"")) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  if (value.includes(",") || value.includes("\n") || value.includes("\r")) {
    return `"${value}"`;
  }
  return value;
}

function toCsv(headers: string[], rows: RowObject[]): string {
  const lines = [headers.join(",")];
  for (const row of rows) {
    const values = headers.map((header) => escapeCsvValue(row[header] ?? ""));
    lines.push(values.join(","));
  }
  return `${lines.join("\n")}\n`;
}

function toWorklistCsv(rows: WorklistRow[]): string {
  const headers = WORKLIST_FIELDS;
  const lines = [headers.join(",")];

  for (const row of rows) {
    const values = headers.map((header) => escapeCsvValue(row[header] ?? ""));
    lines.push(values.join(","));
  }

  return `${lines.join("\n")}\n`;
}

function buildStoragePath(brand: string, perfumeSlug: string) {
  const brandSlug = slugify(brand);
  return `${brandSlug}/${perfumeSlug}.jpg`;
}

function normalizeStoragePath(storagePath: string) {
  return cleanString(storagePath).replace(/^\/+/, "").replace(/^perfumes\//i, "");
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));

  const inputPath = path.resolve(repoRoot, options.inputPath);
  const worklistCsvPath = path.resolve(repoRoot, options.worklistCsvPath);
  const worklistJsonPath = path.resolve(repoRoot, options.worklistJsonPath);

  const content = await readFile(inputPath, "utf8");
  const rows = parseCsvRows(content);

  if (rows.length === 0) {
    throw new Error(`Input CSV is empty: ${inputPath}`);
  }

  const originalHeaders = rows[0];
  const headers: string[] = [];
  const normalizedToHeader = new Map<string, string>();
  const normalizedToIndex = new Map<string, number>();
  const sourceRows = rows.slice(1);

  for (let index = 0; index < originalHeaders.length; index += 1) {
    const header = originalHeaders[index];
    const normalized = normalizeCsvHeader(header);
    if (!normalized || normalizedToHeader.has(normalized)) {
      continue;
    }

    headers.push(header);
    normalizedToHeader.set(normalized, header);
    normalizedToIndex.set(normalized, index);
  }

  const requiredColumns = [
    "brand",
    "name",
    "catalog_status",
    "data_quality",
    "official_source_url",
    "image_source_url",
    "image_storage_path",
    "image_public_url",
  ];

  for (const required of requiredColumns) {
    const normalizedRequired = normalizeCsvHeader(required);
    if (!normalizedToHeader.has(normalizedRequired)) {
      headers.push(required);
      normalizedToHeader.set(normalizedRequired, required);
      normalizedToIndex.set(normalizedRequired, -1);
    }
  }

  const brandHeader = normalizedToHeader.get("brand") ?? "brand";
  const nameHeader = normalizedToHeader.get("name") ?? "name";
  const slugHeader = normalizedToHeader.get("slug");
  const statusHeader = normalizedToHeader.get("catalogstatus") ?? "catalog_status";
  const dataQualityHeader = normalizedToHeader.get("dataquality") ?? "data_quality";
  const officialSourceUrlHeader = normalizedToHeader.get("officialsourceurl") ?? "official_source_url";
  const imageSourceUrlHeader = normalizedToHeader.get("imagesourceurl") ?? "image_source_url";
  const imageStoragePathHeader = normalizedToHeader.get("imagestoragepath") ?? "image_storage_path";
  const imagePublicUrlHeader = normalizedToHeader.get("imagepublicurl") ?? "image_public_url";

  const mappedRows: RowObject[] = sourceRows.map((row) => {
    const mapped: RowObject = {};
    for (const header of headers) {
      const normalized = normalizeCsvHeader(header);
      const sourceIndex = normalizedToIndex.get(normalized) ?? -1;
      mapped[header] = sourceIndex >= 0 ? (row[sourceIndex] ?? "") : "";
    }
    return mapped;
  });

  let rowsWithAutoStoragePath = 0;
  let skippedByStatus = 0;
  let skippedByMissingOnly = 0;
  const worklistRows: WorklistRow[] = [];

  for (const row of mappedRows) {
    const brand = cleanString(row[brandHeader]);
    const name = cleanString(row[nameHeader]);
    const existingSlug = slugHeader ? cleanString(row[slugHeader]) : "";
    const status = cleanString(row[statusHeader]).toUpperCase();
    const dataQuality = cleanString(row[dataQualityHeader]);
    const officialSourceUrl = cleanString(row[officialSourceUrlHeader]);
    const imageSourceUrl = cleanString(row[imageSourceUrlHeader]);
    const imagePublicUrl = cleanString(row[imagePublicUrlHeader]);

    if (!brand || !name) {
      continue;
    }

    const perfumeSlug = existingSlug || slugify(`${brand}-${name}`);

    const normalizedStoragePath = normalizeStoragePath(row[imageStoragePathHeader]);

    if (!normalizedStoragePath) {
      row[imageStoragePathHeader] = buildStoragePath(brand, perfumeSlug);
      rowsWithAutoStoragePath += 1;
    } else if (normalizedStoragePath !== cleanString(row[imageStoragePathHeader])) {
      row[imageStoragePathHeader] = normalizedStoragePath;
    }

    if (options.status && status !== options.status) {
      skippedByStatus += 1;
      continue;
    }

    if (options.missingImagesOnly && imageSourceUrl.length > 0) {
      skippedByMissingOnly += 1;
      continue;
    }

    worklistRows.push({
      brand,
      name,
      slug: perfumeSlug,
      official_source_url: officialSourceUrl,
      image_source_url: imageSourceUrl,
      image_storage_path: cleanString(row[imageStoragePathHeader]),
      image_public_url: imagePublicUrl,
      catalog_status: status,
      data_quality: dataQuality,
    });
  }

  const limitedWorklist = options.limit ? worklistRows.slice(0, options.limit) : worklistRows;

  await mkdir(path.dirname(worklistCsvPath), { recursive: true });
  await mkdir(path.dirname(worklistJsonPath), { recursive: true });

  await writeFile(inputPath, toCsv(headers, mappedRows), "utf8");
  await writeFile(worklistCsvPath, toWorklistCsv(limitedWorklist), "utf8");
  await writeFile(worklistJsonPath, `${JSON.stringify(limitedWorklist, null, 2)}\n`, "utf8");

  console.log(`[images-worklist] source updated: ${inputPath}`);
  console.log(`[images-worklist] worklist csv: ${worklistCsvPath}`);
  console.log(`[images-worklist] worklist json: ${worklistJsonPath}`);
  console.log("[images-worklist] summary:");
  console.log(`- total source rows: ${mappedRows.length}`);
  console.log(`- rows with auto-filled image_storage_path: ${rowsWithAutoStoragePath}`);
  console.log(`- skipped by status filter: ${skippedByStatus}`);
  console.log(`- skipped by missing-images-only filter: ${skippedByMissingOnly}`);
  console.log(`- worklist rows generated: ${limitedWorklist.length}`);
}

main().catch((error) => {
  console.error("[images-worklist] failed:", error);
  process.exitCode = 1;
});

import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { CatalogStatus, PrismaClient } from "@prisma/client";

import { cleanString, normalizeCsvHeader } from "./lib/normalize";
import { slugify } from "./lib/slug";

type CliOptions = {
  limit: number;
  status: "VERIFIED" | "IMPORTED_UNVERIFIED" | "all";
  batchSize: number;
  sleepMs: number;
  dryRun: boolean;
  force: boolean;
  manifestPath: string;
};

type RowObject = Record<string, string>;

type PipelineManifestRow = {
  brand: string;
  name: string;
  slug: string;
  local_image_path: string;
  approved_image_url: string;
  image_storage_path: string;
};

type SelectedPerfume = {
  brand: string;
  name: string;
  slug: string;
  brandSlug: string;
};

type ScriptRunResult = {
  code: number;
  output: string;
};

const DEFAULT_LIMIT = 2000;
const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_SLEEP_MS = 1500;
const DEFAULT_MANIFEST_PATH = "data/verified/approved-images-manifest.csv";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..");
const rootEnvPath = path.join(repoRoot, ".env");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    limit: DEFAULT_LIMIT,
    status: "all",
    batchSize: DEFAULT_BATCH_SIZE,
    sleepMs: DEFAULT_SLEEP_MS,
    dryRun: false,
    force: false,
    manifestPath: DEFAULT_MANIFEST_PATH,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--force") {
      options.force = true;
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

    if (arg.startsWith("--sleep-ms=")) {
      const parsed = Number.parseInt(arg.replace("--sleep-ms=", ""), 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        options.sleepMs = parsed;
      }
      continue;
    }

    if (arg.startsWith("--status=")) {
      const raw = cleanString(arg.replace("--status=", "")).toUpperCase();
      if (raw === "VERIFIED" || raw === "IMPORTED_UNVERIFIED") {
        options.status = raw;
      } else {
        options.status = "all";
      }
      continue;
    }

    if (arg.startsWith("--manifest=")) {
      const value = cleanString(arg.replace("--manifest=", ""));
      if (value) {
        options.manifestPath = value;
      }
    }
  }

  return options;
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
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvValue(row[header] ?? "")).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function normalizeStoragePath(storagePath: string) {
  return cleanString(storagePath).replace(/^\/+/, "").replace(/^perfumes\//i, "");
}

function parseManifestRows(headers: string[], rows: string[][]): PipelineManifestRow[] {
  const headerIndex = new Map<string, number>();
  for (let i = 0; i < headers.length; i += 1) {
    const normalized = normalizeCsvHeader(headers[i]);
    if (!normalized || headerIndex.has(normalized)) {
      continue;
    }
    headerIndex.set(normalized, i);
  }

  const getValue = (row: string[], keys: string[]) => {
    for (const key of keys) {
      const index = headerIndex.get(normalizeCsvHeader(key));
      if (index === undefined) {
        continue;
      }
      const value = cleanString(row[index] ?? "");
      if (value) {
        return value;
      }
    }
    return "";
  };

  return rows
    .map((row) => {
      const brand = getValue(row, ["brand"]);
      const name = getValue(row, ["name"]);
      const slug = getValue(row, ["slug"]);
      if (!brand || !name || !slug) {
        return null;
      }

      return {
        brand,
        name,
        slug,
        local_image_path: getValue(row, ["local_image_path", "localimagepath"]) || `approved-images/${slug}.jpg`,
        approved_image_url: getValue(row, ["approved_image_url", "approvedimageurl"]),
        image_storage_path:
          normalizeStoragePath(getValue(row, ["image_storage_path", "imagestoragepath"])) ||
          `${slugify(brand)}/${slug}.jpg`,
      };
    })
    .filter((item): item is PipelineManifestRow => item !== null);
}

function parseNumericLine(output: string, label: string): number {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = output.match(new RegExp(`${escaped}:\\s*(\\d+)`, "i"));
  if (!match) {
    return 0;
  }

  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function runTsxScript(scriptRelativePath: string, args: string[]): Promise<ScriptRunResult> {
  const tsxBin = path.resolve(repoRoot, "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");

  const chunks: string[] = [];

  await new Promise<void>((resolve, reject) => {
    const child = spawn(tsxBin, [scriptRelativePath, ...args], {
      cwd: repoRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      process.stdout.write(text);
      chunks.push(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      process.stderr.write(text);
      chunks.push(text);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script failed (${scriptRelativePath}) with exit code ${code ?? "unknown"}`));
      }
    });
  });

  return {
    code: 0,
    output: chunks.join(""),
  };
}

async function getSelectedPerfumes(params: {
  status: CliOptions["status"];
  limit: number;
}): Promise<SelectedPerfume[]> {
  const prisma = new PrismaClient();

  try {
    const statusWhere =
      params.status === "VERIFIED"
        ? { catalogStatus: CatalogStatus.VERIFIED }
        : params.status === "IMPORTED_UNVERIFIED"
          ? { catalogStatus: CatalogStatus.IMPORTED_UNVERIFIED }
          : undefined;

    const perfumes = await prisma.perfume.findMany({
      where: {
        AND: [
          {
            OR: [{ imageUrl: null }, { imageUrl: "" }],
          },
          ...(statusWhere ? [statusWhere] : []),
        ],
      },
      include: {
        brand: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
      take: params.limit,
    });

    return perfumes.map((perfume) => ({
      brand: cleanString(perfume.brand.name),
      name: cleanString(perfume.name),
      slug: cleanString(perfume.slug),
      brandSlug: cleanString(perfume.brand.slug) || slugify(perfume.brand.name),
    }));
  } finally {
    await prisma.$disconnect();
  }
}

function buildManifestRowFromPerfume(perfume: SelectedPerfume): PipelineManifestRow {
  return {
    brand: perfume.brand,
    name: perfume.name,
    slug: perfume.slug,
    local_image_path: `approved-images/${perfume.slug}.jpg`,
    approved_image_url: "",
    image_storage_path: `${perfume.brandSlug}/${perfume.slug}.jpg`,
  };
}

function chunkArray<T>(items: T[], batchSize: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += batchSize) {
    chunks.push(items.slice(index, index + batchSize));
  }

  return chunks;
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  await loadRootDotenv();

  if (!options.dryRun) {
    const requiredEnv = ["BRAVE_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_STORAGE_BUCKET"];
    const missing = requiredEnv.filter((key) => !cleanString(process.env[key]));
    if (missing.length > 0) {
      throw new Error(`Missing required env vars: ${missing.join(", ")}`);
    }
  }

  const manifestPath = path.resolve(repoRoot, options.manifestPath);

  console.log("[overnight] starting pipeline");
  console.log(`[overnight] limit=${options.limit} status=${options.status} batchSize=${options.batchSize} sleepMs=${options.sleepMs} dryRun=${options.dryRun} force=${options.force}`);

  const step1Args = [
    `--limit=${options.limit}`,
    `--status=${options.status}`,
    `--manifest=${options.manifestPath}`,
    ...(options.dryRun ? ["--dry-run"] : []),
  ];

  const manifestResult = await runTsxScript("scripts/import/generate-missing-images-manifest-from-db.ts", step1Args);

  const perfumesSelectedFromStep1 = parseNumericLine(manifestResult.output, "[manifest-from-db] perfumes selected");
  const manifestRowsAdded = parseNumericLine(manifestResult.output, "[manifest-from-db] manifest rows added");

  const selectedPerfumes = await getSelectedPerfumes({
    status: options.status,
    limit: options.limit,
  });

  let manifestRows: PipelineManifestRow[] = [];
  try {
    await access(manifestPath);
    const manifestContent = await readFile(manifestPath, "utf8");
    const parsed = parseCsvRows(manifestContent);
    if (parsed.length > 0) {
      manifestRows = parseManifestRows(parsed[0], parsed.slice(1));
    }
  } catch {
    manifestRows = [];
  }

  const manifestBySlug = new Map(manifestRows.map((row) => [row.slug, row]));
  const rowsToProcess = selectedPerfumes.map((perfume) => manifestBySlug.get(perfume.slug) ?? buildManifestRowFromPerfume(perfume));

  const batches = chunkArray(rowsToProcess, options.batchSize);
  const totalBatches = batches.length;

  let braveDownloaded = 0;
  let uploadCount = 0;
  let dbUpdatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  const tmpBaseDir = path.resolve(repoRoot, ".tmp", "overnight-image-pipeline");
  await mkdir(tmpBaseDir, { recursive: true });

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex += 1) {
    const batchNumber = batchIndex + 1;
    const batchRows = batches[batchIndex];

    const batchDir = path.join(tmpBaseDir, `batch-${String(batchNumber).padStart(4, "0")}`);
    await mkdir(batchDir, { recursive: true });

    const batchManifestPath = path.join(batchDir, "manifest.csv");
    const batchCatalogPath = path.join(batchDir, "catalog.csv");

    const manifestHeaders = [
      "brand",
      "name",
      "slug",
      "local_image_path",
      "approved_image_url",
      "image_storage_path",
    ];

    const manifestRowsForCsv: RowObject[] = batchRows.map((row) => ({ ...row }));
    await writeFile(batchManifestPath, toCsv(manifestHeaders, manifestRowsForCsv), "utf8");

    const catalogHeaders = [
      "brand",
      "name",
      "slug",
      "image_source_url",
      "image_storage_path",
      "image_public_url",
      "imageUrl",
    ];

    const catalogRowsForCsv: RowObject[] = batchRows.map((row) => ({
      brand: row.brand,
      name: row.name,
      slug: row.slug,
      image_source_url: row.approved_image_url,
      image_storage_path: row.image_storage_path,
      image_public_url: "",
      imageUrl: "",
    }));

    await writeFile(batchCatalogPath, toCsv(catalogHeaders, catalogRowsForCsv), "utf8");

    console.log(`\n[overnight] batch ${batchNumber}/${totalBatches} start (rows=${batchRows.length})`);

    const fetchArgs = [
      `--manifest=${path.relative(repoRoot, batchManifestPath)}`,
      `--limit=${batchRows.length}`,
      ...(options.force ? ["--force"] : []),
      ...(options.dryRun ? ["--dry-run"] : []),
    ];

    const fetchResult = await runTsxScript("scripts/import/fetch-images-from-brave.ts", fetchArgs);

    const batchDownloaded = parseNumericLine(fetchResult.output, "downloaded");
    const batchFetchSkippedExisting = parseNumericLine(fetchResult.output, "skipped existing");
    const batchFetchSkippedMissing = parseNumericLine(fetchResult.output, "skipped missing data");
    const batchFetchFailedSearch = parseNumericLine(fetchResult.output, "failed search");
    const batchFetchFailedDownload = parseNumericLine(fetchResult.output, "failed download");

    braveDownloaded += batchDownloaded;

    const bulkArgs = [
      `--manifest=${path.relative(repoRoot, batchManifestPath)}`,
      `--catalog=${path.relative(repoRoot, batchCatalogPath)}`,
      `--limit=${batchRows.length}`,
      "--update-db",
      ...(options.force ? ["--force"] : []),
      ...(options.dryRun ? ["--dry-run"] : []),
      "--diagnostic",
    ];

    const bulkResult = await runTsxScript("scripts/import/bulk-upload-approved-images.ts", bulkArgs);

    const batchUploaded = parseNumericLine(bulkResult.output, "uploaded");
    const batchBulkSkipped = parseNumericLine(bulkResult.output, "skipped");
    const batchBulkFailed = parseNumericLine(bulkResult.output, "failed");
    const batchDbUpdated = parseNumericLine(bulkResult.output, "updated DB rows");
    const batchDbSkippedExisting = parseNumericLine(bulkResult.output, "skipped DB rows (existing imageUrl)");

    uploadCount += batchUploaded;
    dbUpdatedCount += batchDbUpdated;

    skippedCount +=
      batchFetchSkippedExisting + batchFetchSkippedMissing + batchBulkSkipped + batchDbSkippedExisting;
    failedCount += batchFetchFailedSearch + batchFetchFailedDownload + batchBulkFailed;

    console.log(
      `[overnight] batch ${batchNumber}/${totalBatches} done | downloaded=${batchDownloaded} uploaded=${batchUploaded} dbUpdated=${batchDbUpdated} skipped=${batchFetchSkippedExisting + batchFetchSkippedMissing + batchBulkSkipped + batchDbSkippedExisting} failed=${batchFetchFailedSearch + batchFetchFailedDownload + batchBulkFailed}`,
    );

    if (batchNumber < totalBatches && options.sleepMs > 0) {
      await sleep(options.sleepMs);
    }
  }

  if (!options.dryRun) {
    await rm(tmpBaseDir, { recursive: true, force: true });
  }

  console.log("\nOvernight image pipeline summary");
  console.log("-------------------------------");
  console.log(`perfumes selected: ${selectedPerfumes.length || perfumesSelectedFromStep1}`);
  console.log(`manifest rows added: ${manifestRowsAdded}`);
  console.log(`Brave images downloaded: ${braveDownloaded}`);
  console.log(`upload count: ${uploadCount}`);
  console.log(`DB updated count: ${dbUpdatedCount}`);
  console.log(`skipped count: ${skippedCount}`);
  console.log(`failed count: ${failedCount}`);
  console.log(`batches processed: ${totalBatches}`);
}

main().catch((error) => {
  console.error("[overnight] failed:", error);
  process.exitCode = 1;
});

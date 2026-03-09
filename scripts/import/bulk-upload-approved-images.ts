import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { cleanString, normalizeCsvHeader } from "./lib/normalize";
import { slugify } from "./lib/slug";

type CliOptions = {
  manifestPath: string;
  catalogPath: string;
  dryRun: boolean;
  force: boolean;
  limit?: number;
  updateDb: boolean;
};

type RowObject = Record<string, string>;

type ManifestEntry = {
  rowNumber: number;
  brand: string;
  name: string;
  slug: string;
  localImagePath: string;
  approvedImageUrl: string;
  imageStoragePath: string;
};

type CatalogIndex = {
  row: RowObject;
  rowNumber: number;
  slug: string;
  brandNameKey: string;
};

type Stats = {
  manifestRowsRead: number;
  processed: number;
  uploaded: number;
  skipped: number;
  failed: number;
  updatedCsvRows: number;
  updatedDbRows: number;
};

const DEFAULT_MANIFEST_PATH = "data/verified/approved-images-manifest.csv";
const DEFAULT_CATALOG_PATH = "data/verified/perfumes.csv";
const DEFAULT_BUCKET = "perfumes";
const REQUEST_TIMEOUT_MS = 20_000;
const RETRY_COUNT = 3;
const RETRY_DELAY_MS = 1_100;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..");
const rootEnvPath = path.join(repoRoot, ".env");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    manifestPath: DEFAULT_MANIFEST_PATH,
    catalogPath: DEFAULT_CATALOG_PATH,
    dryRun: false,
    force: false,
    updateDb: false,
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

    if (arg === "--update-db") {
      options.updateDb = true;
      continue;
    }

    if (arg.startsWith("--manifest=")) {
      options.manifestPath = arg.replace("--manifest=", "");
      continue;
    }

    if (arg.startsWith("--catalog=")) {
      options.catalogPath = arg.replace("--catalog=", "");
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const parsed = Number.parseInt(arg.replace("--limit=", ""), 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.limit = parsed;
      }
      continue;
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
  const outputRows = [headers.join(",")];
  for (const row of rows) {
    const values = headers.map((header) => escapeCsvValue(row[header] ?? ""));
    outputRows.push(values.join(","));
  }
  return `${outputRows.join("\n")}\n`;
}

function getHeaderMap(headers: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const header of headers) {
    const key = normalizeCsvHeader(header);
    if (!key || map.has(key)) {
      continue;
    }
    map.set(key, header);
  }
  return map;
}

function ensureHeaders(headers: string[], required: string[]): string[] {
  const next = [...headers];
  const map = getHeaderMap(next);

  for (const col of required) {
    const key = normalizeCsvHeader(col);
    if (!map.has(key)) {
      next.push(col);
      map.set(key, col);
    }
  }

  return next;
}

function getField(row: RowObject, headerMap: Map<string, string>, aliases: string[]): string {
  for (const alias of aliases) {
    const key = normalizeCsvHeader(alias);
    const header = headerMap.get(key);
    if (!header) {
      continue;
    }

    const value = cleanString(row[header]);
    if (value) {
      return value;
    }
  }

  return "";
}

function setField(row: RowObject, headerMap: Map<string, string>, name: string, value: string) {
  const key = normalizeCsvHeader(name);
  const header = headerMap.get(key) ?? name;
  row[header] = value;
}

function normalizedBrandNameKey(brand: string, name: string): string {
  return `${slugify(brand)}::${slugify(name)}`;
}

function normalizeStoragePath(storagePath: string): string {
  return cleanString(storagePath).replace(/^\/+/, "").replace(/^perfumes\//i, "");
}

function inferSlug(row: RowObject, headerMap: Map<string, string>): string {
  const explicitSlug = getField(row, headerMap, ["slug", "perfume_slug", "perfumeslug"]);
  if (explicitSlug) {
    return explicitSlug;
  }

  const storagePath = normalizeStoragePath(getField(row, headerMap, ["image_storage_path", "imagestoragepath"]));
  if (storagePath) {
    const fileName = storagePath.split("/").pop() ?? "";
    if (fileName) {
      return fileName.replace(/\.[a-z0-9]+$/i, "");
    }
  }

  const brand = getField(row, headerMap, ["brand"]);
  const name = getField(row, headerMap, ["name", "perfume_name", "perfume"]);
  return slugify(`${brand}-${name}`);
}

function inferStoragePath(brand: string, slug: string): string {
  return `${slugify(brand)}/${slug}.jpg`;
}

function encodeStoragePath(storagePath: string): string {
  return normalizeStoragePath(storagePath)
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildPublicUrl(supabaseUrl: string, bucket: string, storagePath: string): string {
  const encoded = encodeStoragePath(storagePath);
  const base = supabaseUrl.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encoded}`;
}

function contentTypeFromPath(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png")) {
    return "image/png";
  }
  if (lower.endsWith(".webp")) {
    return "image/webp";
  }
  if (lower.endsWith(".gif")) {
    return "image/gif";
  }
  if (lower.endsWith(".avif")) {
    return "image/avif";
  }
  if (lower.endsWith(".svg")) {
    return "image/svg+xml";
  }
  return "image/jpeg";
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function makeAbortSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

async function uploadToStorageWithRetry(params: {
  supabaseUrl: string;
  serviceRoleKey: string;
  bucket: string;
  storagePath: string;
  contentType: string;
  buffer: Buffer;
  force: boolean;
}): Promise<"uploaded" | "exists"> {
  const encodedPath = encodeStoragePath(params.storagePath);
  const endpoint = `${params.supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/${encodeURIComponent(
    params.bucket,
  )}/${encodedPath}`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= RETRY_COUNT; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.serviceRoleKey}`,
          apikey: params.serviceRoleKey,
          "Content-Type": params.contentType,
          "x-upsert": params.force ? "true" : "false",
        },
        body: new Uint8Array(params.buffer),
        signal: makeAbortSignal(REQUEST_TIMEOUT_MS),
      });

      if (response.ok) {
        return "uploaded";
      }

      const bodyText = cleanString(await response.text());
      const lowerBody = bodyText.toLowerCase();

      if (!params.force && response.status === 400 && lowerBody.includes("already exists")) {
        return "exists";
      }

      if (isRetryableStatus(response.status) && attempt < RETRY_COUNT) {
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      throw new Error(`upload failed HTTP ${response.status}${bodyText ? ` - ${bodyText}` : ""}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("upload failed");
      if (attempt < RETRY_COUNT) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError ?? new Error("upload failed");
}

async function parseCsvAsRows(filePath: string): Promise<{ headers: string[]; rows: RowObject[] }> {
  const content = await readFile(filePath, "utf8");
  const parsed = parseCsvRows(content);

  if (parsed.length === 0) {
    throw new Error(`CSV is empty: ${filePath}`);
  }

  const headers = parsed[0];
  const dataRows = parsed.slice(1);

  const rows: RowObject[] = dataRows.map((dataRow) => {
    const row: RowObject = {};
    for (let index = 0; index < headers.length; index += 1) {
      row[headers[index]] = dataRow[index] ?? "";
    }
    return row;
  });

  return { headers, rows };
}

function parseManifestRows(headers: string[], rows: RowObject[]): ManifestEntry[] {
  const headerMap = getHeaderMap(headers);
  const entries: ManifestEntry[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const brand = getField(row, headerMap, ["brand"]);
    const name = getField(row, headerMap, ["name"]);
    const slug = getField(row, headerMap, ["slug"]) || slugify(`${brand}-${name}`);

    if (!brand || !name) {
      continue;
    }

    entries.push({
      rowNumber: index + 2,
      brand,
      name,
      slug,
      localImagePath: getField(row, headerMap, ["local_image_path", "localimagepath"]),
      approvedImageUrl: getField(row, headerMap, ["approved_image_url", "approvedimageurl"]),
      imageStoragePath:
        normalizeStoragePath(getField(row, headerMap, ["image_storage_path", "imagestoragepath"])) ||
        inferStoragePath(brand, slug),
    });
  }

  return entries;
}

async function updatePerfumeImageInDb(params: {
  prisma: PrismaClient;
  slug: string;
  brand: string;
  name: string;
  publicUrl: string;
}): Promise<number> {
  const bySlug = await params.prisma.perfume.updateMany({
    where: { slug: params.slug },
    data: { imageUrl: params.publicUrl },
  });

  if (bySlug.count > 0) {
    return bySlug.count;
  }

  const brandSlug = slugify(params.brand);
  const byBrandName = await params.prisma.perfume.updateMany({
    where: {
      name: params.name,
      brand: {
        slug: brandSlug,
      },
    },
    data: {
      imageUrl: params.publicUrl,
    },
  });

  return byBrandName.count;
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const manifestPath = path.resolve(repoRoot, options.manifestPath);
  const catalogPath = path.resolve(repoRoot, options.catalogPath);

  await access(manifestPath);
  await access(catalogPath);

  const manifestCsv = await parseCsvAsRows(manifestPath);
  const manifestEntries = parseManifestRows(manifestCsv.headers, manifestCsv.rows);

  const catalogCsv = await parseCsvAsRows(catalogPath);
  const catalogHeaders = ensureHeaders(catalogCsv.headers, [
    "image_source_url",
    "image_storage_path",
    "image_public_url",
    "imageUrl",
    "slug",
  ]);
  const catalogHeaderMap = getHeaderMap(catalogHeaders);

  const catalogRows: RowObject[] = catalogCsv.rows.map((row) => {
    const mapped: RowObject = {};
    for (const header of catalogHeaders) {
      mapped[header] = row[header] ?? "";
    }
    return mapped;
  });

  const catalogBySlug = new Map<string, CatalogIndex>();
  const catalogByBrandName = new Map<string, CatalogIndex>();

  for (let index = 0; index < catalogRows.length; index += 1) {
    const row = catalogRows[index];
    const brand = getField(row, catalogHeaderMap, ["brand"]);
    const name = getField(row, catalogHeaderMap, ["name", "perfume_name", "perfume"]);
    const slug = inferSlug(row, catalogHeaderMap);
    const brandNameKey = normalizedBrandNameKey(brand, name);

    const current: CatalogIndex = {
      row,
      rowNumber: index + 2,
      slug,
      brandNameKey,
    };

    if (slug && !catalogBySlug.has(slug)) {
      catalogBySlug.set(slug, current);
    }

    if (brandNameKey && !catalogByBrandName.has(brandNameKey)) {
      catalogByBrandName.set(brandNameKey, current);
    }

    setField(row, catalogHeaderMap, "slug", slug);
  }

  await loadRootDotenv();
  const supabaseUrl = cleanString(process.env.SUPABASE_URL);
  const supabaseServiceRoleKey = cleanString(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const bucket = cleanString(process.env.SUPABASE_STORAGE_BUCKET) || DEFAULT_BUCKET;

  if (!options.dryRun && (!supabaseUrl || !supabaseServiceRoleKey)) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in root .env. Set them and rerun bulk upload.",
    );
  }

  const limit = options.limit ? Math.min(options.limit, manifestEntries.length) : manifestEntries.length;
  const entriesToProcess = manifestEntries.slice(0, limit);

  console.log(
    `[images-bulk-upload] manifest=${manifestPath} catalog=${catalogPath} rows=${entriesToProcess.length} dryRun=${options.dryRun} force=${options.force} updateDb=${options.updateDb}`,
  );

  const stats: Stats = {
    manifestRowsRead: entriesToProcess.length,
    processed: 0,
    uploaded: 0,
    skipped: 0,
    failed: 0,
    updatedCsvRows: 0,
    updatedDbRows: 0,
  };

  const pendingDbUpdates: Array<{ slug: string; brand: string; name: string; publicUrl: string }> = [];

  for (const entry of entriesToProcess) {
    stats.processed += 1;
    const label = `${entry.slug} (manifest row ${entry.rowNumber})`;

    const bySlug = catalogBySlug.get(entry.slug);
    const fallbackKey = normalizedBrandNameKey(entry.brand, entry.name);
    const match = bySlug ?? catalogByBrandName.get(fallbackKey);

    if (!match) {
      stats.failed += 1;
      console.log(`[fail] ${label} not found in verified catalog (slug and brand+name match failed)`);
      continue;
    }

    const resolvedLocalPath = path.isAbsolute(entry.localImagePath)
      ? entry.localImagePath
      : path.resolve(repoRoot, entry.localImagePath);

    if (!entry.localImagePath) {
      stats.skipped += 1;
      console.log(`[skip] ${label} missing local_image_path in manifest`);
      continue;
    }

    try {
      await access(resolvedLocalPath);
    } catch {
      stats.skipped += 1;
      console.log(`[skip] ${label} local file not found: ${resolvedLocalPath}`);
      continue;
    }

    const row = match.row;
    const existingPublicUrl = getField(row, catalogHeaderMap, ["image_public_url", "imagepublicurl"]);
    if (existingPublicUrl && !options.force) {
      stats.skipped += 1;
      console.log(`[skip] ${label} image_public_url already set in verified catalog`);
      continue;
    }

    const storagePath = normalizeStoragePath(entry.imageStoragePath) || inferStoragePath(entry.brand, entry.slug);

    let publicUrl = "";

    if (options.dryRun) {
      publicUrl = buildPublicUrl(supabaseUrl || "https://example.supabase.co", bucket, storagePath);
      console.log(`[dry-run] ${label} would upload ${resolvedLocalPath} -> ${storagePath}`);
      stats.uploaded += 1;
    } else {
      try {
        const buffer = await readFile(resolvedLocalPath);
        const contentType = contentTypeFromPath(resolvedLocalPath);

        const uploadResult = await uploadToStorageWithRetry({
          supabaseUrl,
          serviceRoleKey: supabaseServiceRoleKey,
          bucket,
          storagePath,
          contentType,
          buffer,
          force: options.force,
        });

        publicUrl = buildPublicUrl(supabaseUrl, bucket, storagePath);
        if (uploadResult === "exists") {
          console.log(`[skip] ${label} storage object already exists (${storagePath})`);
          stats.skipped += 1;
        } else {
          console.log(`[upload] ${label} -> ${storagePath}`);
          stats.uploaded += 1;
        }
      } catch (error) {
        stats.failed += 1;
        console.log(`[fail] ${label} ${error instanceof Error ? error.message : "upload failed"}`);
        continue;
      }
    }

    setField(row, catalogHeaderMap, "image_storage_path", storagePath);
    setField(row, catalogHeaderMap, "image_public_url", publicUrl);

    const approvedUrl = cleanString(entry.approvedImageUrl);
    if (approvedUrl) {
      setField(row, catalogHeaderMap, "image_source_url", approvedUrl);
    }

    const existingImageUrl = getField(row, catalogHeaderMap, ["imageUrl", "image_url", "imageurl"]);
    if (!existingImageUrl || options.force) {
      setField(row, catalogHeaderMap, "imageUrl", publicUrl);
    }

    stats.updatedCsvRows += 1;

    if (options.updateDb) {
      pendingDbUpdates.push({
        slug: entry.slug,
        brand: entry.brand,
        name: entry.name,
        publicUrl,
      });
    }
  }

  if (!options.dryRun && stats.updatedCsvRows > 0) {
    await writeFile(catalogPath, toCsv(catalogHeaders, catalogRows), "utf8");
  }

  if (options.updateDb) {
    if (options.dryRun) {
      console.log(`[dry-run] DB update skipped (${pendingDbUpdates.length} rows would be updated)`);
    } else {
      const prisma = new PrismaClient();
      try {
        for (const item of pendingDbUpdates) {
          const updated = await updatePerfumeImageInDb({
            prisma,
            slug: item.slug,
            brand: item.brand,
            name: item.name,
            publicUrl: item.publicUrl,
          });
          stats.updatedDbRows += updated;
        }
      } finally {
        await prisma.$disconnect();
      }
    }
  }

  console.log("\nBulk approved images summary");
  console.log("----------------------------");
  console.log(`manifest rows read: ${stats.manifestRowsRead}`);
  console.log(`processed: ${stats.processed}`);
  console.log(`uploaded: ${stats.uploaded}`);
  console.log(`skipped: ${stats.skipped}`);
  console.log(`failed: ${stats.failed}`);
  console.log(`updated CSV rows: ${stats.updatedCsvRows}`);
  console.log(`updated DB rows: ${stats.updatedDbRows}`);
}

main().catch((error) => {
  console.error("[images-bulk-upload] failed:", error);
  process.exitCode = 1;
});

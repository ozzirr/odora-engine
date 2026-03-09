import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type CliOptions = {
  inputPath: string;
  force: boolean;
  limit?: number;
};

type RowObject = Record<string, string>;

type Stats = {
  rowsRead: number;
  uploaded: number;
  skippedMissingSource: number;
  skippedMissingStoragePath: number;
  skippedExistingPublicUrl: number;
  skippedExistingStorageObject: number;
  failedDownload: number;
  failedUpload: number;
  failedInvalidImage: number;
};

type DownloadResult = {
  buffer: Buffer;
  contentType: string;
};

const DEFAULT_INPUT_PATH = "data/verified/perfumes.csv";
const DEFAULT_BUCKET = "perfumes";
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const RETRY_COUNT = 3;
const RETRY_DELAY_MS = 1_100;

const FALLBACK_EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..");
const rootEnvPath = path.join(repoRoot, ".env");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
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

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    inputPath: DEFAULT_INPUT_PATH,
    force: false,
  };

  for (const arg of argv) {
    if (arg === "--force") {
      options.force = true;
      continue;
    }

    if (arg.startsWith("--input=")) {
      options.inputPath = arg.replace("--input=", "");
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
  const outputRows = [headers.join(",")];
  for (const row of rows) {
    const values = headers.map((header) => escapeCsvValue(row[header] ?? ""));
    outputRows.push(values.join(","));
  }
  return `${outputRows.join("\n")}\n`;
}

function makeAbortSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

function detectImageMimeType(sourceUrl: string, rawContentType: string | null, buffer: Buffer): string | null {
  const contentType = cleanString(rawContentType ?? "").toLowerCase().split(";")[0];
  if (contentType.startsWith("image/")) {
    return contentType;
  }

  if (buffer.length >= 4) {
    const b0 = buffer[0];
    const b1 = buffer[1];
    const b2 = buffer[2];
    const b3 = buffer[3];

    if (b0 === 0xff && b1 === 0xd8 && b2 === 0xff) {
      return "image/jpeg";
    }

    if (b0 === 0x89 && b1 === 0x50 && b2 === 0x4e && b3 === 0x47) {
      return "image/png";
    }

    if (b0 === 0x47 && b1 === 0x49 && b2 === 0x46 && b3 === 0x38) {
      return "image/gif";
    }
  }

  if (buffer.length >= 12) {
    const riff = buffer.subarray(0, 4).toString("ascii");
    const webp = buffer.subarray(8, 12).toString("ascii");
    if (riff === "RIFF" && webp === "WEBP") {
      return "image/webp";
    }
  }

  const asText = buffer.subarray(0, Math.min(512, buffer.length)).toString("utf8").trim().toLowerCase();
  if (asText.startsWith("<svg") || asText.includes("<svg ")) {
    return "image/svg+xml";
  }

  const url = sourceUrl.toLowerCase();
  if (url.endsWith(".jpg") || url.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (url.endsWith(".png")) {
    return "image/png";
  }
  if (url.endsWith(".webp")) {
    return "image/webp";
  }
  if (url.endsWith(".gif")) {
    return "image/gif";
  }
  if (url.endsWith(".avif")) {
    return "image/avif";
  }
  if (url.endsWith(".svg")) {
    return "image/svg+xml";
  }

  return null;
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

async function downloadImageWithRetry(sourceUrl: string): Promise<DownloadResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= RETRY_COUNT; attempt += 1) {
    try {
      const response = await fetch(sourceUrl, {
        method: "GET",
        signal: makeAbortSignal(REQUEST_TIMEOUT_MS),
        redirect: "follow",
      });

      if (!response.ok) {
        if (isRetryableStatus(response.status) && attempt < RETRY_COUNT) {
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length === 0) {
        throw new Error("empty response body");
      }

      if (buffer.length > MAX_IMAGE_BYTES) {
        throw new Error(`image too large (${buffer.length} bytes)`);
      }

      const contentType = detectImageMimeType(sourceUrl, response.headers.get("content-type"), buffer);
      if (!contentType) {
        throw new Error("unable to detect image content-type");
      }

      return {
        buffer,
        contentType,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("download failed");
      if (attempt < RETRY_COUNT) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError ?? new Error("download failed");
}

function encodeStoragePath(storagePath: string): string {
  return storagePath
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function withExtension(storagePath: string, contentType: string): string {
  const cleanPath = storagePath.replace(/^\/+/, "");
  if (!cleanPath) {
    return cleanPath;
  }

  const fileName = cleanPath.split("/").pop() ?? "";
  if (fileName.includes(".")) {
    return cleanPath;
  }

  const extension = FALLBACK_EXT_BY_TYPE[contentType] ?? "jpg";
  return `${cleanPath}.${extension}`;
}

function buildPublicUrl(supabaseUrl: string, bucket: string, storagePath: string): string {
  const encoded = encodeStoragePath(storagePath);
  const base = supabaseUrl.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encoded}`;
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

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const resolvedInputPath = path.resolve(repoRoot, options.inputPath);

  await loadRootDotenv();

  const supabaseUrl = cleanString(process.env.SUPABASE_URL);
  const supabaseServiceRoleKey = cleanString(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const bucket = cleanString(process.env.SUPABASE_STORAGE_BUCKET) || DEFAULT_BUCKET;

  console.log("[images-sync] env diagnostics:");
  console.log(`- SUPABASE_URL: ${supabaseUrl ? "present" : "missing"}`);
  console.log(`- SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? "present" : "missing"}`);
  console.log(`- SUPABASE_STORAGE_BUCKET: ${cleanString(process.env.SUPABASE_STORAGE_BUCKET) ? "present" : "missing (using default perfumes)"}`);

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing required env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the repository root .env, then rerun `npm run sync:verified:images`.",
    );
  }

  await access(resolvedInputPath);
  const content = await readFile(resolvedInputPath, "utf8");
  const parsedRows = parseCsvRows(content);

  if (parsedRows.length === 0) {
    throw new Error("CSV is empty");
  }

  const originalHeaders = parsedRows[0];
  const dataRows = parsedRows.slice(1);
  const headers = [...originalHeaders];
  const normalizedHeaderMap = new Map<string, string>();

  for (const header of headers) {
    normalizedHeaderMap.set(normalizeHeader(header), header);
  }

  const requiredColumns = ["image_source_url", "image_storage_path", "image_public_url"];
  for (const column of requiredColumns) {
    const key = normalizeHeader(column);
    if (!normalizedHeaderMap.has(key)) {
      headers.push(column);
      normalizedHeaderMap.set(key, column);
    }
  }

  const sourceHeader = normalizedHeaderMap.get("imagesourceurl") ?? "image_source_url";
  const storageHeader = normalizedHeaderMap.get("imagestoragepath") ?? "image_storage_path";
  const publicHeader = normalizedHeaderMap.get("imagepublicurl") ?? "image_public_url";
  const imageUrlHeader = normalizedHeaderMap.get("imageurl");

  const rows: RowObject[] = dataRows.map((row) => {
    const mapped: RowObject = {};
    for (let index = 0; index < headers.length; index += 1) {
      const header = headers[index];
      const originalIndex = originalHeaders.indexOf(header);
      mapped[header] = originalIndex >= 0 ? (row[originalIndex] ?? "") : "";
    }
    return mapped;
  });

  const stats: Stats = {
    rowsRead: 0,
    uploaded: 0,
    skippedMissingSource: 0,
    skippedMissingStoragePath: 0,
    skippedExistingPublicUrl: 0,
    skippedExistingStorageObject: 0,
    failedDownload: 0,
    failedUpload: 0,
    failedInvalidImage: 0,
  };

  const limit = options.limit ? Math.min(options.limit, rows.length) : rows.length;
  console.log(
    `[images-sync] source=${resolvedInputPath} rows=${limit} force=${options.force} bucket=${bucket}`,
  );

  for (let index = 0; index < limit; index += 1) {
    const row = rows[index];
    const rowLabel = `row ${index + 2}`;

    const sourceUrl = cleanString(row[sourceHeader]);
    let storagePath = cleanString(row[storageHeader]);
    const existingPublicUrl = cleanString(row[publicHeader]);
    stats.rowsRead += 1;

    if (!sourceUrl) {
      stats.skippedMissingSource += 1;
      console.log(`[skip] ${rowLabel} missing image_source_url`);
      continue;
    }

    if (!storagePath) {
      stats.skippedMissingStoragePath += 1;
      console.log(`[skip] ${rowLabel} missing image_storage_path`);
      continue;
    }

    if (existingPublicUrl && !options.force) {
      stats.skippedExistingPublicUrl += 1;
      console.log(`[skip] ${rowLabel} image_public_url already set`);
      continue;
    }

    try {
      const download = await downloadImageWithRetry(sourceUrl);
      storagePath = withExtension(storagePath, download.contentType);
      row[storageHeader] = storagePath;

      const uploadResult = await uploadToStorageWithRetry({
        supabaseUrl,
        serviceRoleKey: supabaseServiceRoleKey,
        bucket,
        storagePath,
        contentType: download.contentType,
        buffer: download.buffer,
        force: options.force,
      });

      const publicUrl = buildPublicUrl(supabaseUrl, bucket, storagePath);
      row[publicHeader] = publicUrl;

      if (imageUrlHeader && (!cleanString(row[imageUrlHeader]) || options.force)) {
        row[imageUrlHeader] = publicUrl;
      }

      if (uploadResult === "exists") {
        stats.skippedExistingStorageObject += 1;
        console.log(`[skip] ${rowLabel} object already exists in storage`);
      } else {
        stats.uploaded += 1;
        console.log(`[upload] ${rowLabel} -> ${storagePath}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      const lower = message.toLowerCase();

      if (lower.includes("content-type") || lower.includes("detect image")) {
        stats.failedInvalidImage += 1;
      } else if (lower.includes("http") || lower.includes("download") || lower.includes("empty response")) {
        stats.failedDownload += 1;
      } else {
        stats.failedUpload += 1;
      }

      console.log(`[fail] ${rowLabel} ${message}`);
    }
  }

  const csv = toCsv(headers, rows);
  await writeFile(resolvedInputPath, csv, "utf8");

  console.log("");
  console.log("Image sync summary");
  console.log("------------------");
  console.log(`rows read: ${stats.rowsRead}`);
  console.log(`uploaded: ${stats.uploaded}`);
  console.log(`skipped (missing source): ${stats.skippedMissingSource}`);
  console.log(`skipped (missing storage path): ${stats.skippedMissingStoragePath}`);
  console.log(`skipped (existing image_public_url): ${stats.skippedExistingPublicUrl}`);
  console.log(`skipped (object already exists): ${stats.skippedExistingStorageObject}`);
  console.log(`failed (download): ${stats.failedDownload}`);
  console.log(`failed (invalid image): ${stats.failedInvalidImage}`);
  console.log(`failed (upload): ${stats.failedUpload}`);
}

main().catch((error) => {
  console.error("[images-sync] failed:", error);
  process.exitCode = 1;
});

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { cleanString, normalizeCsvHeader } from "./lib/normalize";
import { slugify } from "./lib/slug";

type CliOptions = {
  manifestPath: string;
  limit?: number;
  dryRun: boolean;
  force: boolean;
};

type ManifestRow = {
  rowNumber: number;
  brand: string;
  name: string;
  slug: string;
  localImagePath: string;
};

type BraveImageSearchResponse = {
  results?: unknown[];
};

type DownloadResult = {
  buffer: Buffer;
  contentType: string;
  bytes: number;
  sourceUrl: string;
};

type Stats = {
  rowsRead: number;
  processed: number;
  skippedExisting: number;
  skippedMissingData: number;
  searched: number;
  downloaded: number;
  failedSearch: number;
  failedDownload: number;
};

const DEFAULT_MANIFEST_PATH = "data/archive/verified/images/approved-images-manifest.csv";
const BRAVE_IMAGES_ENDPOINT = "https://api.search.brave.com/res/v1/images/search";
const REQUEST_TIMEOUT_MS = 18_000;
const SEARCH_RETRIES = 3;
const DOWNLOAD_RETRIES = 3;
const RETRY_DELAY_MS = 1_000;
const MIN_IMAGE_BYTES = 10 * 1024;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..");
const rootEnvPath = path.join(repoRoot, ".env");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    manifestPath: DEFAULT_MANIFEST_PATH,
    dryRun: false,
    force: false,
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

    if (arg.startsWith("--manifest=")) {
      options.manifestPath = arg.replace("--manifest=", "");
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

function buildManifestRows(headers: string[], dataRows: string[][]): ManifestRow[] {
  const headerMap = new Map<string, number>();
  for (let i = 0; i < headers.length; i += 1) {
    const normalized = normalizeCsvHeader(headers[i]);
    if (!normalized || headerMap.has(normalized)) {
      continue;
    }
    headerMap.set(normalized, i);
  }

  const getValue = (row: string[], keys: string[]) => {
    for (const key of keys) {
      const idx = headerMap.get(normalizeCsvHeader(key));
      if (idx === undefined) {
        continue;
      }
      const value = cleanString(row[idx] ?? "");
      if (value) {
        return value;
      }
    }
    return "";
  };

  const rows: ManifestRow[] = [];

  for (let index = 0; index < dataRows.length; index += 1) {
    const row = dataRows[index];
    const brand = getValue(row, ["brand"]);
    const name = getValue(row, ["name"]);
    const slug = getValue(row, ["slug"]) || slugify(`${brand}-${name}`);

    if (!brand || !name || !slug) {
      continue;
    }

    rows.push({
      rowNumber: index + 2,
      brand,
      name,
      slug,
      localImagePath: `approved-images/${slug}.jpg`,
    });
  }

  return rows;
}

function createAbortSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

function extractCandidateUrls(result: unknown): string[] {
  if (!result || typeof result !== "object") {
    return [];
  }

  const record = result as Record<string, unknown>;
  const candidates: string[] = [];

  const pushIfUrl = (value: unknown) => {
    if (typeof value !== "string") {
      return;
    }

    const cleaned = cleanString(value);
    if (!cleaned || !/^https?:\/\//i.test(cleaned)) {
      return;
    }

    candidates.push(cleaned);
  };

  pushIfUrl(record.url);
  pushIfUrl(record.imageUrl);
  pushIfUrl(record.source);

  if (record.properties && typeof record.properties === "object") {
    const properties = record.properties as Record<string, unknown>;
    pushIfUrl(properties.url);
    pushIfUrl(properties.src);
  }

  if (record.thumbnail && typeof record.thumbnail === "object") {
    const thumbnail = record.thumbnail as Record<string, unknown>;
    pushIfUrl(thumbnail.src);
    pushIfUrl(thumbnail.url);
  }

  if (record.meta_url && typeof record.meta_url === "object") {
    const meta = record.meta_url as Record<string, unknown>;
    pushIfUrl(meta.raw);
  }

  return [...new Set(candidates)];
}

function prioritizeCandidateUrls(urls: string[]): string[] {
  const score = (url: string) => {
    const lower = url.toLowerCase();
    let rank = 0;

    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.includes("format=jpg")) {
      rank += 5;
    }

    if (lower.includes("bottle") || lower.includes("product") || lower.includes("perfume")) {
      rank += 2;
    }

    if (lower.includes("thumbnail") || lower.includes("small") || lower.includes("icon")) {
      rank -= 3;
    }

    return rank;
  };

  return [...urls].sort((a, b) => score(b) - score(a));
}

async function searchImagesWithRetry(query: string, apiKey: string): Promise<string[]> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= SEARCH_RETRIES; attempt += 1) {
    try {
      const url = new URL(BRAVE_IMAGES_ENDPOINT);
      url.searchParams.set("q", query);
      url.searchParams.set("count", "20");
      url.searchParams.set("search_lang", "en");

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Accept-Language": "en-US,en;q=0.9,it-IT;q=0.8,it;q=0.7",
          "User-Agent": "odora-brave-image-fetcher/1.0",
          "X-Subscription-Token": apiKey,
        },
        signal: createAbortSignal(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`search HTTP ${response.status}`);
      }

      const payload = (await response.json()) as BraveImageSearchResponse;
      const rawResults = Array.isArray(payload.results) ? payload.results : [];

      const urls = rawResults.flatMap((item) => extractCandidateUrls(item));
      return prioritizeCandidateUrls(urls);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("search failed");
      if (attempt < SEARCH_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError ?? new Error("search failed");
}

async function downloadImageWithRetry(url: string): Promise<DownloadResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= DOWNLOAD_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: {
          Accept: "image/*,*/*;q=0.8",
          "User-Agent": "odora-brave-image-fetcher/1.0",
        },
        signal: createAbortSignal(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`download HTTP ${response.status}`);
      }

      const contentType = cleanString(response.headers.get("content-type") ?? "").toLowerCase();
      if (!contentType.startsWith("image/")) {
        throw new Error(`invalid content-type: ${contentType || "unknown"}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength <= MIN_IMAGE_BYTES) {
        throw new Error(`image too small (${buffer.byteLength} bytes)`);
      }

      return {
        buffer,
        contentType,
        bytes: buffer.byteLength,
        sourceUrl: url,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("download failed");
      if (attempt < DOWNLOAD_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError ?? new Error("download failed");
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));

  await loadRootDotenv();

  const braveApiKey = cleanString(process.env.BRAVE_API_KEY || process.env.BRAVE_SEARCH_API_KEY);
  if (!options.dryRun && !braveApiKey) {
    throw new Error("Missing BRAVE_API_KEY in root .env (or BRAVE_SEARCH_API_KEY)");
  }

  const manifestPath = path.resolve(repoRoot, options.manifestPath);
  await access(manifestPath);

  const content = await readFile(manifestPath, "utf8");
  const parsed = parseCsvRows(content);

  if (parsed.length === 0) {
    throw new Error(`Manifest CSV is empty: ${manifestPath}`);
  }

  const headers = parsed[0];
  const dataRows = parsed.slice(1);
  const manifestRows = buildManifestRows(headers, dataRows);

  const targetRows = options.limit ? manifestRows.slice(0, options.limit) : manifestRows;

  const stats: Stats = {
    rowsRead: targetRows.length,
    processed: 0,
    skippedExisting: 0,
    skippedMissingData: 0,
    searched: 0,
    downloaded: 0,
    failedSearch: 0,
    failedDownload: 0,
  };

  console.log(
    `[images-fetch] manifest=${manifestPath} rows=${targetRows.length} dryRun=${options.dryRun} force=${options.force}`,
  );

  for (const row of targetRows) {
    stats.processed += 1;

    if (!row.brand || !row.name || !row.slug) {
      stats.skippedMissingData += 1;
      console.log(`[skip] row ${row.rowNumber} missing brand/name/slug`);
      continue;
    }

    const targetRelativePath = row.localImagePath;
    const targetAbsolutePath = path.resolve(repoRoot, targetRelativePath);

    const exists = await access(targetAbsolutePath)
      .then(() => true)
      .catch(() => false);

    if (exists && !options.force) {
      stats.skippedExisting += 1;
      console.log(`[skip] ${row.slug} file exists: ${targetRelativePath}`);
      continue;
    }

    const query = `${row.brand} ${row.name} perfume bottle`;

    if (options.dryRun) {
      console.log(`[dry-run] ${row.slug} query="${query}" -> ${targetRelativePath}`);
      continue;
    }

    let candidates: string[] = [];
    try {
      candidates = await searchImagesWithRetry(query, braveApiKey);
      stats.searched += 1;
    } catch (error) {
      stats.failedSearch += 1;
      console.log(`[fail-search] ${row.slug} ${error instanceof Error ? error.message : "search failed"}`);
      continue;
    }

    if (candidates.length === 0) {
      stats.failedSearch += 1;
      console.log(`[fail-search] ${row.slug} no image candidates from Brave`);
      continue;
    }

    let downloaded: DownloadResult | null = null;
    for (const candidateUrl of candidates.slice(0, 12)) {
      try {
        downloaded = await downloadImageWithRetry(candidateUrl);
        break;
      } catch {
        // Try next candidate.
      }
    }

    if (!downloaded) {
      stats.failedDownload += 1;
      console.log(`[fail-download] ${row.slug} all candidates failed validation/download`);
      continue;
    }

    await mkdir(path.dirname(targetAbsolutePath), { recursive: true });
    await writeFile(targetAbsolutePath, downloaded.buffer);

    stats.downloaded += 1;
    console.log(
      `[saved] ${row.slug} -> ${targetRelativePath} (${downloaded.bytes} bytes, ${downloaded.contentType})`,
    );
  }

  console.log("\nBrave image fetch summary");
  console.log("-------------------------");
  console.log(`rows read: ${stats.rowsRead}`);
  console.log(`processed: ${stats.processed}`);
  console.log(`skipped existing: ${stats.skippedExisting}`);
  console.log(`skipped missing data: ${stats.skippedMissingData}`);
  console.log(`searched: ${stats.searched}`);
  console.log(`downloaded: ${stats.downloaded}`);
  console.log(`failed search: ${stats.failedSearch}`);
  console.log(`failed download: ${stats.failedDownload}`);
}

main().catch((error) => {
  console.error("[images-fetch] failed:", error);
  process.exitCode = 1;
});

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { cleanString, normalizeCsvHeader } from "./lib/normalize";
import { slugify } from "./lib/slug";

type CliOptions = {
  inputPath: string;
  outputCsvPath: string;
  outputJsonPath: string;
  limit?: number;
  status?: string;
  missingImagesOnly: boolean;
};

type RowObject = Record<string, string>;

type SuggestionRow = {
  brand: string;
  name: string;
  slug: string;
  official_source_url: string;
  image_source_url: string;
  image_storage_path: string;
  catalog_status: string;
  data_quality: string;
  confidence_score: string;
  review_status: string;
  final_url: string;
  http_status_code: string;
  failure_reason: string;
};

type Candidate = {
  url: string;
  source: string;
  baseConfidence: number;
};

type FetchFailureType =
  | "MISSING_OFFICIAL_SOURCE_URL"
  | "INVALID_OFFICIAL_SOURCE_URL"
  | "TIMEOUT"
  | "REDIRECT_LIMIT"
  | "REDIRECT_LOOP"
  | "REDIRECT_INVALID_LOCATION"
  | "BLOCKED"
  | "HTTP_ERROR"
  | "NETWORK_ERROR"
  | "PARSE_ERROR";

type FetchFailure = {
  ok: false;
  type: FetchFailureType;
  reason: string;
  finalUrl: string;
  statusCode?: number;
  redirectCount: number;
};

type FetchSuccess = {
  ok: true;
  html: string;
  contentType: string;
  finalUrl: string;
  statusCode: number;
  redirectCount: number;
  isImageResponse: boolean;
};

type FetchResult = FetchSuccess | FetchFailure;

type SuggestionResult = {
  imageSourceUrl: string;
  confidenceScore: number;
  reviewStatus: string;
  finalUrl: string;
  httpStatusCode?: number;
  failureReason: string;
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..");

const DEFAULT_INPUT_PATH = "data/verified/perfumes.csv";
const DEFAULT_OUTPUT_CSV_PATH = "data/verified/worklists/image-source-suggestions.csv";
const DEFAULT_OUTPUT_JSON_PATH = "data/verified/worklists/image-source-suggestions.json";

const REQUEST_TIMEOUT_MS = 12_000;
const RETRY_COUNT = 2;
const RETRY_DELAY_MS = 900;
const MAX_REDIRECTS = 6;

const WORKLIST_FIELDS: Array<keyof SuggestionRow> = [
  "brand",
  "name",
  "slug",
  "official_source_url",
  "image_source_url",
  "image_storage_path",
  "catalog_status",
  "data_quality",
  "confidence_score",
  "review_status",
  "final_url",
  "http_status_code",
  "failure_reason",
];

const DIRECT_IMAGE_PATTERN = /\.(?:avif|gif|jpe?g|png|svg|webp)(?:$|[?#])/i;
const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    inputPath: DEFAULT_INPUT_PATH,
    outputCsvPath: DEFAULT_OUTPUT_CSV_PATH,
    outputJsonPath: DEFAULT_OUTPUT_JSON_PATH,
    missingImagesOnly: false,
  };

  for (const arg of argv) {
    if (arg.startsWith("--input=")) {
      options.inputPath = arg.replace("--input=", "");
      continue;
    }

    if (arg.startsWith("--output-csv=")) {
      options.outputCsvPath = arg.replace("--output-csv=", "");
      continue;
    }

    if (arg.startsWith("--output-json=")) {
      options.outputJsonPath = arg.replace("--output-json=", "");
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const parsed = Number.parseInt(arg.replace("--limit=", ""), 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.limit = parsed;
      }
      continue;
    }

    if (arg.startsWith("--status=")) {
      const status = cleanString(arg.replace("--status=", ""));
      if (status) {
        options.status = status.toUpperCase();
      }
      continue;
    }

    if (arg === "--missing-images-only") {
      options.missingImagesOnly = true;
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

function toWorklistCsv(rows: SuggestionRow[]): string {
  const lines = [WORKLIST_FIELDS.join(",")];
  for (const row of rows) {
    const values = WORKLIST_FIELDS.map((field) => escapeCsvValue(row[field] ?? ""));
    lines.push(values.join(","));
  }
  return `${lines.join("\n")}\n`;
}

function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function getBaseDomain(hostname: string): string {
  const normalized = normalizeHost(hostname);
  const parts = normalized.split(".").filter(Boolean);
  if (parts.length <= 2) {
    return normalized;
  }
  return parts.slice(-2).join(".");
}

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function looksLikeDirectImageUrl(url: string): boolean {
  return DIRECT_IMAGE_PATTERN.test(url) || /[?&](?:format|fm|type)=image/i.test(url);
}

function shouldRejectCandidateUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("favicon") ||
    lower.includes("apple-touch-icon") ||
    /(?:^|[/_-])icons?(?:[/_.-]|$)/i.test(lower) ||
    /(?:^|[/_-])site-logo(?:[/_.-]|$)/i.test(lower)
  );
}

function parseAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /([a-zA-Z0-9_:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;

  let match: RegExpExecArray | null = attrRegex.exec(tag);
  while (match) {
    const key = match[1].toLowerCase();
    const value = cleanString(match[3] ?? match[4] ?? match[5] ?? "");
    attrs[key] = value;
    match = attrRegex.exec(tag);
  }

  return attrs;
}

function resolveCandidateUrl(value: string, officialSourceUrl: string): string | null {
  const cleaned = cleanString(value);
  if (!cleaned || cleaned.startsWith("data:")) {
    return null;
  }

  try {
    const resolved = new URL(cleaned, officialSourceUrl);
    if (!/^https?:$/i.test(resolved.protocol)) {
      return null;
    }

    const result = resolved.toString();
    if (shouldRejectCandidateUrl(result)) {
      return null;
    }

    return result;
  } catch {
    return null;
  }
}

function pickLargestFromSrcset(srcsetValue: string): string {
  const parts = srcsetValue
    .split(",")
    .map((part) => cleanString(part))
    .filter((part) => part.length > 0);

  let bestUrl = "";
  let bestWidth = -1;

  for (const part of parts) {
    const [urlPart, descriptor] = part.split(/\s+/, 2);
    const widthMatch = descriptor?.match(/^(\d+)w$/i);
    const width = widthMatch ? Number.parseInt(widthMatch[1], 10) : 0;

    if (!bestUrl || width > bestWidth) {
      bestUrl = urlPart;
      bestWidth = width;
    }
  }

  return bestUrl;
}

function collectCandidatesFromMetaTags(html: string, officialSourceUrl: string): Candidate[] {
  const candidates: Candidate[] = [];

  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of metaTags) {
    const attrs = parseAttributes(tag);
    const key = cleanString(attrs.property || attrs.name || attrs.itemprop).toLowerCase();
    const content = cleanString(attrs.content);

    if (!content) {
      continue;
    }

    let source = "";
    let baseConfidence = 0;

    if (key === "og:image" || key === "og:image:url" || key === "og:image:secure_url") {
      source = "meta:og:image";
      baseConfidence = 0.92;
    } else if (key === "twitter:image" || key === "twitter:image:src") {
      source = "meta:twitter:image";
      baseConfidence = 0.88;
    } else if (key === "image") {
      source = "meta:image";
      baseConfidence = 0.82;
    } else {
      continue;
    }

    const resolved = resolveCandidateUrl(content, officialSourceUrl);
    if (!resolved) {
      continue;
    }

    candidates.push({
      url: resolved,
      source,
      baseConfidence,
    });
  }

  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of linkTags) {
    const attrs = parseAttributes(tag);
    const rel = cleanString(attrs.rel).toLowerCase();
    const href = cleanString(attrs.href);
    const itemprop = cleanString(attrs.itemprop).toLowerCase();

    const isImageLink = rel.includes("image_src") || rel.includes("apple-touch-icon") || itemprop === "image";
    if (!isImageLink || !href) {
      continue;
    }

    const resolved = resolveCandidateUrl(href, officialSourceUrl);
    if (!resolved) {
      continue;
    }

    candidates.push({
      url: resolved,
      source: "link:image",
      baseConfidence: rel.includes("image_src") ? 0.8 : 0.68,
    });
  }

  return candidates;
}

function collectImageValuesFromJsonLd(input: unknown, out: string[]) {
  if (typeof input === "string") {
    const trimmed = cleanString(input);
    if (trimmed) {
      out.push(trimmed);
    }
    return;
  }

  if (Array.isArray(input)) {
    for (const item of input) {
      collectImageValuesFromJsonLd(item, out);
    }
    return;
  }

  if (typeof input !== "object" || input === null) {
    return;
  }

  const record = input as Record<string, unknown>;

  if (record.image !== undefined) {
    collectImageValuesFromJsonLd(record.image, out);
  }

  if (typeof record.url === "string" && /^https?:\/\//i.test(record.url)) {
    out.push(cleanString(record.url));
  }

  for (const value of Object.values(record)) {
    if (typeof value === "object" && value !== null) {
      collectImageValuesFromJsonLd(value, out);
    }
  }
}

function collectCandidatesFromJsonLd(html: string, officialSourceUrl: string): Candidate[] {
  const candidates: Candidate[] = [];
  const scriptRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match = scriptRegex.exec(html);

  while (match) {
    const raw = cleanString(match[1]);
    if (!raw) {
      match = scriptRegex.exec(html);
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      const collected: string[] = [];
      collectImageValuesFromJsonLd(parsed, collected);

      for (const value of collected) {
        const resolved = resolveCandidateUrl(value, officialSourceUrl);
        if (!resolved) {
          continue;
        }

        candidates.push({
          url: resolved,
          source: "jsonld:image",
          baseConfidence: 0.84,
        });
      }
    } catch {
      // Ignore invalid JSON-LD blocks.
    }

    match = scriptRegex.exec(html);
  }

  return candidates;
}

function collectCandidatesFromCommonImageSelectors(html: string, officialSourceUrl: string): Candidate[] {
  const candidates: Candidate[] = [];

  const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
  for (const tag of imgTags.slice(0, 160)) {
    const attrs = parseAttributes(tag);
    const cls = cleanString(attrs.class).toLowerCase();
    const id = cleanString(attrs.id).toLowerCase();
    const alt = cleanString(attrs.alt).toLowerCase();

    const context = `${cls} ${id} ${alt}`;

    if (/\b(?:icon|logo|sprite|placeholder|avatar)\b/.test(context)) {
      continue;
    }

    let sourceTag = "img";
    let baseConfidence = 0.58;

    if (/\b(?:product|perfume|fragrance|hero|bottle|gallery|main|pdp)\b/.test(context)) {
      sourceTag = "img:product";
      baseConfidence = 0.74;
    }

    const rawSrcset = cleanString(attrs.srcset || attrs["data-srcset"] || attrs["data-lazy-srcset"]);
    const rawSrc = cleanString(
      attrs.src ||
        attrs["data-src"] ||
        attrs["data-lazy-src"] ||
        attrs["data-original"] ||
        attrs["data-image"] ||
        attrs["data-zoom-image"],
    );

    const preferred = rawSrcset ? pickLargestFromSrcset(rawSrcset) : "";
    const candidateValue = preferred || rawSrc;
    if (!candidateValue) {
      continue;
    }

    const resolved = resolveCandidateUrl(candidateValue, officialSourceUrl);
    if (!resolved) {
      continue;
    }

    candidates.push({
      url: resolved,
      source: sourceTag,
      baseConfidence,
    });
  }

  const sourceTags = html.match(/<source\b[^>]*>/gi) ?? [];
  for (const tag of sourceTags.slice(0, 100)) {
    const attrs = parseAttributes(tag);
    const rawSrcset = cleanString(attrs.srcset || attrs["data-srcset"]);
    if (!rawSrcset) {
      continue;
    }

    const candidateValue = pickLargestFromSrcset(rawSrcset);
    if (!candidateValue) {
      continue;
    }

    const resolved = resolveCandidateUrl(candidateValue, officialSourceUrl);
    if (!resolved) {
      continue;
    }

    candidates.push({
      url: resolved,
      source: "source:srcset",
      baseConfidence: 0.62,
    });
  }

  return candidates;
}

function getRequestHeaders(requestUrl: string, referer?: string): HeadersInit {
  let fallbackReferer = "";
  try {
    const parsed = new URL(requestUrl);
    fallbackReferer = `${parsed.protocol}//${parsed.host}/`;
  } catch {
    fallbackReferer = "";
  }

  const resolvedReferer = cleanString(referer) || fallbackReferer;

  return {
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.9,it-IT;q=0.8,it;q=0.7",
    "cache-control": "no-cache",
    pragma: "no-cache",
    ...(resolvedReferer ? { referer: resolvedReferer } : {}),
  };
}

async function fetchWithStrictTimeout(url: string, referer?: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: getRequestHeaders(url, referer),
    });
  } finally {
    clearTimeout(timeout);
  }
}

function classifyNetworkError(error: unknown): FetchFailure {
  const message = error instanceof Error ? cleanString(error.message) : "unknown network error";
  const lower = message.toLowerCase();

  if (error instanceof DOMException && error.name === "AbortError") {
    return {
      ok: false,
      type: "TIMEOUT",
      reason: `timeout after ${REQUEST_TIMEOUT_MS}ms`,
      finalUrl: "",
      redirectCount: 0,
    };
  }

  if (lower.includes("abort") || lower.includes("timed out")) {
    return {
      ok: false,
      type: "TIMEOUT",
      reason: `timeout after ${REQUEST_TIMEOUT_MS}ms`,
      finalUrl: "",
      redirectCount: 0,
    };
  }

  return {
    ok: false,
    type: "NETWORK_ERROR",
    reason: message || "network request failed",
    finalUrl: "",
    redirectCount: 0,
  };
}

async function fetchWithManualRedirects(officialSourceUrl: string): Promise<FetchResult> {
  let currentUrl: string;

  try {
    currentUrl = new URL(officialSourceUrl).toString();
  } catch {
    return {
      ok: false,
      type: "INVALID_OFFICIAL_SOURCE_URL",
      reason: "official_source_url is not a valid absolute URL",
      finalUrl: officialSourceUrl,
      redirectCount: 0,
    };
  }

  const visited = new Set<string>();
  let redirectCount = 0;
  let referer = "";

  while (true) {
    if (visited.has(currentUrl)) {
      return {
        ok: false,
        type: "REDIRECT_LOOP",
        reason: "redirect loop detected",
        finalUrl: currentUrl,
        redirectCount,
      };
    }

    visited.add(currentUrl);

    let response: Response;
    try {
      response = await fetchWithStrictTimeout(currentUrl, referer);
    } catch (error) {
      const classified = classifyNetworkError(error);
      return {
        ...classified,
        finalUrl: currentUrl,
        redirectCount,
      };
    }

    if (REDIRECT_STATUS_CODES.has(response.status)) {
      const location = cleanString(response.headers.get("location") ?? "");
      if (!location) {
        return {
          ok: false,
          type: "REDIRECT_INVALID_LOCATION",
          reason: `redirect ${response.status} without location header`,
          finalUrl: currentUrl,
          statusCode: response.status,
          redirectCount,
        };
      }

      let nextUrl = "";
      try {
        nextUrl = new URL(location, currentUrl).toString();
      } catch {
        return {
          ok: false,
          type: "REDIRECT_INVALID_LOCATION",
          reason: `invalid redirect location: ${location}`,
          finalUrl: currentUrl,
          statusCode: response.status,
          redirectCount,
        };
      }

      redirectCount += 1;
      if (redirectCount > MAX_REDIRECTS) {
        return {
          ok: false,
          type: "REDIRECT_LIMIT",
          reason: `redirect limit exceeded (${MAX_REDIRECTS})`,
          finalUrl: nextUrl,
          statusCode: response.status,
          redirectCount,
        };
      }

      referer = currentUrl;
      currentUrl = nextUrl;
      continue;
    }

    if (response.status === 401 || response.status === 403 || response.status === 429) {
      return {
        ok: false,
        type: "BLOCKED",
        reason: `blocked by remote server (HTTP ${response.status})`,
        finalUrl: currentUrl,
        statusCode: response.status,
        redirectCount,
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        type: "HTTP_ERROR",
        reason: `HTTP ${response.status}`,
        finalUrl: currentUrl,
        statusCode: response.status,
        redirectCount,
      };
    }

    const contentType = cleanString(response.headers.get("content-type") ?? "").toLowerCase();
    if (contentType.startsWith("image/")) {
      return {
        ok: true,
        html: "",
        contentType,
        finalUrl: currentUrl,
        statusCode: response.status,
        redirectCount,
        isImageResponse: true,
      };
    }

    try {
      const html = await response.text();
      return {
        ok: true,
        html,
        contentType,
        finalUrl: currentUrl,
        statusCode: response.status,
        redirectCount,
        isImageResponse: false,
      };
    } catch (error) {
      const message = error instanceof Error ? cleanString(error.message) : "unable to parse HTML body";
      return {
        ok: false,
        type: "PARSE_ERROR",
        reason: `response parse error: ${message}`,
        finalUrl: currentUrl,
        statusCode: response.status,
        redirectCount,
      };
    }
  }
}

async function fetchPageForSuggestions(officialSourceUrl: string): Promise<FetchResult> {
  let lastResult: FetchResult | null = null;

  for (let attempt = 1; attempt <= RETRY_COUNT + 1; attempt += 1) {
    const result = await fetchWithManualRedirects(officialSourceUrl);
    lastResult = result;

    if (result.ok) {
      return result;
    }

    const nonRetriable =
      result.type === "INVALID_OFFICIAL_SOURCE_URL" ||
      result.type === "MISSING_OFFICIAL_SOURCE_URL" ||
      result.type === "REDIRECT_LOOP" ||
      result.type === "REDIRECT_INVALID_LOCATION" ||
      result.type === "BLOCKED";

    if (nonRetriable || attempt > RETRY_COUNT) {
      return result;
    }

    await sleep(RETRY_DELAY_MS * attempt);
  }

  return (
    lastResult ?? {
      ok: false,
      type: "NETWORK_ERROR",
      reason: "unknown fetch failure",
      finalUrl: officialSourceUrl,
      redirectCount: 0,
    }
  );
}

function scoreCandidate(candidate: Candidate, officialSourceUrl: string): number {
  let score = candidate.baseConfidence;

  try {
    const officialHost = new URL(officialSourceUrl).hostname;
    const candidateHost = new URL(candidate.url).hostname;

    const officialBase = getBaseDomain(officialHost);
    const candidateBase = getBaseDomain(candidateHost);

    if (normalizeHost(candidateHost) === normalizeHost(officialHost)) {
      score += 0.06;
    } else if (officialBase === candidateBase) {
      score += 0.03;
    } else {
      score -= 0.12;
    }
  } catch {
    score -= 0.2;
  }

  if (looksLikeDirectImageUrl(candidate.url)) {
    score += 0.05;
  }

  if (/\b(?:logo|sprite|thumbnail)\b/i.test(candidate.url)) {
    score -= 0.12;
  }

  if (/\b(?:default|placeholder|no-image|fallback)\b/i.test(candidate.url)) {
    score -= 0.2;
  }

  return Number(Math.min(Math.max(score, 0), 0.99).toFixed(2));
}

function pickBestCandidate(candidates: Candidate[], officialSourceUrl: string): SuggestionResult {
  if (candidates.length === 0) {
    return {
      imageSourceUrl: "",
      confidenceScore: 0,
      reviewStatus: "NO_CANDIDATE",
      finalUrl: "",
      failureReason: "PARSE_ERROR:no image candidate found in og/twitter/jsonld/img selectors",
    };
  }

  const deduped = new Map<string, Candidate>();
  for (const candidate of candidates) {
    const key = candidate.url.toLowerCase();
    const existing = deduped.get(key);
    if (!existing || existing.baseConfidence < candidate.baseConfidence) {
      deduped.set(key, candidate);
    }
  }

  let best: { url: string; score: number } = { url: "", score: 0 };
  for (const candidate of deduped.values()) {
    const score = scoreCandidate(candidate, officialSourceUrl);
    if (score > best.score) {
      best = { url: candidate.url, score };
    }
  }

  if (!best.url) {
    return {
      imageSourceUrl: "",
      confidenceScore: 0,
      reviewStatus: "NO_CANDIDATE",
      finalUrl: "",
      failureReason: "PARSE_ERROR:all extracted candidates were invalid",
    };
  }

  return {
    imageSourceUrl: best.url,
    confidenceScore: best.score,
    reviewStatus: best.score >= 0.8 ? "AUTO_SUGGESTED" : "NEEDS_REVIEW",
    finalUrl: "",
    failureReason: "",
  };
}

async function suggestImageSourceUrl(officialSourceUrl: string): Promise<SuggestionResult> {
  const normalizedOfficial = cleanString(officialSourceUrl);

  if (!normalizedOfficial) {
    return {
      imageSourceUrl: "",
      confidenceScore: 0,
      reviewStatus: "FETCH_FAILED",
      finalUrl: "",
      failureReason: "MISSING_OFFICIAL_SOURCE_URL",
    };
  }

  if (!isHttpUrl(normalizedOfficial)) {
    return {
      imageSourceUrl: "",
      confidenceScore: 0,
      reviewStatus: "FETCH_FAILED",
      finalUrl: normalizedOfficial,
      failureReason: "INVALID_OFFICIAL_SOURCE_URL",
    };
  }

  if (looksLikeDirectImageUrl(normalizedOfficial)) {
    return {
      imageSourceUrl: normalizedOfficial,
      confidenceScore: 0.98,
      reviewStatus: "AUTO_SUGGESTED",
      finalUrl: normalizedOfficial,
      failureReason: "",
    };
  }

  const fetchResult = await fetchPageForSuggestions(normalizedOfficial);
  if (!fetchResult.ok) {
    return {
      imageSourceUrl: "",
      confidenceScore: 0,
      reviewStatus: "FETCH_FAILED",
      finalUrl: fetchResult.finalUrl,
      httpStatusCode: fetchResult.statusCode,
      failureReason: `${fetchResult.type}:${fetchResult.reason}`,
    };
  }

  if (fetchResult.isImageResponse) {
    return {
      imageSourceUrl: fetchResult.finalUrl,
      confidenceScore: 0.95,
      reviewStatus: "AUTO_SUGGESTED",
      finalUrl: fetchResult.finalUrl,
      httpStatusCode: fetchResult.statusCode,
      failureReason: "",
    };
  }

  const candidates = [
    ...collectCandidatesFromMetaTags(fetchResult.html, fetchResult.finalUrl),
    ...collectCandidatesFromJsonLd(fetchResult.html, fetchResult.finalUrl),
    ...collectCandidatesFromCommonImageSelectors(fetchResult.html, fetchResult.finalUrl),
  ];

  const picked = pickBestCandidate(candidates, fetchResult.finalUrl);
  return {
    ...picked,
    finalUrl: fetchResult.finalUrl,
    httpStatusCode: fetchResult.statusCode,
  };
}

function getField(row: RowObject, headersByNormalizedName: Map<string, string>, aliases: string[]): string {
  for (const alias of aliases) {
    const key = normalizeCsvHeader(alias);
    const header = headersByNormalizedName.get(key);
    if (!header) {
      continue;
    }

    const value = cleanString(row[header]);
    if (value.length > 0) {
      return value;
    }
  }

  return "";
}

function buildStoragePath(brand: string, slug: string): string {
  const brandSlug = slugify(brand);
  return `perfumes/${brandSlug}/${slug}.jpg`;
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));

  const inputPath = path.resolve(repoRoot, options.inputPath);
  const outputCsvPath = path.resolve(repoRoot, options.outputCsvPath);
  const outputJsonPath = path.resolve(repoRoot, options.outputJsonPath);

  const content = await readFile(inputPath, "utf8");
  const parsedRows = parseCsvRows(content);

  if (parsedRows.length === 0) {
    throw new Error(`Input CSV is empty: ${inputPath}`);
  }

  const headers = parsedRows[0];
  const sourceRows = parsedRows.slice(1);

  const headersByNormalizedName = new Map<string, string>();
  for (const header of headers) {
    const normalized = normalizeCsvHeader(header);
    if (!normalized || headersByNormalizedName.has(normalized)) {
      continue;
    }
    headersByNormalizedName.set(normalized, header);
  }

  const mappedRows: RowObject[] = sourceRows.map((sourceRow) => {
    const row: RowObject = {};
    for (let index = 0; index < headers.length; index += 1) {
      row[headers[index]] = sourceRow[index] ?? "";
    }
    return row;
  });

  let skippedByStatus = 0;
  let skippedByMissingOnly = 0;
  let skippedMissingBrandOrName = 0;

  const targetRows: Array<{
    brand: string;
    name: string;
    slug: string;
    officialSourceUrl: string;
    imageSourceUrl: string;
    imageStoragePath: string;
    catalogStatus: string;
    dataQuality: string;
  }> = [];

  for (const row of mappedRows) {
    const brand = getField(row, headersByNormalizedName, ["brand"]);
    const name = getField(row, headersByNormalizedName, ["name", "perfume_name", "perfume"]);

    if (!brand || !name) {
      skippedMissingBrandOrName += 1;
      continue;
    }

    const status = getField(row, headersByNormalizedName, ["catalog_status", "catalogstatus"]).toUpperCase();

    if (options.status && status !== options.status) {
      skippedByStatus += 1;
      continue;
    }

    const imageSourceUrl = getField(row, headersByNormalizedName, ["image_source_url", "imagesourceurl"]);
    if (options.missingImagesOnly && imageSourceUrl.length > 0) {
      skippedByMissingOnly += 1;
      continue;
    }

    const existingSlug = getField(row, headersByNormalizedName, ["slug", "perfume_slug", "perfumeslug"]);
    const slug = existingSlug || slugify(`${brand}-${name}`);

    const officialSourceUrl = getField(row, headersByNormalizedName, [
      "official_source_url",
      "officialsourceurl",
      "source_url",
      "sourceurl",
    ]);

    const imageStoragePath =
      getField(row, headersByNormalizedName, ["image_storage_path", "imagestoragepath"]) ||
      buildStoragePath(brand, slug);

    targetRows.push({
      brand,
      name,
      slug,
      officialSourceUrl,
      imageSourceUrl,
      imageStoragePath,
      catalogStatus: status,
      dataQuality: getField(row, headersByNormalizedName, ["data_quality", "dataquality"]),
    });
  }

  const limitedRows = options.limit ? targetRows.slice(0, options.limit) : targetRows;

  let alreadySet = 0;
  let autoSuggested = 0;
  let needsReview = 0;
  let noCandidate = 0;
  let failedFetch = 0;

  const suggestionRows: SuggestionRow[] = [];

  for (let index = 0; index < limitedRows.length; index += 1) {
    const row = limitedRows[index];
    const step = `${index + 1}/${limitedRows.length}`;
    console.log(`[images-suggest] [${step}] ${row.slug} - start`);

    let suggestion: SuggestionResult;

    if (row.imageSourceUrl) {
      suggestion = {
        imageSourceUrl: row.imageSourceUrl,
        confidenceScore: 1,
        reviewStatus: "ALREADY_SET",
        finalUrl: row.officialSourceUrl,
        failureReason: "",
      };
      alreadySet += 1;
    } else {
      suggestion = await suggestImageSourceUrl(row.officialSourceUrl);

      if (suggestion.reviewStatus === "AUTO_SUGGESTED") {
        autoSuggested += 1;
      } else if (suggestion.reviewStatus === "NEEDS_REVIEW") {
        needsReview += 1;
      } else if (suggestion.reviewStatus === "NO_CANDIDATE") {
        noCandidate += 1;
      } else {
        failedFetch += 1;
      }
    }

    console.log(
      `[images-suggest] [${step}] ${row.slug} - ${suggestion.reviewStatus}` +
        ` | status=${suggestion.httpStatusCode ?? "-"}` +
        ` | finalUrl=${suggestion.finalUrl || "-"}` +
        ` | reason=${suggestion.failureReason || "-"}`,
    );

    suggestionRows.push({
      brand: row.brand,
      name: row.name,
      slug: row.slug,
      official_source_url: row.officialSourceUrl,
      image_source_url: suggestion.imageSourceUrl,
      image_storage_path: row.imageStoragePath,
      catalog_status: row.catalogStatus,
      data_quality: row.dataQuality,
      confidence_score: suggestion.confidenceScore.toFixed(2),
      review_status: suggestion.reviewStatus,
      final_url: suggestion.finalUrl,
      http_status_code: suggestion.httpStatusCode ? String(suggestion.httpStatusCode) : "",
      failure_reason: suggestion.failureReason,
    });
  }

  await mkdir(path.dirname(outputCsvPath), { recursive: true });
  await mkdir(path.dirname(outputJsonPath), { recursive: true });

  await writeFile(outputCsvPath, toWorklistCsv(suggestionRows), "utf8");
  await writeFile(outputJsonPath, `${JSON.stringify(suggestionRows, null, 2)}\n`, "utf8");

  console.log(`[images-suggest] input: ${inputPath}`);
  console.log(`[images-suggest] output csv: ${outputCsvPath}`);
  console.log(`[images-suggest] output json: ${outputJsonPath}`);
  console.log("[images-suggest] summary:");
  console.log(`- source rows: ${mappedRows.length}`);
  console.log(`- skipped missing brand/name: ${skippedMissingBrandOrName}`);
  console.log(`- skipped by status filter: ${skippedByStatus}`);
  console.log(`- skipped by missing-images-only: ${skippedByMissingOnly}`);
  console.log(`- processed rows: ${limitedRows.length}`);
  console.log(`- already set image_source_url: ${alreadySet}`);
  console.log(`- auto suggested: ${autoSuggested}`);
  console.log(`- needs review: ${needsReview}`);
  console.log(`- no candidate: ${noCandidate}`);
  console.log(`- fetch failures: ${failedFetch}`);
}

main().catch((error) => {
  console.error("[images-suggest] failed:", error);
  process.exitCode = 1;
});

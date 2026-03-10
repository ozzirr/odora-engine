import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { cleanString } from "./lib/normalize";

type CategoryKey = "women" | "men" | "unisex";

type CliOptions = {
  dryRun: boolean;
  pages: number;
  delayMs: number;
  timeoutMs: number;
  outputDir: string;
  userAgent: string;
  categories: CategoryKey[];
};

type CategoryConfig = {
  key: CategoryKey;
  label: string;
  gender: "WOMEN" | "MEN" | "UNISEX";
  baseUrl: string;
  outputFileName: string;
};

type TopEntry = {
  brand: string;
  name: string;
  parfumoUrl: string;
  gender: "WOMEN" | "MEN" | "UNISEX";
  rank?: number;
  rating?: number;
  votes?: number;
  imageUrl: string;
};

const BASE_DOMAIN = "https://www.parfumo.com";

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    key: "women",
    label: "Women",
    gender: "WOMEN",
    baseUrl: "https://www.parfumo.com/Perfumes/Tops/Women",
    outputFileName: "parfumo-top-women.csv",
  },
  {
    key: "men",
    label: "Men",
    gender: "MEN",
    baseUrl: "https://www.parfumo.com/Perfumes/Tops/Men",
    outputFileName: "parfumo-top-men.csv",
  },
  {
    key: "unisex",
    label: "Unisex",
    gender: "UNISEX",
    baseUrl: "https://www.parfumo.com/Perfumes/Tops/Unisex",
    outputFileName: "parfumo-top-unisex.csv",
  },
];

const OUTPUT_HEADERS = [
  "brand",
  "name",
  "parfumo_url",
  "gender",
  "rank",
  "rating",
  "votes",
  "year",
  "top_notes",
  "heart_notes",
  "base_notes",
  "family",
  "image_url",
  "notes",
];

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    pages: 5,
    delayMs: 300,
    timeoutMs: 20000,
    outputDir: "data/import",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122 Safari/537.36",
    categories: ["women", "men", "unisex"],
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg.startsWith("--pages=")) {
      const parsed = Number.parseInt(arg.replace("--pages=", ""), 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.pages = parsed;
      }
      continue;
    }

    if (arg.startsWith("--delay-ms=")) {
      const parsed = Number.parseInt(arg.replace("--delay-ms=", ""), 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        options.delayMs = parsed;
      }
      continue;
    }

    if (arg.startsWith("--timeout-ms=")) {
      const parsed = Number.parseInt(arg.replace("--timeout-ms=", ""), 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.timeoutMs = parsed;
      }
      continue;
    }

    if (arg.startsWith("--output-dir=")) {
      const value = cleanString(arg.replace("--output-dir=", ""));
      if (value) {
        options.outputDir = value;
      }
      continue;
    }

    if (arg.startsWith("--categories=")) {
      const values = arg
        .replace("--categories=", "")
        .split(",")
        .map((item) => cleanString(item).toLowerCase())
        .filter((item): item is CategoryKey => item === "women" || item === "men" || item === "unisex");

      if (values.length > 0) {
        options.categories = [...new Set(values)];
      }
      continue;
    }
  }

  return options;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeAbortSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

function decodeHtmlEntities(input: string): string {
  const named: Record<string, string> = {
    "&amp;": "&",
    "&quot;": "\"",
    "&#39;": "'",
    "&apos;": "'",
    "&lt;": "<",
    "&gt;": ">",
    "&nbsp;": " ",
    "&uuml;": "ü",
    "&Uuml;": "Ü",
    "&ouml;": "ö",
    "&Ouml;": "Ö",
    "&auml;": "ä",
    "&Auml;": "Ä",
    "&eacute;": "é",
    "&Eacute;": "É",
    "&egrave;": "è",
    "&Egrave;": "È",
    "&agrave;": "à",
    "&Agrave;": "À",
  };

  let value = input;
  for (const [entity, decoded] of Object.entries(named)) {
    value = value.replaceAll(entity, decoded);
  }

  value = value.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number.parseInt(dec, 10)));
  value = value.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
  return value;
}

function stripHtml(input: string): string {
  const withoutTags = input.replace(/<[^>]+>/g, " ");
  const decoded = decodeHtmlEntities(withoutTags);
  return cleanString(decoded);
}

function normalizeUrl(value: string): string {
  const raw = cleanString(decodeHtmlEntities(value));
  if (!raw) {
    return "";
  }

  try {
    const parsed = new URL(raw, BASE_DOMAIN);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

function parseTopEntriesFromHtml(html: string, gender: TopEntry["gender"]): TopEntry[] {
  const entryPattern =
    /<span class="place text-md">(\d+)<\/span>[\s\S]*?<div class="image">\s*<a href="([^"]+)"><img src="([^"]+)"[\s\S]*?<div class="name">\s*<a href="[^"]+">([\s\S]*?)<\/a>\s*<span class="brand">\s*-\s*<a href="[^"]+">([\s\S]*?)<\/a>[\s\S]*?<div class="av av_scent">\s*([0-9]+(?:\.[0-9]+)?)\s*<span class="tv"><i[^>]*><\/i>\s*([0-9.,\s]+)/g;

  const entries: TopEntry[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(entryPattern)) {
    const perfumeUrl = normalizeUrl(match[2] ?? "");
    const imageUrl = normalizeUrl(match[3] ?? "");
    const name = stripHtml(match[4] ?? "");
    const brand = stripHtml(match[5] ?? "");
    const rank = Number.parseInt(match[1] ?? "", 10);
    const rating = Number.parseFloat(match[6] ?? "");
    const votes = Number.parseInt(cleanString(match[7] ?? "").replace(/[^\d]/g, ""), 10);

    if (!perfumeUrl || !name || !brand || seen.has(perfumeUrl)) {
      continue;
    }

    seen.add(perfumeUrl);
    entries.push({
      brand,
      name,
      parfumoUrl: perfumeUrl,
      gender,
      rank: Number.isFinite(rank) ? rank : undefined,
      rating: Number.isFinite(rating) ? rating : undefined,
      votes: Number.isFinite(votes) ? votes : undefined,
      imageUrl,
    });
  }

  return entries;
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

function entriesToCsv(entries: TopEntry[]): string {
  const lines = [OUTPUT_HEADERS.join(",")];

  for (const entry of entries) {
    const row: Record<string, string> = {
      brand: entry.brand,
      name: entry.name,
      parfumo_url: entry.parfumoUrl,
      gender: entry.gender,
      rank: entry.rank ? String(entry.rank) : "",
      rating: entry.rating ? entry.rating.toFixed(1) : "",
      votes: entry.votes ? String(entry.votes) : "",
      year: "",
      top_notes: "",
      heart_notes: "",
      base_notes: "",
      family: "",
      image_url: entry.imageUrl,
      notes: "",
    };

    lines.push(OUTPUT_HEADERS.map((header) => escapeCsvValue(row[header] ?? "")).join(","));
  }

  return `${lines.join("\n")}\n`;
}

async function fetchTopPageHtml(url: string, options: CliOptions): Promise<string> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9,it-IT;q=0.8,it;q=0.7",
      "User-Agent": options.userAgent,
    },
    signal: makeAbortSignal(options.timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

async function fetchCategoryEntries(config: CategoryConfig, options: CliOptions): Promise<TopEntry[]> {
  const byUrl = new Map<string, TopEntry>();

  for (let page = 1; page <= options.pages; page += 1) {
    const url = new URL(config.baseUrl);
    url.searchParams.set("current_page", String(page));

    try {
      const html = await fetchTopPageHtml(url.toString(), options);
      const parsed = parseTopEntriesFromHtml(html, config.gender);

      for (const entry of parsed) {
        if (!byUrl.has(entry.parfumoUrl)) {
          byUrl.set(entry.parfumoUrl, entry);
        }
      }

      console.log(
        `[parfumo-tops-fetch] ${config.label} page ${page}/${options.pages}: parsed=${parsed.length} uniqueTotal=${byUrl.size}`,
      );
    } catch (error) {
      console.log(
        `[parfumo-tops-fetch] ${config.label} page ${page}/${options.pages}: failed (${error instanceof Error ? error.message : "unknown error"})`,
      );
    }

    if (page < options.pages && options.delayMs > 0) {
      await sleep(options.delayMs);
    }
  }

  return [...byUrl.values()].sort((a, b) => {
    const aRank = a.rank ?? Number.POSITIVE_INFINITY;
    const bRank = b.rank ?? Number.POSITIVE_INFINITY;
    if (aRank !== bRank) {
      return aRank - bRank;
    }
    return a.parfumoUrl.localeCompare(b.parfumoUrl);
  });
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const selectedConfigs = CATEGORY_CONFIGS.filter((config) => options.categories.includes(config.key));
  const outputDir = path.resolve(process.cwd(), options.outputDir);

  const summaries: Array<{ category: string; rows: number; outputPath: string }> = [];

  for (const config of selectedConfigs) {
    const entries = await fetchCategoryEntries(config, options);
    const outputPath = path.join(outputDir, config.outputFileName);

    if (!options.dryRun) {
      await mkdir(outputDir, { recursive: true });
      await writeFile(outputPath, entriesToCsv(entries), "utf8");
    }

    summaries.push({
      category: config.label,
      rows: entries.length,
      outputPath,
    });
  }

  console.log("[parfumo-tops-fetch] summary");
  console.log(`dry run: ${options.dryRun}`);
  console.log(`pages per category: ${options.pages}`);
  console.log(`output dir: ${outputDir}`);
  for (const summary of summaries) {
    console.log(
      `[parfumo-tops-fetch] ${summary.category}: rows=${summary.rows} file=${summary.outputPath}`,
    );
  }
}

main().catch((error) => {
  console.error("[parfumo-tops-fetch] failed:", error);
  process.exitCode = 1;
});

import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { mapFamily } from "./lib/mapFamily";
import { mapGender } from "./lib/mapGender";
import { cleanString, normalizeCsvHeader, normalizeRating, normalizeYear, splitNotes } from "./lib/normalize";
import { slugify } from "./lib/slug";

type CategoryKey = "women" | "men" | "unisex";

type CategorySource = {
  key: CategoryKey;
  label: string;
  defaultGender: "WOMEN" | "MEN" | "UNISEX";
  inputPath: string;
};

type CliOptions = {
  dryRun: boolean;
  outputPath: string;
  minVotes: number;
  minRating: number;
  limitPerCategory?: number;
  sources: Record<CategoryKey, string>;
};

type RowObject = Record<string, string>;

type ParsedSourceRecord = {
  sourceFile: string;
  sourceRow: number;
  category: CategoryKey;
  brand: string;
  name: string;
  slug: string;
  parfumoUrl: string;
  gender: "MEN" | "WOMEN" | "UNISEX";
  rank?: number;
  rating?: number;
  votes?: number;
  year?: number;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  family: string;
  imageSourceUrl: string;
};

type SourceLoadResult = {
  source: CategorySource;
  loaded: boolean;
  rowsRead: number;
  rowsAccepted: number;
  skippedThreshold: number;
  skippedInvalid: number;
  records: ParsedSourceRecord[];
};

type ImportStats = {
  sourcesLoaded: number;
  sourceFilesMissing: number;
  sourceRowsRead: number;
  sourceRowsAccepted: number;
  skippedThreshold: number;
  skippedInvalid: number;
  duplicatesExistingSlug: number;
  duplicatesInSource: number;
  rowsToAppend: number;
};

const DEFAULT_OUTPUT_PATH = "data/verified/perfumes.csv";

const DEFAULT_SOURCES: Record<CategoryKey, string> = {
  women: "data/import/parfumo-top-women.csv",
  men: "data/import/parfumo-top-men.csv",
  unisex: "data/import/parfumo-top-unisex.csv",
};

const REQUIRED_HEADERS = [
  "brand",
  "name",
  "gender",
  "year",
  "top_notes",
  "heart_notes",
  "base_notes",
  "family",
  "rating",
  "imageUrl",
  "image_source_url",
  "image_storage_path",
  "image_public_url",
  "description_short",
  "description_long",
  "price_range",
  "is_arabic",
  "is_niche",
  "catalog_status",
  "source_name",
  "source_type",
  "official_source_url",
  "source_confidence",
  "data_quality",
  "slug",
];

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    outputPath: DEFAULT_OUTPUT_PATH,
    minVotes: 0,
    minRating: 0,
    sources: { ...DEFAULT_SOURCES },
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg.startsWith("--output=")) {
      const value = cleanString(arg.replace("--output=", ""));
      if (value) {
        options.outputPath = value;
      }
      continue;
    }

    if (arg.startsWith("--min-votes=")) {
      const parsed = Number.parseInt(arg.replace("--min-votes=", ""), 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        options.minVotes = parsed;
      }
      continue;
    }

    if (arg.startsWith("--min-rating=")) {
      const parsed = Number.parseFloat(arg.replace("--min-rating=", "").replace(",", "."));
      if (Number.isFinite(parsed) && parsed >= 0) {
        options.minRating = parsed;
      }
      continue;
    }

    if (arg.startsWith("--limit-per-category=")) {
      const parsed = Number.parseInt(arg.replace("--limit-per-category=", ""), 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.limitPerCategory = parsed;
      }
      continue;
    }

    if (arg.startsWith("--input-women=")) {
      const value = cleanString(arg.replace("--input-women=", ""));
      if (value) {
        options.sources.women = value;
      }
      continue;
    }

    if (arg.startsWith("--input-men=")) {
      const value = cleanString(arg.replace("--input-men=", ""));
      if (value) {
        options.sources.men = value;
      }
      continue;
    }

    if (arg.startsWith("--input-unisex=")) {
      const value = cleanString(arg.replace("--input-unisex=", ""));
      if (value) {
        options.sources.unisex = value;
      }
      continue;
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
    lines.push(headers.map((header) => escapeCsvValue(row[header] ?? "")).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function parseVotes(rawValue: string | undefined): number | undefined {
  if (!rawValue) {
    return undefined;
  }

  const cleaned = cleanString(rawValue).replace(/[^\d]/g, "");
  if (!cleaned) {
    return undefined;
  }

  const parsed = Number.parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseRank(rawValue: string | undefined): number | undefined {
  if (!rawValue) {
    return undefined;
  }

  const cleaned = cleanString(rawValue).replace(/[^\d]/g, "");
  if (!cleaned) {
    return undefined;
  }

  const parsed = Number.parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseUrl(rawValue: string | undefined): string {
  if (!rawValue) {
    return "";
  }

  const value = cleanString(rawValue);
  if (!value) {
    return "";
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return value;
  } catch {
    return "";
  }
}

function getValue(row: RowObject, aliases: string[]): string | undefined {
  for (const alias of aliases) {
    const direct = row[alias];
    if (typeof direct === "string" && cleanString(direct).length > 0) {
      return cleanString(direct);
    }

    const normalized = row[normalizeCsvHeader(alias)];
    if (typeof normalized === "string" && cleanString(normalized).length > 0) {
      return cleanString(normalized);
    }
  }

  return undefined;
}

function dedupeNotes(notes: string[]): string[] {
  const seen = new Set<string>();
  const values: string[] = [];

  for (const note of notes) {
    const key = note.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    values.push(note);
  }

  return values;
}

function buildNoteGroups(row: RowObject) {
  const topNotes = splitNotes(getValue(row, ["top_notes", "topnotes"]));
  const heartNotes = splitNotes(getValue(row, ["heart_notes", "heartnotes", "middle_notes", "middlenotes"]));
  const baseNotes = splitNotes(getValue(row, ["base_notes", "basenotes"]));
  const genericNotes = splitNotes(getValue(row, ["notes", "note_list", "all_notes"]));

  if (topNotes.length === 0 && heartNotes.length === 0 && baseNotes.length === 0 && genericNotes.length > 0) {
    return {
      top: dedupeNotes(genericNotes.slice(0, 3)),
      heart: dedupeNotes(genericNotes.slice(3, 6)),
      base: dedupeNotes(genericNotes.slice(6, 9)),
    };
  }

  const top = [...topNotes];
  const heart = [...heartNotes];
  const base = [...baseNotes];

  for (const note of genericNotes) {
    const key = note.toLowerCase();
    const exists =
      top.some((item) => item.toLowerCase() === key) ||
      heart.some((item) => item.toLowerCase() === key) ||
      base.some((item) => item.toLowerCase() === key);

    if (!exists) {
      heart.push(note);
    }
  }

  return {
    top: dedupeNotes(top),
    heart: dedupeNotes(heart),
    base: dedupeNotes(base),
  };
}

function toSourceRowObject(headers: string[], values: string[]): RowObject {
  const row: RowObject = {};
  for (let index = 0; index < headers.length; index += 1) {
    row[headers[index]] = values[index] ?? "";
  }
  return row;
}

async function loadSource(source: CategorySource, options: CliOptions): Promise<SourceLoadResult> {
  const resolvedPath = path.resolve(process.cwd(), source.inputPath);

  try {
    await access(resolvedPath);
  } catch {
    return {
      source,
      loaded: false,
      rowsRead: 0,
      rowsAccepted: 0,
      skippedThreshold: 0,
      skippedInvalid: 0,
      records: [],
    };
  }

  const content = await readFile(resolvedPath, "utf8");
  const parsedRows = parseCsvRows(content);
  if (parsedRows.length === 0) {
    return {
      source,
      loaded: true,
      rowsRead: 0,
      rowsAccepted: 0,
      skippedThreshold: 0,
      skippedInvalid: 0,
      records: [],
    };
  }

  const headers = parsedRows[0].map((header) => normalizeCsvHeader(header));
  const dataRows = parsedRows.slice(1);

  let rowsAccepted = 0;
  let skippedThreshold = 0;
  let skippedInvalid = 0;
  const records: ParsedSourceRecord[] = [];

  for (let index = 0; index < dataRows.length; index += 1) {
    const sourceRow = index + 2;
    const values = dataRows[index];

    if (values.length !== headers.length) {
      skippedInvalid += 1;
      continue;
    }

    const row = toSourceRowObject(headers, values);
    const brand = getValue(row, ["brand", "brand_name", "house"]);
    const name = getValue(row, ["name", "perfume_name", "perfume"]);

    if (!brand || !name) {
      skippedInvalid += 1;
      continue;
    }

    const votes = parseVotes(getValue(row, ["votes", "vote_count", "num_votes"]));
    const rating = normalizeRating(getValue(row, ["rating", "score", "community_rating"]));
    const rank = parseRank(getValue(row, ["rank", "position"]));
    const year = normalizeYear(getValue(row, ["year", "release_year", "releaseyear"]));
    const parfumoUrl = parseUrl(getValue(row, ["parfumo_url", "url", "perfume_url"]));

    if (options.minVotes > 0 && (!votes || votes < options.minVotes)) {
      skippedThreshold += 1;
      continue;
    }

    if (options.minRating > 0 && (!rating || rating < options.minRating)) {
      skippedThreshold += 1;
      continue;
    }

    const noteGroups = buildNoteGroups(row);
    const allNotes = [...noteGroups.top, ...noteGroups.heart, ...noteGroups.base];

    const familyInput = getValue(row, ["family", "fragrance_family", "category", "main_accord"]);
    const family = familyInput ? cleanString(familyInput) : mapFamily(undefined, allNotes);

    const genderInput = getValue(row, ["gender"]);
    const mappedGender = mapGender(genderInput ?? source.defaultGender);

    const record: ParsedSourceRecord = {
      sourceFile: source.inputPath,
      sourceRow,
      category: source.key,
      brand,
      name,
      slug: slugify(`${brand}-${name}`),
      parfumoUrl,
      gender: mappedGender,
      rank,
      rating,
      votes,
      year,
      topNotes: noteGroups.top,
      heartNotes: noteGroups.heart,
      baseNotes: noteGroups.base,
      family: family || "Aromatic",
      imageSourceUrl: parseUrl(getValue(row, ["image_url", "image", "imageurl"])),
    };

    records.push(record);
    rowsAccepted += 1;
  }

  const sortedRecords = records.sort((a, b) => {
    const aRank = a.rank ?? Number.POSITIVE_INFINITY;
    const bRank = b.rank ?? Number.POSITIVE_INFINITY;
    if (aRank !== bRank) {
      return aRank - bRank;
    }

    const ratingDelta = (b.rating ?? 0) - (a.rating ?? 0);
    if (ratingDelta !== 0) {
      return ratingDelta;
    }

    return (b.votes ?? 0) - (a.votes ?? 0);
  });

  const limitedRecords =
    options.limitPerCategory && options.limitPerCategory > 0
      ? sortedRecords.slice(0, options.limitPerCategory)
      : sortedRecords;

  return {
    source,
    loaded: true,
    rowsRead: dataRows.length,
    rowsAccepted,
    skippedThreshold,
    skippedInvalid,
    records: limitedRecords,
  };
}

function ensureHeaders(headers: string[]): string[] {
  const normalizedSet = new Set(headers.map((header) => normalizeCsvHeader(header)));
  const next = [...headers];

  for (const required of REQUIRED_HEADERS) {
    const normalized = normalizeCsvHeader(required);
    if (!normalizedSet.has(normalized)) {
      next.push(required);
      normalizedSet.add(normalized);
    }
  }

  return next;
}

function getHeaderAliasMap(headers: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const header of headers) {
    const normalized = normalizeCsvHeader(header);
    if (!normalized || map.has(normalized)) {
      continue;
    }
    map.set(normalized, header);
  }
  return map;
}

function setRowValue(
  row: RowObject,
  headers: string[],
  aliasMap: Map<string, string>,
  key: string,
  value: string,
) {
  const normalized = normalizeCsvHeader(key);
  const header = aliasMap.get(normalized) ?? key;

  if (!headers.includes(header)) {
    headers.push(header);
    aliasMap.set(normalized, header);
  }

  row[header] = value;
}

function buildDescriptions(record: ParsedSourceRecord) {
  const notesSample = [...record.topNotes, ...record.heartNotes, ...record.baseNotes].slice(0, 3);
  const notesText = notesSample.length > 0 ? ` with notes of ${notesSample.join(", ")}` : "";

  const shortDescription = `${record.name} by ${record.brand} is a ${record.family.toLowerCase()} fragrance from Parfumo Top lists${notesText}.`;

  const top = record.topNotes.length > 0 ? record.topNotes.join(", ") : "a bright opening";
  const heart = record.heartNotes.length > 0 ? record.heartNotes.join(", ") : "a balanced heart";
  const base = record.baseNotes.length > 0 ? record.baseNotes.join(", ") : "a lasting base";
  const longDescription = `${record.name} by ${record.brand} belongs to the ${record.family.toLowerCase()} family with top notes of ${top}, heart notes of ${heart}, and base notes of ${base}.`;

  return {
    shortDescription,
    longDescription,
  };
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const outputPath = path.resolve(process.cwd(), options.outputPath);

  await access(outputPath);

  const categorySources: CategorySource[] = [
    { key: "women", label: "Women", defaultGender: "WOMEN", inputPath: options.sources.women },
    { key: "men", label: "Men", defaultGender: "MEN", inputPath: options.sources.men },
    { key: "unisex", label: "Unisex", defaultGender: "UNISEX", inputPath: options.sources.unisex },
  ];

  const sourceResults = await Promise.all(categorySources.map((source) => loadSource(source, options)));

  const outputContent = await readFile(outputPath, "utf8");
  const outputRows = parseCsvRows(outputContent);
  if (outputRows.length === 0) {
    throw new Error(`Target CSV is empty: ${outputPath}`);
  }

  const headers = ensureHeaders([...outputRows[0]]);
  const aliasMap = getHeaderAliasMap(headers);
  const existingRows = outputRows.slice(1).map((values) => toSourceRowObject(outputRows[0], values));

  const existingSlugs = new Set<string>();
  for (const row of existingRows) {
    const slugHeader = aliasMap.get(normalizeCsvHeader("slug")) ?? "slug";
    const slug = cleanString(row[slugHeader]);
    if (slug) {
      existingSlugs.add(slug);
    }
  }

  const stats: ImportStats = {
    sourcesLoaded: sourceResults.filter((result) => result.loaded).length,
    sourceFilesMissing: sourceResults.filter((result) => !result.loaded).length,
    sourceRowsRead: sourceResults.reduce((sum, result) => sum + result.rowsRead, 0),
    sourceRowsAccepted: sourceResults.reduce((sum, result) => sum + result.records.length, 0),
    skippedThreshold: sourceResults.reduce((sum, result) => sum + result.skippedThreshold, 0),
    skippedInvalid: sourceResults.reduce((sum, result) => sum + result.skippedInvalid, 0),
    duplicatesExistingSlug: 0,
    duplicatesInSource: 0,
    rowsToAppend: 0,
  };

  const pendingRows: RowObject[] = [];
  const pendingSlugs = new Set<string>();

  for (const result of sourceResults) {
    for (const record of result.records) {
      if (existingSlugs.has(record.slug)) {
        stats.duplicatesExistingSlug += 1;
        continue;
      }

      if (pendingSlugs.has(record.slug)) {
        stats.duplicatesInSource += 1;
        continue;
      }

      const row: RowObject = {};
      for (const header of headers) {
        row[header] = "";
      }

      const descriptions = buildDescriptions(record);
      const brandSlug = slugify(record.brand);
      const imageStoragePath = `${brandSlug}/${record.slug}.jpg`;

      setRowValue(row, headers, aliasMap, "brand", record.brand);
      setRowValue(row, headers, aliasMap, "name", record.name);
      setRowValue(row, headers, aliasMap, "gender", record.gender);
      setRowValue(row, headers, aliasMap, "year", record.year ? String(record.year) : "");
      setRowValue(row, headers, aliasMap, "top_notes", record.topNotes.join(";"));
      setRowValue(row, headers, aliasMap, "heart_notes", record.heartNotes.join(";"));
      setRowValue(row, headers, aliasMap, "base_notes", record.baseNotes.join(";"));
      setRowValue(row, headers, aliasMap, "family", record.family);
      setRowValue(row, headers, aliasMap, "rating", record.rating ? String(record.rating) : "");
      setRowValue(row, headers, aliasMap, "imageUrl", "");
      setRowValue(row, headers, aliasMap, "image_source_url", record.imageSourceUrl);
      setRowValue(row, headers, aliasMap, "image_storage_path", imageStoragePath);
      setRowValue(row, headers, aliasMap, "image_public_url", "");
      setRowValue(row, headers, aliasMap, "description_short", descriptions.shortDescription);
      setRowValue(row, headers, aliasMap, "description_long", descriptions.longDescription);
      setRowValue(row, headers, aliasMap, "price_range", "MID");
      setRowValue(row, headers, aliasMap, "is_arabic", "false");
      setRowValue(row, headers, aliasMap, "is_niche", "false");
      setRowValue(row, headers, aliasMap, "catalog_status", "VERIFIED");
      setRowValue(row, headers, aliasMap, "source_name", "Parfumo Top List");
      setRowValue(row, headers, aliasMap, "source_type", "OTHER");
      setRowValue(row, headers, aliasMap, "official_source_url", record.parfumoUrl);
      setRowValue(row, headers, aliasMap, "source_confidence", "0.90");
      setRowValue(row, headers, aliasMap, "data_quality", "HIGH");
      setRowValue(row, headers, aliasMap, "slug", record.slug);

      pendingRows.push(row);
      pendingSlugs.add(record.slug);
    }
  }

  stats.rowsToAppend = pendingRows.length;

  if (!options.dryRun && pendingRows.length > 0) {
    const mergedRows = [...existingRows.map((row) => {
      const next: RowObject = {};
      for (const header of headers) {
        next[header] = row[header] ?? "";
      }
      return next;
    }), ...pendingRows];

    const output = toCsv(headers, mergedRows);
    await writeFile(outputPath, output, "utf8");
  }

  console.log("[parfumo-tops] import summary");
  console.log(`target csv: ${outputPath}`);
  console.log(`dry run: ${options.dryRun}`);
  console.log(`min votes: ${options.minVotes}`);
  console.log(`min rating: ${options.minRating}`);
  console.log(`limit per category: ${options.limitPerCategory ?? "none"}`);
  console.log(`sources loaded: ${stats.sourcesLoaded}`);
  console.log(`source files missing: ${stats.sourceFilesMissing}`);
  console.log(`source rows read: ${stats.sourceRowsRead}`);
  console.log(`source rows accepted (after thresholds/limit): ${stats.sourceRowsAccepted}`);
  console.log(`skipped by thresholds: ${stats.skippedThreshold}`);
  console.log(`skipped invalid rows: ${stats.skippedInvalid}`);
  console.log(`duplicates (existing slug): ${stats.duplicatesExistingSlug}`);
  console.log(`duplicates (in source): ${stats.duplicatesInSource}`);
  console.log(`new VERIFIED rows to append: ${stats.rowsToAppend}`);

  for (const result of sourceResults) {
    console.log(
      `[parfumo-tops] ${result.source.label}: loaded=${result.loaded} read=${result.rowsRead} accepted=${result.records.length} skippedThreshold=${result.skippedThreshold} skippedInvalid=${result.skippedInvalid} file=${result.source.inputPath}`,
    );
  }
}

main().catch((error) => {
  console.error("[parfumo-tops] failed:", error);
  process.exitCode = 1;
});

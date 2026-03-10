import { access, readFile } from "node:fs/promises";
import path from "node:path";

import {
  CatalogStatus,
  DataQuality,
  Gender,
  NoteType,
  PriceRange,
  Prisma,
  PrismaClient,
  SourceType,
} from "@prisma/client";

import { mapFamily } from "./lib/mapFamily";
import { mapGender } from "./lib/mapGender";
import { cleanString, normalizeCsvHeader, normalizeRating, normalizeYear, splitNotes } from "./lib/normalize";
import { slugify } from "./lib/slug";

type CliOptions = {
  inputPath: string;
  format: "auto" | "csv" | "json";
  limit?: number;
  dryRun: boolean;
  batchSize: number;
  notesOnly: boolean;
};

type RawRecord = Record<string, unknown>;

type NormalizedRecord = {
  sourceRow: number;
  brandName: string;
  brandSlug: string;
  perfumeName: string;
  perfumeSlug: string;
  gender: Gender;
  releaseYear?: number;
  descriptionShort: string;
  descriptionLong: string;
  fragranceFamily: string;
  priceRange: PriceRange;
  imageUrl?: string;
  ratingInternal?: number;
  isArabic: boolean;
  isNiche: boolean;
  catalogStatus: CatalogStatus;
  sourceName: string;
  sourceType: SourceType;
  officialSourceUrl?: string;
  sourceConfidence: number;
  dataQuality: DataQuality;
  notes: {
    top: string[];
    heart: string[];
    base: string[];
  };
};

type Stats = {
  rowsRead: number;
  validRows: number;
  processedRows: number;
  malformedRows: number;
  invalidRows: number;
  skippedRows: number;
  insertedBrands: number;
  insertedPerfumes: number;
  updatedPerfumes: number;
  insertedNotes: number;
  insertedPerfumeNotes: number;
  matchedPerfumesBySlug: number;
  matchedPerfumesByNameFallback: number;
  missingPerfumeMatches: number;
};

type CachedBrand = {
  id: number;
  name: string;
};

type CachedNote = {
  id: number;
  slug: string;
  noteType: NoteType;
  name: string;
};

const DEFAULT_INPUT_PATH = "data/verified/perfumes.csv";

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    inputPath: DEFAULT_INPUT_PATH,
    format: "auto",
    dryRun: false,
    batchSize: 100,
    notesOnly: false,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--notes-only") {
      options.notesOnly = true;
      continue;
    }

    if (arg.startsWith("--input=")) {
      options.inputPath = arg.replace("--input=", "");
      continue;
    }

    if (arg.startsWith("--format=")) {
      const formatValue = arg.replace("--format=", "").toLowerCase();
      if (formatValue === "csv" || formatValue === "json" || formatValue === "auto") {
        options.format = formatValue;
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

    if (arg.startsWith("--batch-size=")) {
      const parsed = Number.parseInt(arg.replace("--batch-size=", ""), 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.batchSize = parsed;
      }
      continue;
    }
  }

  return options;
}

function makePerfumeLookupKey(brandValue: string, perfumeName: string): string {
  return `${slugify(brandValue)}::${cleanString(perfumeName).toLowerCase()}`;
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

function parseCsv(content: string): { rawRecords: RawRecord[]; malformedRows: string[] } {
  const rows = parseCsvRows(content);
  if (rows.length < 2) {
    return { rawRecords: [], malformedRows: ["CSV has no data rows."] };
  }

  const headers = rows[0].map((value) => normalizeCsvHeader(value));
  const malformedRows: string[] = [];
  const rawRecords: RawRecord[] = [];

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    const sourceRow = index + 1;

    if (row.length !== headers.length) {
      malformedRows.push(`row ${sourceRow}: expected ${headers.length} columns, found ${row.length}`);
      continue;
    }

    const record: RawRecord = {};
    for (let col = 0; col < headers.length; col += 1) {
      record[headers[col]] = row[col] ?? "";
    }
    rawRecords.push(record);
  }

  return { rawRecords, malformedRows };
}

function parseJson(content: string): { rawRecords: RawRecord[]; malformedRows: string[] } {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) {
      return { rawRecords: [], malformedRows: ["JSON must be an array of records."] };
    }

    const rawRecords = parsed
      .map((item) => (typeof item === "object" && item !== null ? (item as RawRecord) : null))
      .filter((item): item is RawRecord => item !== null);

    return { rawRecords, malformedRows: [] };
  } catch (error) {
    return {
      rawRecords: [],
      malformedRows: [`invalid JSON: ${error instanceof Error ? error.message : "unknown parse error"}`],
    };
  }
}

function getRecordValue(record: RawRecord, aliases: string[]): unknown {
  for (const alias of aliases) {
    const direct = record[alias];
    if (direct !== undefined && direct !== null && cleanString(String(direct)).length > 0) {
      return direct;
    }

    const normalized = record[normalizeCsvHeader(alias)];
    if (normalized !== undefined && normalized !== null && cleanString(String(normalized)).length > 0) {
      return normalized;
    }
  }

  return undefined;
}

function toStringValue(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const cleaned = cleanString(String(value));
  return cleaned.length > 0 ? cleaned : undefined;
}

function toBooleanValue(value: unknown, defaultValue = false): boolean {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  const normalized = cleanString(String(value)).toLowerCase();
  if (["1", "true", "yes", "y", "si", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "n", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function parsePriceRange(value: unknown): PriceRange {
  const normalized = cleanString(String(value ?? "")).toLowerCase();

  if (!normalized) {
    return PriceRange.MID;
  }
  if (normalized.includes("budget") || normalized.includes("low")) {
    return PriceRange.BUDGET;
  }
  if (normalized.includes("premium") || normalized.includes("high")) {
    return PriceRange.PREMIUM;
  }
  if (normalized.includes("luxury")) {
    return PriceRange.LUXURY;
  }

  return PriceRange.MID;
}

function parseCatalogStatus(value: unknown): CatalogStatus {
  const normalized = cleanString(String(value ?? "")).toUpperCase();

  if (normalized === "VERIFIED") {
    return CatalogStatus.VERIFIED;
  }
  if (normalized === "IMPORTED_UNVERIFIED") {
    return CatalogStatus.IMPORTED_UNVERIFIED;
  }
  if (normalized === "DEMO") {
    return CatalogStatus.DEMO;
  }

  return CatalogStatus.VERIFIED;
}

function parseSourceType(value: unknown): SourceType {
  const normalized = cleanString(String(value ?? "")).toUpperCase();

  if (normalized === "MANUAL_CURATION") {
    return SourceType.MANUAL_CURATION;
  }
  if (normalized === "COMMERCIAL_LICENSED") {
    return SourceType.COMMERCIAL_LICENSED;
  }
  if (normalized === "BRAND_OFFICIAL") {
    return SourceType.BRAND_OFFICIAL;
  }
  if (normalized === "PARTNER_FEED") {
    return SourceType.PARTNER_FEED;
  }
  if (normalized === "INTERNAL_DEMO") {
    return SourceType.INTERNAL_DEMO;
  }

  return SourceType.OTHER;
}

function parseDataQuality(value: unknown): DataQuality {
  const normalized = cleanString(String(value ?? "")).toUpperCase();

  if (normalized === "HIGH") {
    return DataQuality.HIGH;
  }
  if (normalized === "LOW") {
    return DataQuality.LOW;
  }

  return DataQuality.MEDIUM;
}

function parseSourceConfidence(value: unknown, fallback = 0.9): number {
  if (value === undefined || value === null || cleanString(String(value)).length === 0) {
    return fallback;
  }

  const parsed = Number.parseFloat(cleanString(String(value)).replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  if (parsed > 1) {
    return Math.min(Math.max(parsed / 100, 0), 1);
  }

  return Math.min(Math.max(parsed, 0), 1);
}

function parseNotesField(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => cleanString(String(item)))
      .filter((item): item is string => item.length > 0);
  }

  return splitNotes(toStringValue(value));
}

function collectUniqueNotes(notes: { top: string[]; heart: string[]; base: string[] }): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const note of [...notes.top, ...notes.heart, ...notes.base]) {
    const key = note.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(note);
  }

  return result;
}

function composeShortDescription(params: {
  brandName: string;
  perfumeName: string;
  family: string;
  notes: string[];
}): string {
  const sampleNotes = params.notes.slice(0, 3).join(", ");
  if (!sampleNotes) {
    return `${params.perfumeName} by ${params.brandName}, ${params.family.toLowerCase()} profile.`;
  }

  return `${params.perfumeName} by ${params.brandName}, ${params.family.toLowerCase()} profile with ${sampleNotes}.`;
}

function composeLongDescription(params: {
  brandName: string;
  perfumeName: string;
  family: string;
  top: string[];
  heart: string[];
  base: string[];
}): string {
  const top = params.top.length ? params.top.join(", ") : "a clean opening";
  const heart = params.heart.length ? params.heart.join(", ") : "a balanced heart";
  const base = params.base.length ? params.base.join(", ") : "a persistent base";

  return `${params.perfumeName} by ${params.brandName} belongs to the ${params.family.toLowerCase()} family with top notes of ${top}, a heart of ${heart}, and a base of ${base}.`;
}

function normalizeRecord(record: RawRecord, sourceRow: number): { value?: NormalizedRecord; reason?: string } {
  const brandName = toStringValue(getRecordValue(record, ["brand", "brand_name", "house"]));
  const perfumeName = toStringValue(getRecordValue(record, ["name", "perfume_name", "perfume"]));

  if (!brandName || !perfumeName) {
    return { reason: "missing brand or perfume name" };
  }

  const topNotes = parseNotesField(getRecordValue(record, ["top_notes", "topnotes", "notes_top"]));
  const heartNotes = parseNotesField(
    getRecordValue(record, ["heart_notes", "middle_notes", "middlenotes", "notes_heart"]),
  );
  const baseNotes = parseNotesField(getRecordValue(record, ["base_notes", "basenotes", "notes_base"]));

  const notes = {
    top: topNotes,
    heart: heartNotes,
    base: baseNotes,
  };
  const uniqueNotes = collectUniqueNotes(notes);

  const inputFamily = toStringValue(getRecordValue(record, ["family", "fragrance_family", "fragrancefamily"]));
  const family = inputFamily ?? mapFamily(undefined, uniqueNotes);

  const descriptionShort =
    toStringValue(getRecordValue(record, ["description_short", "short_description", "descriptionshort"])) ??
    composeShortDescription({
      brandName,
      perfumeName,
      family,
      notes: uniqueNotes,
    });

  const descriptionLong =
    toStringValue(getRecordValue(record, ["description_long", "long_description", "descriptionlong", "description"])) ??
    composeLongDescription({
      brandName,
      perfumeName,
      family,
      top: notes.top,
      heart: notes.heart,
      base: notes.base,
    });

  const imageUrl = toStringValue(
    getRecordValue(record, ["image_public_url", "imagepublicurl", "image_url", "imageurl", "image"]),
  );
  const officialSourceUrl = toStringValue(
    getRecordValue(record, ["official_source_url", "officialsourceurl", "source_url", "sourceurl"]),
  );
  const sourceName = toStringValue(getRecordValue(record, ["source_name", "sourcename"])) ?? "Verified catalog import";

  return {
    value: {
      sourceRow,
      brandName,
      brandSlug: slugify(brandName),
      perfumeName,
      perfumeSlug:
        toStringValue(getRecordValue(record, ["slug", "perfume_slug"])) ?? slugify(`${brandName}-${perfumeName}`),
      gender: mapGender(toStringValue(getRecordValue(record, ["gender"]))),
      releaseYear: normalizeYear(
        toStringValue(getRecordValue(record, ["release_year", "releaseyear", "year", "launch_year"])),
      ),
      descriptionShort,
      descriptionLong,
      fragranceFamily: family,
      priceRange: parsePriceRange(getRecordValue(record, ["price_range", "pricerange", "price"])),
      imageUrl: imageUrl && /^https?:\/\//i.test(imageUrl) ? imageUrl : undefined,
      ratingInternal: normalizeRating(
        toStringValue(getRecordValue(record, ["rating_internal", "rating", "score"])),
      ),
      isArabic: toBooleanValue(getRecordValue(record, ["is_arabic", "isarabic"]), false),
      isNiche: toBooleanValue(getRecordValue(record, ["is_niche", "isniche"]), false),
      catalogStatus: parseCatalogStatus(getRecordValue(record, ["catalog_status", "catalogstatus"])),
      sourceName,
      sourceType: parseSourceType(getRecordValue(record, ["source_type", "sourcetype"])),
      officialSourceUrl: officialSourceUrl && /^https?:\/\//i.test(officialSourceUrl) ? officialSourceUrl : undefined,
      sourceConfidence: parseSourceConfidence(getRecordValue(record, ["source_confidence", "sourceconfidence"]), 0.9),
      dataQuality: parseDataQuality(getRecordValue(record, ["data_quality", "dataquality"])),
      notes,
    },
  };
}

function splitIntoChunks<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const prisma = new PrismaClient();
  let tempId = -1;

  const stats: Stats = {
    rowsRead: 0,
    validRows: 0,
    processedRows: 0,
    malformedRows: 0,
    invalidRows: 0,
    skippedRows: 0,
    insertedBrands: 0,
    insertedPerfumes: 0,
    updatedPerfumes: 0,
    insertedNotes: 0,
    insertedPerfumeNotes: 0,
    matchedPerfumesBySlug: 0,
    matchedPerfumesByNameFallback: 0,
    missingPerfumeMatches: 0,
  };

  const invalidLogs: string[] = [];
  const malformedLogs: string[] = [];

  const resolvedPath = path.resolve(process.cwd(), options.inputPath);
  await access(resolvedPath);
  const content = await readFile(resolvedPath, "utf8");

  const resolvedFormat =
    options.format !== "auto"
      ? options.format
      : resolvedPath.toLowerCase().endsWith(".json")
        ? "json"
        : "csv";

  const parsed =
    resolvedFormat === "json"
      ? parseJson(content)
      : parseCsv(content);

  for (const malformed of parsed.malformedRows) {
    malformedLogs.push(malformed);
  }

  const rawRecords = options.limit ? parsed.rawRecords.slice(0, options.limit) : parsed.rawRecords;
  stats.rowsRead = rawRecords.length;

  const normalizedRows: NormalizedRecord[] = [];
  for (let index = 0; index < rawRecords.length; index += 1) {
    const sourceRow = index + 2;
    const normalized = normalizeRecord(rawRecords[index], sourceRow);
    if (!normalized.value) {
      stats.invalidRows += 1;
      if (invalidLogs.length < 10) {
        invalidLogs.push(`row ${sourceRow}: ${normalized.reason ?? "invalid record"}`);
      }
      continue;
    }

    normalizedRows.push(normalized.value);
  }

  stats.validRows = normalizedRows.length;

  const [existingBrands, existingNotes, existingPerfumes, existingPerfumeNotes] = await Promise.all([
    prisma.brand.findMany({ select: { id: true, slug: true, name: true } }),
    prisma.note.findMany({ select: { id: true, slug: true, name: true, noteType: true } }),
    prisma.perfume.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        brand: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    }),
    prisma.perfumeNote.findMany({
      select: {
        perfumeId: true,
        noteId: true,
      },
    }),
  ]);

  const brandsBySlug = new Map<string, CachedBrand>(
    existingBrands.map((brand) => [brand.slug, { id: brand.id, name: brand.name }]),
  );
  const noteBySlug = new Map<string, CachedNote>(
    existingNotes.map((note) => [
      note.slug,
      {
        id: note.id,
        slug: note.slug,
        name: note.name,
        noteType: note.noteType,
      },
    ]),
  );
  const noteByTypeKey = new Map<string, CachedNote>();
  const perfumeIdsBySlug = new Map<string, number>(existingPerfumes.map((perfume) => [perfume.slug, perfume.id]));
  const perfumeIdsByBrandSlugAndName = new Map<string, number>(
    existingPerfumes.map((perfume) => [makePerfumeLookupKey(perfume.brand.slug, perfume.name), perfume.id]),
  );
  const perfumeIdsByBrandNameAndName = new Map<string, number>(
    existingPerfumes.map((perfume) => [makePerfumeLookupKey(perfume.brand.name, perfume.name), perfume.id]),
  );
  const existingNoteIdsByPerfumeId = new Map<number, Set<number>>();

  for (const row of existingPerfumeNotes) {
    const noteIds = existingNoteIdsByPerfumeId.get(row.perfumeId) ?? new Set<number>();
    noteIds.add(row.noteId);
    existingNoteIdsByPerfumeId.set(row.perfumeId, noteIds);
  }

  for (const note of existingNotes) {
    noteByTypeKey.set(`${note.noteType}:${slugify(note.name)}`, {
      id: note.id,
      slug: note.slug,
      name: note.name,
      noteType: note.noteType,
    });
  }

  const createTempId = () => {
    const next = tempId;
    tempId -= 1;
    return next;
  };

  const ensureBrand = async (brandName: string, brandSlug: string): Promise<number> => {
    const cached = brandsBySlug.get(brandSlug);
    if (cached) {
      return cached.id;
    }

    if (options.dryRun) {
      const id = createTempId();
      brandsBySlug.set(brandSlug, { id, name: brandName });
      stats.insertedBrands += 1;
      return id;
    }

    try {
      const created = await prisma.brand.create({
        data: {
          name: brandName,
          slug: brandSlug,
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });
      brandsBySlug.set(created.slug, { id: created.id, name: created.name });
      stats.insertedBrands += 1;
      return created.id;
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const existing = await prisma.brand.findUnique({
        where: { slug: brandSlug },
        select: { id: true, name: true, slug: true },
      });
      if (!existing) {
        throw error;
      }
      brandsBySlug.set(existing.slug, { id: existing.id, name: existing.name });
      return existing.id;
    }
  };

  const ensureNote = async (rawName: string, noteType: NoteType): Promise<number> => {
    const noteName = cleanString(rawName);
    const key = `${noteType}:${slugify(noteName)}`;
    const cached = noteByTypeKey.get(key);
    if (cached) {
      return cached.id;
    }

    const baseSlug = slugify(noteName);
    let candidateSlug = baseSlug;
    const slugConflict = noteBySlug.get(candidateSlug);
    if (slugConflict && slugConflict.noteType !== noteType) {
      candidateSlug = `${baseSlug}-${noteType.toLowerCase()}`;
      let index = 2;
      while (noteBySlug.has(candidateSlug) && noteBySlug.get(candidateSlug)?.noteType !== noteType) {
        candidateSlug = `${baseSlug}-${noteType.toLowerCase()}-${index}`;
        index += 1;
      }
    }

    if (options.dryRun) {
      const note: CachedNote = {
        id: createTempId(),
        slug: candidateSlug,
        name: noteName,
        noteType,
      };
      noteBySlug.set(candidateSlug, note);
      noteByTypeKey.set(key, note);
      stats.insertedNotes += 1;
      return note.id;
    }

    try {
      const created = await prisma.note.create({
        data: {
          name: noteName,
          slug: candidateSlug,
          noteType,
        },
        select: {
          id: true,
          slug: true,
          name: true,
          noteType: true,
        },
      });

      const note: CachedNote = {
        id: created.id,
        slug: created.slug,
        name: created.name,
        noteType: created.noteType,
      };
      noteBySlug.set(created.slug, note);
      noteByTypeKey.set(key, note);
      stats.insertedNotes += 1;
      return note.id;
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const existing = await prisma.note.findUnique({
        where: { slug: candidateSlug },
        select: {
          id: true,
          slug: true,
          name: true,
          noteType: true,
        },
      });
      if (!existing) {
        throw error;
      }

      const note: CachedNote = {
        id: existing.id,
        slug: existing.slug,
        name: existing.name,
        noteType: existing.noteType,
      };
      noteBySlug.set(existing.slug, note);
      noteByTypeKey.set(key, note);
      return note.id;
    }
  };

  const processRecord = async (record: NormalizedRecord) => {
    const noteIds = new Set<number>();
    for (const note of record.notes.top) {
      noteIds.add(await ensureNote(note, NoteType.TOP));
    }
    for (const note of record.notes.heart) {
      noteIds.add(await ensureNote(note, NoteType.HEART));
    }
    for (const note of record.notes.base) {
      noteIds.add(await ensureNote(note, NoteType.BASE));
    }

    const brandSlugNameKey = makePerfumeLookupKey(record.brandSlug, record.perfumeName);
    const brandNameKey = makePerfumeLookupKey(record.brandName, record.perfumeName);

    const slugMatchedPerfumeId = perfumeIdsBySlug.get(record.perfumeSlug);
    const fallbackPerfumeId =
      perfumeIdsByBrandSlugAndName.get(brandSlugNameKey) ?? perfumeIdsByBrandNameAndName.get(brandNameKey);
    const matchedPerfumeId = slugMatchedPerfumeId ?? fallbackPerfumeId;

    if (options.notesOnly && !matchedPerfumeId) {
      stats.missingPerfumeMatches += 1;
      stats.skippedRows += 1;
      if (invalidLogs.length < 10) {
        invalidLogs.push(
          `row ${record.sourceRow}: perfume not found for notes-only enrichment (slug=${record.perfumeSlug})`,
        );
      }
      return;
    }

    if (options.dryRun) {
      if (slugMatchedPerfumeId) {
        stats.matchedPerfumesBySlug += 1;
      } else if (fallbackPerfumeId) {
        stats.matchedPerfumesByNameFallback += 1;
      }

      if (options.notesOnly && matchedPerfumeId) {
        const existingSet = existingNoteIdsByPerfumeId.get(matchedPerfumeId) ?? new Set<number>();
        let wouldInsert = 0;

        for (const noteId of noteIds) {
          if (!existingSet.has(noteId)) {
            existingSet.add(noteId);
            wouldInsert += 1;
          }
        }

        existingNoteIdsByPerfumeId.set(matchedPerfumeId, existingSet);
        stats.insertedPerfumeNotes += wouldInsert;
        stats.processedRows += 1;
        return;
      }

      if (slugMatchedPerfumeId) {
        stats.updatedPerfumes += 1;
      } else {
        const fakeId = createTempId();
        perfumeIdsBySlug.set(record.perfumeSlug, fakeId);
        stats.insertedPerfumes += 1;
      }

      stats.insertedPerfumeNotes += noteIds.size;
      stats.processedRows += 1;
      return;
    }

    if (options.notesOnly && matchedPerfumeId) {
      const result = await prisma.perfumeNote.createMany({
        data: [...noteIds].map((noteId) => ({
          perfumeId: matchedPerfumeId,
          noteId,
        })),
        skipDuplicates: true,
      });

      if (slugMatchedPerfumeId) {
        stats.matchedPerfumesBySlug += 1;
      } else if (fallbackPerfumeId) {
        stats.matchedPerfumesByNameFallback += 1;
      }

      stats.insertedPerfumeNotes += result.count;
      stats.processedRows += 1;
      return;
    }

    const brandId = await ensureBrand(record.brandName, record.brandSlug);
    const existingPerfumeId = slugMatchedPerfumeId;

    const perfume = await prisma.$transaction(async (tx) => {
      const upserted = await tx.perfume.upsert({
        where: {
          slug: record.perfumeSlug,
        },
        update: {
          brandId,
          name: record.perfumeName,
          gender: record.gender,
          descriptionShort: record.descriptionShort,
          descriptionLong: record.descriptionLong,
          fragranceFamily: record.fragranceFamily,
          priceRange: record.priceRange,
          releaseYear: record.releaseYear,
          isArabic: record.isArabic,
          isNiche: record.isNiche,
          imageUrl: record.imageUrl,
          ratingInternal: record.ratingInternal,
          catalogStatus: record.catalogStatus,
          sourceName: record.sourceName,
          sourceType: record.sourceType,
          officialSourceUrl: record.officialSourceUrl,
          sourceConfidence: record.sourceConfidence,
          dataQuality: record.dataQuality,
        },
        create: {
          brandId,
          name: record.perfumeName,
          slug: record.perfumeSlug,
          gender: record.gender,
          descriptionShort: record.descriptionShort,
          descriptionLong: record.descriptionLong,
          fragranceFamily: record.fragranceFamily,
          priceRange: record.priceRange,
          releaseYear: record.releaseYear,
          isArabic: record.isArabic,
          isNiche: record.isNiche,
          imageUrl: record.imageUrl,
          ratingInternal: record.ratingInternal,
          catalogStatus: record.catalogStatus,
          sourceName: record.sourceName,
          sourceType: record.sourceType,
          officialSourceUrl: record.officialSourceUrl,
          sourceConfidence: record.sourceConfidence,
          dataQuality: record.dataQuality,
        },
        select: {
          id: true,
          slug: true,
        },
      });

      if (noteIds.size > 0) {
        const result = await tx.perfumeNote.createMany({
          data: [...noteIds].map((noteId) => ({
            perfumeId: upserted.id,
            noteId,
          })),
          skipDuplicates: true,
        });
        stats.insertedPerfumeNotes += result.count;
      }

      return upserted;
    });

    perfumeIdsBySlug.set(perfume.slug, perfume.id);
    if (existingPerfumeId) {
      stats.updatedPerfumes += 1;
    } else {
      stats.insertedPerfumes += 1;
    }
    stats.processedRows += 1;
  };

  console.log(`[verified-import] source=${resolvedPath}`);
  console.log(
    `[verified-import] format=${resolvedFormat} dryRun=${options.dryRun} notesOnly=${options.notesOnly} limit=${options.limit ?? "none"} batchSize=${options.batchSize}`,
  );

  const batches = splitIntoChunks(normalizedRows, options.batchSize);
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
    const batch = batches[batchIndex];

    for (const record of batch) {
      try {
        await processRecord(record);
      } catch (error) {
        stats.skippedRows += 1;
        if (invalidLogs.length < 10) {
          invalidLogs.push(
            `row ${record.sourceRow}: ${error instanceof Error ? error.message : "unexpected processing error"}`,
          );
        }
      }
    }

    console.log(
      `[verified-import] batch ${batchIndex + 1}/${batches.length} completed (${Math.min(
        (batchIndex + 1) * options.batchSize,
        normalizedRows.length,
      )}/${normalizedRows.length})`,
    );
  }

  stats.malformedRows = malformedLogs.length;

  console.log("");
  console.log("Verified import summary");
  console.log("-----------------------");
  console.log(`rows read: ${stats.rowsRead}`);
  console.log(`valid rows: ${stats.validRows}`);
  console.log(`processed rows: ${stats.processedRows}`);
  console.log(`inserted brands: ${stats.insertedBrands}`);
  console.log(`inserted perfumes: ${stats.insertedPerfumes}`);
  console.log(`updated perfumes: ${stats.updatedPerfumes}`);
  console.log(`inserted notes: ${stats.insertedNotes}`);
  console.log(`inserted perfume-note relations: ${stats.insertedPerfumeNotes}`);
  console.log(`matched perfumes by slug: ${stats.matchedPerfumesBySlug}`);
  console.log(`matched perfumes by brand+name fallback: ${stats.matchedPerfumesByNameFallback}`);
  console.log(`missing perfume matches: ${stats.missingPerfumeMatches}`);
  console.log(`malformed rows: ${stats.malformedRows}`);
  console.log(`invalid rows: ${stats.invalidRows}`);
  console.log(`skipped rows: ${stats.skippedRows}`);

  if (malformedLogs.length > 0) {
    console.log("");
    console.log("Malformed samples:");
    for (const line of malformedLogs.slice(0, 10)) {
      console.log(`- ${line}`);
    }
  }

  if (invalidLogs.length > 0) {
    console.log("");
    console.log("Invalid samples:");
    for (const line of invalidLogs.slice(0, 10)) {
      console.log(`- ${line}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("[verified-import] failed:", error);
  process.exitCode = 1;
});

import { access, readFile } from "node:fs/promises";
import path from "node:path";

import {
  CatalogStatus,
  DataQuality,
  NoteType,
  PriceRange,
  Prisma,
  PrismaClient,
  SourceType,
  type Gender,
} from "@prisma/client";

import { mapFamily } from "./lib/mapFamily";
import { mapGender } from "./lib/mapGender";
import {
  cleanString,
  normalizeBoolean,
  normalizeCsvHeader,
  normalizeRating,
  normalizeYear,
  splitNotes,
} from "./lib/normalize";
import { slugify } from "./lib/slug";

type CliOptions = {
  dryRun: boolean;
  limit: number;
  batchSize: number;
  inputPath: string;
};

type ParsedRow = Record<string, string>;

type NormalizedPerfume = {
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
  invalidRows: number;
  malformedRows: number;
  duplicateRows: number;
  skippedRows: number;
  insertedBrands: number;
  insertedPerfumes: number;
  insertedNotes: number;
  insertedPerfumeNotes: number;
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

const DEFAULT_INPUT_PATH = "data/archive/synthetic/parfumo/perfumes.csv";

const CSV_COLUMNS = {
  brand: ["brand", "brandname", "house", "maker", "manufacturer"],
  perfumeName: ["perfumename", "perfume", "name", "fragrance", "title", "perfume_title"],
  gender: ["gender", "sex", "targetgender", "forgender"],
  year: ["year", "releaseyear", "launchyear", "released", "release"],
  family: ["fragrancefamily", "family", "category", "olfactivefamily", "mainaccord", "mainaccords"],
  topNotes: ["topnotes", "topnote", "notes_top", "top", "headnotes"],
  heartNotes: ["middlenotes", "middle", "middle_notes", "heartnotes", "heartnote", "notes_heart"],
  baseNotes: ["basenotes", "base", "base_notes", "notes_base", "drydown"],
  anyNotes: ["notes", "allnotes", "note", "noteslist"],
  rating: ["rating", "score", "communityrating", "avg_rating"],
  imageUrl: ["imageurl", "image", "image_url", "photo", "picture", "img"],
  shortDescription: ["descriptionshort", "shortdescription", "description_short", "summary", "excerpt"],
  longDescription: ["descriptionlong", "longdescription", "description", "details", "about"],
  niche: ["isniche", "niche"],
  arabic: ["isarabic", "arabic"],
  priceRange: ["pricerange", "price", "pricecategory"],
} as const;

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    limit: 2_000,
    batchSize: 100,
    inputPath: DEFAULT_INPUT_PATH,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
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

    if (arg.startsWith("--input=")) {
      options.inputPath = arg.replace("--input=", "");
      continue;
    }
  }

  return options;
}

function parseCsv(content: string): string[][] {
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

function getFirstValue(row: ParsedRow, aliases: readonly string[]): string | undefined {
  for (const alias of aliases) {
    const value = row[alias];
    if (typeof value === "string" && cleanString(value).length > 0) {
      return cleanString(value);
    }
  }

  return undefined;
}

function mapPriceRange(value: string | undefined): PriceRange {
  if (!value) {
    return PriceRange.MID;
  }

  const normalized = cleanString(value).toLowerCase();
  if (!normalized) {
    return PriceRange.MID;
  }

  if (normalized.includes("budget") || normalized.includes("cheap") || normalized.includes("affordable")) {
    return PriceRange.BUDGET;
  }
  if (normalized.includes("luxury") || normalized.includes("ultra premium")) {
    return PriceRange.LUXURY;
  }
  if (normalized.includes("premium") || normalized.includes("high")) {
    return PriceRange.PREMIUM;
  }

  return PriceRange.MID;
}

function normalizeImageUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = cleanString(value);
  if (!/^https?:\/\//i.test(normalized)) {
    return undefined;
  }

  return normalized;
}

function composeShortDescription(perfume: {
  brandName: string;
  perfumeName: string;
  fragranceFamily: string;
  notes: string[];
}): string {
  const preview = perfume.notes.slice(0, 3).join(", ");
  if (!preview) {
    return `${perfume.perfumeName} by ${perfume.brandName} is a ${perfume.fragranceFamily.toLowerCase()} fragrance.`;
  }

  return `${perfume.perfumeName} by ${perfume.brandName} is a ${perfume.fragranceFamily.toLowerCase()} fragrance with notes of ${preview}.`;
}

function composeLongDescription(perfume: {
  brandName: string;
  perfumeName: string;
  fragranceFamily: string;
  top: string[];
  heart: string[];
  base: string[];
}): string {
  const top = perfume.top.length ? perfume.top.join(", ") : "a bright opening";
  const heart = perfume.heart.length ? perfume.heart.join(", ") : "a smooth heart";
  const base = perfume.base.length ? perfume.base.join(", ") : "a lasting base";

  return `${perfume.perfumeName} by ${perfume.brandName} belongs to the ${perfume.fragranceFamily.toLowerCase()} family, opening with ${top}, evolving through ${heart}, and finishing with ${base}.`;
}

function collectAllNotes(notes: { top: string[]; heart: string[]; base: string[] }): string[] {
  const ordered = [...notes.top, ...notes.heart, ...notes.base];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const note of ordered) {
    const key = note.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(note);
  }

  return result;
}

function normalizeRow(row: ParsedRow, rowNumber: number): { value?: NormalizedPerfume; reason?: string } {
  const brandName = getFirstValue(row, CSV_COLUMNS.brand);
  const perfumeName = getFirstValue(row, CSV_COLUMNS.perfumeName);

  if (!brandName || !perfumeName) {
    return { reason: "missing brand or perfume name" };
  }

  const topNotes = splitNotes(getFirstValue(row, CSV_COLUMNS.topNotes));
  const heartNotes = splitNotes(getFirstValue(row, CSV_COLUMNS.heartNotes));
  const baseNotes = splitNotes(getFirstValue(row, CSV_COLUMNS.baseNotes));
  const genericNotes = splitNotes(getFirstValue(row, CSV_COLUMNS.anyNotes));

  const top = [...topNotes];
  const heart = [...heartNotes];
  const base = [...baseNotes];

  if (genericNotes.length > 0) {
    for (const note of genericNotes) {
      const exists =
        top.some((entry) => entry.toLowerCase() === note.toLowerCase()) ||
        heart.some((entry) => entry.toLowerCase() === note.toLowerCase()) ||
        base.some((entry) => entry.toLowerCase() === note.toLowerCase());
      if (!exists) {
        heart.push(note);
      }
    }
  }

  const notes = { top, heart, base };
  const allNotes = collectAllNotes(notes);
  const fragranceFamily = mapFamily(getFirstValue(row, CSV_COLUMNS.family), allNotes);
  const shortDescription =
    getFirstValue(row, CSV_COLUMNS.shortDescription) ??
    composeShortDescription({ brandName, perfumeName, fragranceFamily, notes: allNotes });
  const longDescription =
    getFirstValue(row, CSV_COLUMNS.longDescription) ??
    composeLongDescription({ brandName, perfumeName, fragranceFamily, ...notes });

  return {
    value: {
      sourceRow: rowNumber,
      brandName,
      brandSlug: slugify(brandName),
      perfumeName,
      perfumeSlug: slugify(`${brandName}-${perfumeName}`),
      gender: mapGender(getFirstValue(row, CSV_COLUMNS.gender)),
      releaseYear: normalizeYear(getFirstValue(row, CSV_COLUMNS.year)),
      descriptionShort: shortDescription,
      descriptionLong: longDescription,
      fragranceFamily,
      priceRange: mapPriceRange(getFirstValue(row, CSV_COLUMNS.priceRange)),
      imageUrl: normalizeImageUrl(getFirstValue(row, CSV_COLUMNS.imageUrl)),
      ratingInternal: normalizeRating(getFirstValue(row, CSV_COLUMNS.rating)),
      isArabic: normalizeBoolean(getFirstValue(row, CSV_COLUMNS.arabic)),
      isNiche: normalizeBoolean(getFirstValue(row, CSV_COLUMNS.niche)),
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
    invalidRows: 0,
    malformedRows: 0,
    duplicateRows: 0,
    skippedRows: 0,
    insertedBrands: 0,
    insertedPerfumes: 0,
    insertedNotes: 0,
    insertedPerfumeNotes: 0,
  };

  const invalidLogs: string[] = [];
  const malformedLogs: string[] = [];

  const resolvedInputPath = path.resolve(process.cwd(), options.inputPath);
  await access(resolvedInputPath);

  console.log(`[import] source=${resolvedInputPath}`);
  console.log(`[import] limit=${options.limit} batchSize=${options.batchSize} dryRun=${options.dryRun}`);

  const fileContent = await readFile(resolvedInputPath, "utf8");
  const rows = parseCsv(fileContent);
  if (rows.length < 2) {
    throw new Error("CSV does not contain a header row and data rows.");
  }

  const rawHeaders = rows[0];
  const headers = rawHeaders.map((header) => normalizeCsvHeader(header));
  const dataRows = rows.slice(1);

  const candidates: NormalizedPerfume[] = [];
  for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex += 1) {
    const rawRow = dataRows[rowIndex];
    const sourceRow = rowIndex + 2;
    stats.rowsRead += 1;

    if (rawRow.length !== headers.length) {
      stats.malformedRows += 1;
      if (malformedLogs.length < 10) {
        malformedLogs.push(`row ${sourceRow}: expected ${headers.length} columns, found ${rawRow.length}`);
      }
      continue;
    }

    const mappedRow: ParsedRow = {};
    for (let index = 0; index < headers.length; index += 1) {
      mappedRow[headers[index]] = rawRow[index] ?? "";
    }

    const normalized = normalizeRow(mappedRow, sourceRow);
    if (!normalized.value) {
      stats.invalidRows += 1;
      if (invalidLogs.length < 10) {
        invalidLogs.push(`row ${sourceRow}: ${normalized.reason ?? "invalid data"}`);
      }
      continue;
    }

    candidates.push(normalized.value);
    stats.validRows += 1;

    if (candidates.length >= options.limit) {
      break;
    }
  }

  const [existingBrands, existingPerfumes, existingNotes] = await Promise.all([
    prisma.brand.findMany({
      select: { id: true, slug: true, name: true },
    }),
    prisma.perfume.findMany({
      select: { id: true, slug: true },
    }),
    prisma.note.findMany({
      select: { id: true, slug: true, name: true, noteType: true },
    }),
  ]);

  const brandsBySlug = new Map<string, CachedBrand>(
    existingBrands.map((brand) => [brand.slug, { id: brand.id, name: brand.name }]),
  );
  const perfumeSlugs = new Set<string>(existingPerfumes.map((perfume) => perfume.slug));
  const notesBySlug = new Map<string, CachedNote>(
    existingNotes.map((note) => [
      note.slug,
      { id: note.id, slug: note.slug, noteType: note.noteType, name: note.name },
    ]),
  );
  const notesByTypeKey = new Map<string, CachedNote>();

  for (const note of existingNotes) {
    const key = `${note.noteType}:${slugify(note.name)}`;
    notesByTypeKey.set(key, {
      id: note.id,
      slug: note.slug,
      noteType: note.noteType,
      name: note.name,
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
    const baseSlug = slugify(noteName);
    const typeKey = `${noteType}:${baseSlug}`;
    const cachedByType = notesByTypeKey.get(typeKey);
    if (cachedByType) {
      return cachedByType.id;
    }

    let candidateSlug = baseSlug;
    const cachedBySlug = notesBySlug.get(candidateSlug);
    if (cachedBySlug && cachedBySlug.noteType !== noteType) {
      const typeSuffix = `${baseSlug}-${noteType.toLowerCase()}`;
      candidateSlug = typeSuffix;
      let counter = 2;
      while (notesBySlug.has(candidateSlug) && notesBySlug.get(candidateSlug)?.noteType !== noteType) {
        candidateSlug = `${typeSuffix}-${counter}`;
        counter += 1;
      }
    }

    const existingForCandidate = notesBySlug.get(candidateSlug);
    if (existingForCandidate && existingForCandidate.noteType === noteType) {
      notesByTypeKey.set(typeKey, existingForCandidate);
      return existingForCandidate.id;
    }

    if (options.dryRun) {
      const note: CachedNote = {
        id: createTempId(),
        slug: candidateSlug,
        name: noteName,
        noteType,
      };
      notesBySlug.set(note.slug, note);
      notesByTypeKey.set(typeKey, note);
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
          name: true,
          slug: true,
          noteType: true,
        },
      });
      const note: CachedNote = {
        id: created.id,
        slug: created.slug,
        name: created.name,
        noteType: created.noteType,
      };
      notesBySlug.set(note.slug, note);
      notesByTypeKey.set(typeKey, note);
      stats.insertedNotes += 1;
      return note.id;
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const existing = await prisma.note.findUnique({
        where: { slug: candidateSlug },
        select: { id: true, slug: true, name: true, noteType: true },
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
      notesBySlug.set(note.slug, note);
      notesByTypeKey.set(typeKey, note);
      return note.id;
    }
  };

  const processPerfume = async (perfume: NormalizedPerfume): Promise<void> => {
    if (perfumeSlugs.has(perfume.perfumeSlug)) {
      stats.duplicateRows += 1;
      stats.skippedRows += 1;
      return;
    }

    const brandId = await ensureBrand(perfume.brandName, perfume.brandSlug);
    const noteIds = new Set<number>();

    for (const note of perfume.notes.top) {
      noteIds.add(await ensureNote(note, NoteType.TOP));
    }
    for (const note of perfume.notes.heart) {
      noteIds.add(await ensureNote(note, NoteType.HEART));
    }
    for (const note of perfume.notes.base) {
      noteIds.add(await ensureNote(note, NoteType.BASE));
    }

    if (options.dryRun) {
      perfumeSlugs.add(perfume.perfumeSlug);
      stats.insertedPerfumes += 1;
      stats.insertedPerfumeNotes += noteIds.size;
      stats.processedRows += 1;
      return;
    }

    try {
      const createdPerfume = await prisma.$transaction(async (tx) => {
        const created = await tx.perfume.create({
          data: {
            brandId,
            name: perfume.perfumeName,
            slug: perfume.perfumeSlug,
            gender: perfume.gender,
            descriptionShort: perfume.descriptionShort,
            descriptionLong: perfume.descriptionLong,
            fragranceFamily: perfume.fragranceFamily,
            priceRange: perfume.priceRange,
            releaseYear: perfume.releaseYear,
            isArabic: perfume.isArabic,
            isNiche: perfume.isNiche,
            imageUrl: perfume.imageUrl,
            ratingInternal: perfume.ratingInternal,
            catalogStatus: CatalogStatus.IMPORTED_UNVERIFIED,
            sourceName: "Parfumo-style dataset import",
            sourceType: SourceType.OTHER,
            sourceConfidence: 0.35,
            dataQuality: DataQuality.MEDIUM,
          },
          select: {
            id: true,
            slug: true,
          },
        });

        if (noteIds.size > 0) {
          const data = [...noteIds].map((noteId) => ({
            perfumeId: created.id,
            noteId,
          }));
          const result = await tx.perfumeNote.createMany({
            data,
            skipDuplicates: true,
          });
          stats.insertedPerfumeNotes += result.count;
        }

        return created;
      });

      perfumeSlugs.add(createdPerfume.slug);
      stats.insertedPerfumes += 1;
      stats.processedRows += 1;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        stats.duplicateRows += 1;
        stats.skippedRows += 1;
        perfumeSlugs.add(perfume.perfumeSlug);
        return;
      }

      stats.invalidRows += 1;
      stats.skippedRows += 1;
      if (invalidLogs.length < 10) {
        invalidLogs.push(`row ${perfume.sourceRow}: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    }
  };

  const batches = splitIntoChunks(candidates, options.batchSize);
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
    const batch = batches[batchIndex];
    for (const perfume of batch) {
      await processPerfume(perfume);
    }

    console.log(
      `[import] batch ${batchIndex + 1}/${batches.length} completed (${Math.min(
        (batchIndex + 1) * options.batchSize,
        candidates.length,
      )}/${candidates.length})`,
    );
  }

  console.log("");
  console.log("Import summary");
  console.log("--------------");
  console.log(`dry-run: ${options.dryRun}`);
  console.log(`rows read: ${stats.rowsRead}`);
  console.log(`valid rows selected: ${stats.validRows}`);
  console.log(`processed rows: ${stats.processedRows}`);
  console.log(`inserted brands: ${stats.insertedBrands}`);
  console.log(`inserted perfumes: ${stats.insertedPerfumes}`);
  console.log(`inserted notes: ${stats.insertedNotes}`);
  console.log(`inserted perfume-note relations: ${stats.insertedPerfumeNotes}`);
  console.log(`duplicates: ${stats.duplicateRows}`);
  console.log(`invalid rows: ${stats.invalidRows}`);
  console.log(`malformed rows: ${stats.malformedRows}`);
  console.log(`skipped rows: ${stats.skippedRows + stats.invalidRows + stats.malformedRows}`);

  if (malformedLogs.length > 0) {
    console.log("");
    console.log("Malformed row samples:");
    for (const line of malformedLogs) {
      console.log(`- ${line}`);
    }
  }

  if (invalidLogs.length > 0) {
    console.log("");
    console.log("Invalid row samples:");
    for (const line of invalidLogs) {
      console.log(`- ${line}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("[import] failed:", error);
  process.exitCode = 1;
});

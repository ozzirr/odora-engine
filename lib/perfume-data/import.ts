import { NoteType, Prisma, PrismaClient } from "@prisma/client";

import {
  cleanString,
  makePerfumeLookupKey,
  slugify,
} from "@/lib/perfume-data/normalize";
import type {
  CachedBrand,
  CachedNote,
  ImportMode,
  ImportStats,
  NormalizedPerfumeRecord,
} from "@/lib/perfume-data/types";

function createImportStats(rowsRead: number, validRows: number, malformedRows: number, invalidRows: number): ImportStats {
  return {
    rowsRead,
    validRows,
    processedRows: 0,
    malformedRows,
    invalidRows,
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
}

function splitIntoChunks<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function preferredCatalogImageUrl(record: NormalizedPerfumeRecord) {
  return record.imagePublicUrl ?? record.imageSourceUrl ?? record.imageUrl;
}

export async function importPerfumeRecords(params: {
  prisma: PrismaClient;
  records: NormalizedPerfumeRecord[];
  rowsRead: number;
  source: "verified" | "parfumo";
  mode: ImportMode;
  dryRun: boolean;
  batchSize: number;
  malformedRows: number;
  invalidRows: number;
  onBatchComplete?: (batchIndex: number, totalBatches: number, processed: number, total: number) => void;
}) {
  const stats = createImportStats(
    params.rowsRead,
    params.records.length,
    params.malformedRows,
    params.invalidRows,
  );
  const invalidLogs: string[] = [];
  let tempId = -1;

  const [existingBrands, existingNotes, existingPerfumes, existingPerfumeNotes] = await Promise.all([
    params.prisma.brand.findMany({ select: { id: true, slug: true, name: true } }),
    params.prisma.note.findMany({ select: { id: true, slug: true, name: true, noteType: true } }),
    params.prisma.perfume.findMany({
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
    params.prisma.perfumeNote.findMany({
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

    if (params.dryRun) {
      const id = createTempId();
      brandsBySlug.set(brandSlug, { id, name: brandName });
      stats.insertedBrands += 1;
      return id;
    }

    try {
      const created = await params.prisma.brand.create({
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

      const existing = await params.prisma.brand.findUnique({
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

    if (params.dryRun) {
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
      const created = await params.prisma.note.create({
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

      const existing = await params.prisma.note.findUnique({
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

  const processRecord = async (record: NormalizedPerfumeRecord) => {
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

    if (params.mode === "notes") {
      if (!matchedPerfumeId) {
        stats.missingPerfumeMatches += 1;
        stats.skippedRows += 1;
        if (invalidLogs.length < 10) {
          invalidLogs.push(
            `row ${record.sourceRow}: perfume not found for notes enrichment (slug=${record.perfumeSlug})`,
          );
        }
        return;
      }

      if (slugMatchedPerfumeId) {
        stats.matchedPerfumesBySlug += 1;
      } else {
        stats.matchedPerfumesByNameFallback += 1;
      }

      if (params.dryRun) {
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

      const result = await params.prisma.perfumeNote.createMany({
        data: [...noteIds].map((noteId) => ({
          perfumeId: matchedPerfumeId,
          noteId,
        })),
        skipDuplicates: true,
      });
      stats.insertedPerfumeNotes += result.count;
      stats.processedRows += 1;
      return;
    }

    if (params.source === "parfumo" && slugMatchedPerfumeId) {
      stats.skippedRows += 1;
      return;
    }

    const brandId = await ensureBrand(record.brandName, record.brandSlug);

    if (params.dryRun) {
      if (params.source === "verified" && slugMatchedPerfumeId) {
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

    if (params.source === "verified") {
      const upserted = await params.prisma.$transaction(async (tx) => {
        const perfume = await tx.perfume.upsert({
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
            imageUrl: preferredCatalogImageUrl(record),
            ratingInternal: record.ratingInternal,
            longevityScore: record.longevityScore,
            sillageScore: record.sillageScore,
            versatilityScore: record.versatilityScore,
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
            imageUrl: preferredCatalogImageUrl(record),
            ratingInternal: record.ratingInternal,
            longevityScore: record.longevityScore,
            sillageScore: record.sillageScore,
            versatilityScore: record.versatilityScore,
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
              perfumeId: perfume.id,
              noteId,
            })),
            skipDuplicates: true,
          });
          stats.insertedPerfumeNotes += result.count;
        }

        return perfume;
      });

      perfumeIdsBySlug.set(upserted.slug, upserted.id);
      if (slugMatchedPerfumeId) {
        stats.updatedPerfumes += 1;
      } else {
        stats.insertedPerfumes += 1;
      }
      stats.processedRows += 1;
      return;
    }

    try {
      const createdPerfume = await params.prisma.$transaction(async (tx) => {
        const created = await tx.perfume.create({
          data: {
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
            longevityScore: record.longevityScore,
            sillageScore: record.sillageScore,
            versatilityScore: record.versatilityScore,
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
              perfumeId: created.id,
              noteId,
            })),
            skipDuplicates: true,
          });
          stats.insertedPerfumeNotes += result.count;
        }

        return created;
      });

      perfumeIdsBySlug.set(createdPerfume.slug, createdPerfume.id);
      stats.insertedPerfumes += 1;
      stats.processedRows += 1;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        stats.skippedRows += 1;
        return;
      }
      throw error;
    }
  };

  const batches = splitIntoChunks(params.records, params.batchSize);
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

    params.onBatchComplete?.(
      batchIndex + 1,
      batches.length,
      Math.min((batchIndex + 1) * params.batchSize, params.records.length),
      params.records.length,
    );
  }

  return {
    stats,
    invalidLogs,
  };
}

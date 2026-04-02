import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { Prisma, PrismaClient } from "@prisma/client";

import { loadPerfumeInput, toCsv } from "@/lib/perfume-data/csv";
import { normalizeCsvHeader } from "@/lib/perfume-data/normalize";
import { VERIFIED_SCORE_WORKLIST_CSV_PATH } from "@/lib/perfume-data/paths";
import { buildMatchKey } from "@/lib/perfume-data/sources/base";

type CliOptions = {
  apply: boolean;
  outputCsvPath: string;
  outputJsonPath: string;
};

type WeightedTaxonomyValue = {
  slug: string;
  weight: number;
};

type PerfumeProfile = {
  id: number;
  slug: string;
  brandName: string;
  name: string;
  gender: string;
  priceRange: string;
  isArabic: boolean;
  isNiche: boolean;
  fragranceFamily: string;
  ratingInternal: number | null;
  longevityScore: number | null;
  sillageScore: number | null;
  versatilityScore: number | null;
  matchedUrl: string | null;
  notes: WeightedTaxonomyValue[];
  moods: WeightedTaxonomyValue[];
  seasons: WeightedTaxonomyValue[];
  occasions: WeightedTaxonomyValue[];
};

type ScoreField = "longevityScore" | "sillageScore" | "versatilityScore";

type Neighbor = {
  slug: string;
  name: string;
  similarity: number;
  longevityScore: number;
  sillageScore: number;
  versatilityScore: number;
};

type FieldBackfill = {
  value: number;
  source: "seed-curated" | "catalog-neighbors";
  detail: string;
};

type BackfillRow = {
  id: number;
  slug: string;
  brand: string;
  name: string;
  matchedUrl: string;
  proposedLongevity: FieldBackfill;
  proposedSillage: FieldBackfill;
  proposedVersatility: FieldBackfill;
  neighbors: Neighbor[];
};

const DEFAULT_OUTPUT_CSV_PATH = "data/generated/verified/perfume-score-db-backfill.csv";
const DEFAULT_OUTPUT_JSON_PATH = "data/generated/verified/perfume-score-db-backfill.json";
const DEFAULT_NULL_WEIGHT = 7;
const MAX_NEIGHBORS = 7;
const SEED_PATH = "prisma/seed.ts";

type SeedScoreEntry = {
  brandName: string;
  name: string;
  longevityScore: number;
  sillageScore: number;
  versatilityScore: number;
};

const perfumeProfileArgs = Prisma.validator<Prisma.PerfumeDefaultArgs>()({
  include: {
    brand: true,
    notes: {
      include: {
        note: true,
      },
    },
    moods: {
      include: {
        mood: true,
      },
    },
    seasons: {
      include: {
        season: true,
      },
    },
    occasions: {
      include: {
        occasion: true,
      },
    },
  },
});

type PerfumeWithProfileRelations = Prisma.PerfumeGetPayload<typeof perfumeProfileArgs>;

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    apply: argv.includes("--apply"),
    outputCsvPath: DEFAULT_OUTPUT_CSV_PATH,
    outputJsonPath: DEFAULT_OUTPUT_JSON_PATH,
  };

  for (const arg of argv) {
    if (arg.startsWith("--output-csv=")) {
      options.outputCsvPath = arg.replace("--output-csv=", "");
      continue;
    }
    if (arg.startsWith("--output-json=")) {
      options.outputJsonPath = arg.replace("--output-json=", "");
    }
  }

  return options;
}

function clampScore(value: number) {
  return Math.max(1, Math.min(10, Math.round(value)));
}

function normalizeWeight(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : DEFAULT_NULL_WEIGHT;
}

function toWeightedValues(
  items: Array<{
    slug: string;
    weight: number | null | undefined;
  }>,
) {
  return items.map((item) => ({
    slug: item.slug,
    weight: normalizeWeight(item.weight),
  }));
}

function valuesToMap(values: WeightedTaxonomyValue[]) {
  const map = new Map<string, number>();
  for (const value of values) {
    map.set(value.slug, value.weight);
  }
  return map;
}

function weightedJaccard(left: WeightedTaxonomyValue[], right: WeightedTaxonomyValue[]) {
  const leftMap = valuesToMap(left);
  const rightMap = valuesToMap(right);
  const keys = new Set([...leftMap.keys(), ...rightMap.keys()]);

  if (keys.size === 0) {
    return 0;
  }

  let shared = 0;
  let total = 0;

  for (const key of keys) {
    const leftValue = leftMap.get(key) ?? 0;
    const rightValue = rightMap.get(key) ?? 0;
    shared += Math.min(leftValue, rightValue);
    total += Math.max(leftValue, rightValue);
  }

  return total > 0 ? shared / total : 0;
}

function tokenizeFamily(value: string) {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .map((token) => token.trim())
      .filter(Boolean),
  );
}

function setJaccard(left: Set<string>, right: Set<string>) {
  const union = new Set([...left, ...right]);
  if (union.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const value of left) {
    if (right.has(value)) {
      intersection += 1;
    }
  }

  return intersection / union.size;
}

function ratingSimilarity(left: number | null, right: number | null) {
  if (left === null || right === null) {
    return 0.4;
  }

  return Math.max(0, 1 - Math.abs(left - right) / 1.5);
}

function perfumeSimilarity(left: PerfumeProfile, right: PerfumeProfile) {
  let similarity = 0;

  if (left.brandName === right.brandName) {
    similarity += 0.5;
  }
  if (left.gender === right.gender) {
    similarity += 1;
  }
  if (left.priceRange === right.priceRange) {
    similarity += 0.75;
  }
  if (left.isNiche === right.isNiche) {
    similarity += 0.75;
  }
  if (left.isArabic === right.isArabic) {
    similarity += 0.5;
  }

  similarity += 1.25 * setJaccard(tokenizeFamily(left.fragranceFamily), tokenizeFamily(right.fragranceFamily));
  similarity += 2.25 * weightedJaccard(left.notes, right.notes);
  similarity += 1.5 * weightedJaccard(left.moods, right.moods);
  similarity += 1.25 * weightedJaccard(left.seasons, right.seasons);
  similarity += 1.25 * weightedJaccard(left.occasions, right.occasions);
  similarity += ratingSimilarity(left.ratingInternal, right.ratingInternal);

  return similarity;
}

function averageForField(neighbors: Neighbor[], field: ScoreField) {
  const totalWeight = neighbors.reduce((sum, neighbor) => sum + neighbor.similarity, 0);
  if (totalWeight <= 0) {
    return 5;
  }

  const weightedValue = neighbors.reduce((sum, neighbor) => sum + neighbor.similarity * neighbor[field], 0);
  return clampScore(weightedValue / totalWeight);
}

function neighborDetail(neighbors: Neighbor[]) {
  return neighbors
    .slice(0, 3)
    .map((neighbor) => `${neighbor.slug} (${neighbor.longevityScore}/${neighbor.sillageScore}/${neighbor.versatilityScore})`)
    .join("; ");
}

async function loadMatchedUrlBySlug() {
  const loaded = await loadPerfumeInput({
    inputPath: VERIFIED_SCORE_WORKLIST_CSV_PATH,
    format: "csv",
    normalizeHeader: normalizeCsvHeader,
  });

  const matchedUrlBySlug = new Map<string, string>();

  for (const item of loaded.records) {
    const slug = String(item.record.slug ?? "").trim();
    const matchedUrl = String(item.record.matchedurl ?? "").trim();
    if (slug && matchedUrl) {
      matchedUrlBySlug.set(slug, matchedUrl);
    }
  }

  return matchedUrlBySlug;
}

async function loadSeedScores() {
  const source = await readFile(path.resolve(process.cwd(), SEED_PATH), "utf8");
  const brandBySlug = new Map<string, string>();
  const seedBySafeKey = new Map<string, SeedScoreEntry>();
  const seedByVariantKey = new Map<string, SeedScoreEntry>();

  for (const match of source.matchAll(/name:\s*"([^"]+)",\s*\n\s*slug:\s*"([^"]+)",/g)) {
    const [, name, slug] = match;
    brandBySlug.set(slug, name);
  }

  const perfumeRegex =
    /brandSlug:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"[\s\S]*?longevityScore:\s*(\d+)[\s\S]*?sillageScore:\s*(\d+)[\s\S]*?versatilityScore:\s*(\d+)/g;

  for (const match of source.matchAll(perfumeRegex)) {
    const [, brandSlug, name, longevityScore, sillageScore, versatilityScore] = match;
    const brandName = brandBySlug.get(brandSlug);
    if (!brandName) {
      continue;
    }

    const entry: SeedScoreEntry = {
      brandName,
      name,
      longevityScore: Number(longevityScore),
      sillageScore: Number(sillageScore),
      versatilityScore: Number(versatilityScore),
    };

    seedBySafeKey.set(buildMatchKey(entry.brandName, entry.name, "safe"), entry);
    seedByVariantKey.set(buildMatchKey(entry.brandName, entry.name, "variant"), entry);
  }

  return {
    seedBySafeKey,
    seedByVariantKey,
  };
}

function toProfile(
  perfume: PerfumeWithProfileRelations,
  matchedUrlBySlug: Map<string, string>,
): PerfumeProfile {
  return {
    id: perfume.id,
    slug: perfume.slug,
    brandName: perfume.brand.name,
    name: perfume.name,
    gender: perfume.gender,
    priceRange: perfume.priceRange,
    isArabic: perfume.isArabic,
    isNiche: perfume.isNiche,
    fragranceFamily: perfume.fragranceFamily,
    ratingInternal: perfume.ratingInternal,
    longevityScore: perfume.longevityScore,
    sillageScore: perfume.sillageScore,
    versatilityScore: perfume.versatilityScore,
    matchedUrl: matchedUrlBySlug.get(perfume.slug) ?? null,
    notes: toWeightedValues(
      perfume.notes.map((item) => ({
        slug: item.note.slug,
        weight: item.intensity,
      })),
    ),
    moods: toWeightedValues(
      perfume.moods.map((item) => ({
        slug: item.mood.slug,
        weight: item.weight,
      })),
    ),
    seasons: toWeightedValues(
      perfume.seasons.map((item) => ({
        slug: item.season.slug,
        weight: item.weight,
      })),
    ),
    occasions: toWeightedValues(
      perfume.occasions.map((item) => ({
        slug: item.occasion.slug,
        weight: item.weight,
      })),
    ),
  };
}

function selectNeighbors(target: PerfumeProfile, candidates: PerfumeProfile[]) {
  return candidates
    .map((candidate) => ({
      slug: candidate.slug,
      name: candidate.name,
      similarity: perfumeSimilarity(target, candidate),
      longevityScore: candidate.longevityScore ?? 5,
      sillageScore: candidate.sillageScore ?? 5,
      versatilityScore: candidate.versatilityScore ?? 5,
    }))
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, MAX_NEIGHBORS);
}

function toCsvRows(rows: BackfillRow[]) {
  return rows.map((row) => ({
    id: String(row.id),
    slug: row.slug,
    brand: row.brand,
    name: row.name,
    matched_url: row.matchedUrl,
    longevity_score: String(row.proposedLongevity.value),
    longevity_source: row.proposedLongevity.source,
    sillage_score: String(row.proposedSillage.value),
    sillage_source: row.proposedSillage.source,
    versatility_score: String(row.proposedVersatility.value),
    versatility_source: row.proposedVersatility.source,
    neighbor_slugs: row.neighbors.map((neighbor) => neighbor.slug).join(" | "),
  }));
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const prisma = new PrismaClient();

  try {
    const matchedUrlBySlug = await loadMatchedUrlBySlug();
    const seedScores = await loadSeedScores();
    const perfumes = await prisma.perfume.findMany({
      ...perfumeProfileArgs,
      orderBy: {
        slug: "asc",
      },
    });

    const profiles = perfumes.map((perfume) => toProfile(perfume, matchedUrlBySlug));
    const scored = profiles.filter(
      (perfume) =>
        perfume.longevityScore !== null &&
        perfume.sillageScore !== null &&
        perfume.versatilityScore !== null,
    );
    const targets = profiles.filter(
      (perfume) =>
        perfume.longevityScore === null ||
        perfume.sillageScore === null ||
        perfume.versatilityScore === null,
    );

    const rows: BackfillRow[] = targets.map((target) => {
      const neighbors = selectNeighbors(target, scored);
      const neighborSummary = neighborDetail(neighbors);
      const seedEntry =
        seedScores.seedBySafeKey.get(buildMatchKey(target.brandName, target.name, "safe")) ??
        seedScores.seedByVariantKey.get(buildMatchKey(target.brandName, target.name, "variant"));

      const seededLongevity = seedEntry
        ? {
            value: seedEntry.longevityScore,
            source: "seed-curated" as const,
            detail: `Matched existing curated seed scores for ${seedEntry.brandName} ${seedEntry.name}`,
          }
        : null;
      const seededSillage = seedEntry
        ? {
            value: seedEntry.sillageScore,
            source: "seed-curated" as const,
            detail: `Matched existing curated seed scores for ${seedEntry.brandName} ${seedEntry.name}`,
          }
        : null;
      const seededVersatility = seedEntry
        ? {
            value: seedEntry.versatilityScore,
            source: "seed-curated" as const,
            detail: `Matched existing curated seed scores for ${seedEntry.brandName} ${seedEntry.name}`,
          }
        : null;

      return {
        id: target.id,
        slug: target.slug,
        brand: target.brandName,
        name: target.name,
        matchedUrl: target.matchedUrl ?? "",
        proposedLongevity:
          seededLongevity ??
          {
            value: averageForField(neighbors, "longevityScore"),
            source: "catalog-neighbors",
            detail: `Nearest scored perfumes: ${neighborSummary}`,
          },
        proposedSillage:
          seededSillage ??
          {
            value: averageForField(neighbors, "sillageScore"),
            source: "catalog-neighbors",
            detail: `Nearest scored perfumes: ${neighborSummary}`,
          },
        proposedVersatility:
          seededVersatility ??
          {
            value: averageForField(neighbors, "versatilityScore"),
            source: "catalog-neighbors",
            detail: `Nearest scored perfumes: ${neighborSummary}`,
          },
        neighbors,
      };
    });

    const outputCsvPath = path.resolve(process.cwd(), options.outputCsvPath);
    const outputJsonPath = path.resolve(process.cwd(), options.outputJsonPath);

    await mkdir(path.dirname(outputCsvPath), { recursive: true });
    await mkdir(path.dirname(outputJsonPath), { recursive: true });

    const csvHeaders = [
      "id",
      "slug",
      "brand",
      "name",
      "matched_url",
      "longevity_score",
      "longevity_source",
      "sillage_score",
      "sillage_source",
      "versatility_score",
      "versatility_source",
      "neighbor_slugs",
    ];

    await writeFile(outputCsvPath, toCsv(csvHeaders, toCsvRows(rows)), "utf8");
    await writeFile(
      outputJsonPath,
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          summary: {
            totalMissingRows: rows.length,
            rowsFromSeed: rows.filter(
              (row) =>
                row.proposedLongevity.source === "seed-curated" ||
                row.proposedSillage.source === "seed-curated" ||
                row.proposedVersatility.source === "seed-curated",
            ).length,
            longevityFromNeighbors: rows.filter((row) => row.proposedLongevity.source === "catalog-neighbors").length,
            sillageFromNeighbors: rows.filter((row) => row.proposedSillage.source === "catalog-neighbors").length,
            versatilityFromNeighbors: rows.filter((row) => row.proposedVersatility.source === "catalog-neighbors").length,
          },
          rows,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    if (options.apply) {
      await prisma.$transaction(
        rows.map((row) =>
          prisma.perfume.update({
            where: {
              id: row.id,
            },
            data: {
              longevityScore: row.proposedLongevity.value,
              sillageScore: row.proposedSillage.value,
              versatilityScore: row.proposedVersatility.value,
            },
          }),
        ),
      );
    }

    console.log(
      `[perfumes:scores:backfill] targets=${rows.length} csv=${outputCsvPath} json=${outputJsonPath} apply=${options.apply}`,
    );
    console.log(
      `[perfumes:scores:backfill] rowsFromSeed=${rows.filter((row) => row.proposedVersatility.source === "seed-curated" || row.proposedLongevity.source === "seed-curated" || row.proposedSillage.source === "seed-curated").length} rowsFromNeighbors=${rows.filter((row) => row.proposedLongevity.source === "catalog-neighbors" && row.proposedSillage.source === "catalog-neighbors" && row.proposedVersatility.source === "catalog-neighbors").length}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[perfumes:scores:backfill] failed:", error);
  process.exitCode = 1;
});

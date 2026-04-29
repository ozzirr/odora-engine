import { config } from "dotenv";
config({ override: true });

import { readFile } from "node:fs/promises";

import { CatalogStatus, NoteType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RAW_PATH = "data/generated/verified/perfume-web-review.jsonl";

type ReviewResult = {
  found: boolean;
  releaseYear?: number | null;
  fragranceFamily?: string | null;
  topNotes?: string[];
  heartNotes?: string[];
  baseNotes?: string[];
  perfumer?: string | null;
  confidence?: "high" | "medium" | "low";
  sources?: string[];
};

function slugifyNote(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function applyableNotes(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && v.length < 60);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const promote = process.argv.includes("--promote");

  const raw = await readFile(RAW_PATH, "utf8");
  const lines = raw.split("\n").filter((l) => l.trim());

  // Latest result wins per slug (in case of duplicates)
  const bySlug = new Map<string, ReviewResult>();
  for (const line of lines) {
    const parsed = JSON.parse(line) as { slug: string; result?: ReviewResult; error?: string };
    if (parsed.result) {
      bySlug.set(parsed.slug, parsed.result);
    }
  }

  console.log(`[apply] dryRun=${dryRun} promote=${promote} candidates=${bySlug.size}`);

  let applied = 0;
  let promoted = 0;
  let skipped = 0;

  for (const [slug, result] of bySlug) {
    const conf = result.confidence ?? "low";
    const found = result.found !== false;
    if (!found || (conf !== "high" && conf !== "medium")) {
      skipped++;
      continue;
    }

    const perfume = await prisma.perfume.findUnique({ where: { slug }, select: { id: true } });
    if (!perfume) {
      console.warn(`[apply] missing perfume in DB: ${slug}`);
      skipped++;
      continue;
    }

    const data: Record<string, unknown> = {};
    if (
      result.releaseYear &&
      Number.isInteger(result.releaseYear) &&
      result.releaseYear > 1900 &&
      result.releaseYear <= new Date().getFullYear() + 1
    ) {
      data.releaseYear = result.releaseYear;
    }
    if (result.fragranceFamily && typeof result.fragranceFamily === "string" && result.fragranceFamily.length < 80) {
      data.fragranceFamily = result.fragranceFamily;
    }
    if (promote) {
      data.catalogStatus = CatalogStatus.VERIFIED;
      data.dataQuality = "HIGH";
      data.sourceConfidence = conf === "high" ? 0.92 : 0.78;
    }

    const top = applyableNotes(result.topNotes);
    const heart = applyableNotes(result.heartNotes);
    const base = applyableNotes(result.baseNotes);
    const filledLevels = [top, heart, base].filter((arr) => arr.length > 0).length;
    const willApplyNotes = filledLevels >= 2;

    if (dryRun) {
      console.log(
        `[dry] ${slug} → conf=${conf} year=${data.releaseYear ?? "-"} family=${data.fragranceFamily ?? "-"} notes=${top.length}/${heart.length}/${base.length} promote=${promote}`,
      );
      applied++;
      continue;
    }

    if (Object.keys(data).length > 0) {
      await prisma.perfume.update({ where: { id: perfume.id }, data });
    }

    if (willApplyNotes) {
      await prisma.perfumeNote.deleteMany({ where: { perfumeId: perfume.id } });

      // Dedupe within perfume: TOP > HEART > BASE (first occurrence wins)
      const seen = new Map<string, { noteName: string; type: NoteType; intensity: number }>();
      for (const [list, type] of [
        [top, NoteType.TOP],
        [heart, NoteType.HEART],
        [base, NoteType.BASE],
      ] as const) {
        for (let i = 0; i < list.length; i++) {
          const noteName = list[i];
          const slug = slugifyNote(noteName);
          if (!slug || seen.has(slug)) continue;
          seen.set(slug, { noteName, type, intensity: Math.max(1, list.length - i) });
        }
      }

      for (const [slug, { noteName, type, intensity }] of seen) {
        const note = await prisma.note.upsert({
          where: { slug },
          update: {},
          create: { name: noteName, slug, noteType: type },
        });
        await prisma.perfumeNote.create({
          data: { perfumeId: perfume.id, noteId: note.id, intensity },
        });
      }
    }

    if (promote) promoted++;
    applied++;

    if (applied % 10 === 0) console.log(`[apply] progress ${applied}/${bySlug.size}`);
  }

  console.log(
    `\n[apply] done. applied=${applied} promoted=${promoted} skipped=${skipped} total_results=${bySlug.size}`,
  );

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("[apply] fatal:", err);
  await prisma.$disconnect();
  process.exitCode = 1;
});

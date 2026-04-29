import { config } from "dotenv";
config({ override: true });

import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

import Anthropic from "@anthropic-ai/sdk";
import { CatalogStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const anthropic = new Anthropic();

const MODEL = "claude-haiku-4-5-20251001";
const OUTPUT_DIR = "data/generated/verified";
const RAW_PATH = path.join(OUTPUT_DIR, "perfume-web-review.jsonl");
const SUMMARY_PATH = path.join(OUTPUT_DIR, "perfume-web-review-summary.json");

type ReviewResult = {
  found: boolean;
  releaseYear?: number | null;
  fragranceFamily?: string | null;
  topNotes?: string[];
  heartNotes?: string[];
  baseNotes?: string[];
  perfumer?: string | null;
  confidence: "high" | "medium" | "low";
  sources: string[];
  rationale?: string;
};

function buildPrompt(brand: string, name: string, year: number | null) {
  const yearHint = year ? ` (released around ${year})` : "";
  return `You are a fragrance research assistant. Use web_search to find authoritative information about this perfume:

Brand: ${brand}
Name: ${name}${yearHint}

Search Parfumo, Fragrantica, Basenotes, the brand's official website, or other reliable fragrance databases. Look for the official notes pyramid, release year, and fragrance family.

Return ONLY a single JSON object on the LAST line of your response, with this exact shape (no markdown, no commentary after the JSON):

{
  "found": true | false,
  "releaseYear": <int or null>,
  "fragranceFamily": "<short family like 'Woody Spicy', 'Oriental Floral', 'Citrus Aromatic'>",
  "topNotes": ["note1","note2","note3"],
  "heartNotes": ["note1","note2","note3"],
  "baseNotes": ["note1","note2","note3"],
  "perfumer": "<name or null>",
  "confidence": "high" | "medium" | "low",
  "sources": ["url1","url2"],
  "rationale": "<one short sentence>"
}

Confidence rules:
- "high": at least 2 independent sources agree on the notes pyramid
- "medium": only one good source found, or sources partially disagree
- "low": notes are guessed from name/family, or no reliable source

If you cannot find the perfume at all, return {"found": false, "confidence": "low", "sources": [], "rationale": "..."}.`;
}

function extractJson(text: string): ReviewResult | null {
  // try last {...} block
  const match = text.match(/\{[\s\S]*\}/g);
  if (!match) return null;
  for (let i = match.length - 1; i >= 0; i--) {
    try {
      const parsed = JSON.parse(match[i]);
      if (typeof parsed === "object" && parsed !== null) return parsed as ReviewResult;
    } catch {
      // try next
    }
  }
  return null;
}

async function reviewOne(brand: string, name: string, year: number | null): Promise<ReviewResult | null> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 3,
      } as never,
    ],
    messages: [
      {
        role: "user",
        content: buildPrompt(brand, name, year),
      },
    ],
  });

  const textParts = response.content
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { type: string; text: string }) => b.text)
    .join("\n");

  return extractJson(textParts);
}

function applyableNotes(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && v.length < 60);
}

async function applyToDatabase(
  perfumeId: number,
  result: ReviewResult,
): Promise<{ updatedNotes: number; updatedFields: string[] }> {
  const updatedFields: string[] = [];
  const data: Record<string, unknown> = {};

  if (result.releaseYear && Number.isInteger(result.releaseYear) && result.releaseYear > 1900 && result.releaseYear <= new Date().getFullYear() + 1) {
    data.releaseYear = result.releaseYear;
    updatedFields.push("releaseYear");
  }

  if (result.fragranceFamily && typeof result.fragranceFamily === "string" && result.fragranceFamily.length < 80) {
    data.fragranceFamily = result.fragranceFamily;
    updatedFields.push("fragranceFamily");
  }

  if (Object.keys(data).length > 0) {
    await prisma.perfume.update({ where: { id: perfumeId }, data });
  }

  // Replace notes only if confidence is high or medium and we have at least 2 of the 3 levels populated
  const top = applyableNotes(result.topNotes);
  const heart = applyableNotes(result.heartNotes);
  const base = applyableNotes(result.baseNotes);
  const filledLevels = [top, heart, base].filter((arr) => arr.length > 0).length;

  if ((result.confidence === "high" || result.confidence === "medium") && filledLevels >= 2) {
    // Wipe existing notes for this perfume, then re-create
    await prisma.perfumeNote.deleteMany({ where: { perfumeId } });
    let created = 0;
    for (const [list, type] of [
      [top, "TOP"],
      [heart, "HEART"],
      [base, "BASE"],
    ] as const) {
      for (let i = 0; i < list.length; i++) {
        const noteName = list[i];
        const slug = noteName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        if (!slug) continue;

        const note = await prisma.note.upsert({
          where: { slug },
          update: { name: noteName },
          create: { name: noteName, slug },
        });

        await prisma.perfumeNote.create({
          data: {
            perfumeId,
            noteId: note.id,
            noteType: type,
            intensity: Math.max(1, list.length - i),
          },
        });
        created++;
      }
    }
    updatedFields.push("notes");
    return { updatedNotes: created, updatedFields };
  }

  return { updatedNotes: 0, updatedFields };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.replace("--limit=", "")) : undefined;

  await mkdir(OUTPUT_DIR, { recursive: true });

  const perfumes = await prisma.perfume.findMany({
    where: { catalogStatus: CatalogStatus.IMPORTED_UNVERIFIED },
    select: {
      id: true,
      name: true,
      slug: true,
      releaseYear: true,
      brand: { select: { name: true } },
    },
    orderBy: { id: "asc" },
    take: limit,
  });

  console.log(`[review] dryRun=${dryRun} found ${perfumes.length} IMPORTED_UNVERIFIED perfumes`);

  const summary = {
    total: perfumes.length,
    found: 0,
    notFound: 0,
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0,
    promoted: 0,
    failed: 0,
  };

  // Append-only raw log
  const rawLines: string[] = [];

  for (let i = 0; i < perfumes.length; i++) {
    const perfume = perfumes[i];
    const label = `[${i + 1}/${perfumes.length}] ${perfume.brand.name} ${perfume.name}`;

    try {
      const result = await reviewOne(perfume.brand.name, perfume.name, perfume.releaseYear);

      if (!result) {
        console.log(`${label} — NO JSON RETURNED`);
        summary.failed++;
        rawLines.push(JSON.stringify({ slug: perfume.slug, error: "no_json" }));
        continue;
      }

      const conf = result.confidence ?? "low";
      if (result.found === false) {
        summary.notFound++;
        console.log(`${label} — not found`);
      } else {
        summary.found++;
        if (conf === "high") summary.highConfidence++;
        else if (conf === "medium") summary.mediumConfidence++;
        else summary.lowConfidence++;
      }

      rawLines.push(JSON.stringify({ slug: perfume.slug, brand: perfume.brand.name, name: perfume.name, result }));

      if (!dryRun && result.found && (conf === "high" || conf === "medium")) {
        const applied = await applyToDatabase(perfume.id, result);
        if (applied.updatedFields.length > 0) {
          summary.promoted++;
          console.log(`${label} — ${conf} · applied: ${applied.updatedFields.join(",")} (notes=${applied.updatedNotes})`);
        } else {
          console.log(`${label} — ${conf} · nothing applicable`);
        }
      } else {
        console.log(`${label} — ${conf} · ${dryRun ? "dry-run" : "skip apply"}`);
      }
    } catch (error) {
      summary.failed++;
      console.error(`${label} — ERROR:`, (error as Error).message);
      rawLines.push(JSON.stringify({ slug: perfume.slug, error: (error as Error).message }));
    }

    // Throttle: 1 req/sec to be polite
    await new Promise((r) => setTimeout(r, 800));

    // Periodic write to disk
    if ((i + 1) % 10 === 0) {
      await writeFile(RAW_PATH, rawLines.join("\n") + "\n", "utf8");
    }
  }

  await writeFile(RAW_PATH, rawLines.join("\n") + "\n", "utf8");
  await writeFile(SUMMARY_PATH, JSON.stringify(summary, null, 2) + "\n", "utf8");

  console.log("\n=== Review summary ===");
  console.log(JSON.stringify(summary, null, 2));
  console.log(`\nRaw log: ${RAW_PATH}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("[review] fatal:", error);
  await prisma.$disconnect();
  process.exitCode = 1;
});

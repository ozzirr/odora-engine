import { config } from "dotenv";
config({ override: true });

import { mkdir, writeFile } from "node:fs/promises";
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
    .map((block) => ("text" in block && typeof block.text === "string" ? block.text : ""))
    .filter((text) => text.length > 0)
    .join("\n");

  return extractJson(textParts);
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
      console.log(`${label} — ${conf}${result.found === false ? " (not found)" : ""}`);
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

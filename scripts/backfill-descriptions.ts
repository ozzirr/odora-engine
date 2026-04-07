import { config } from "dotenv";
config({ override: true });

import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const anthropic = new Anthropic();

type PerfumeData = {
  id: number;
  name: string;
  slug: string;
  fragranceFamily: string | null;
  gender: string;
  brand: { name: string };
  notes: Array<{
    intensity: number | null;
    note: { name: string; noteType: string } | null;
  }>;
  moods: Array<{ weight: number | null; mood: { name: string } | null }>;
  occasions: Array<{ weight: number | null; occasion: { name: string } | null }>;
  seasons: Array<{ weight: number | null; season: { name: string } | null }>;
};

function top<T extends { weight?: number | null; intensity?: number | null }>(
  items: T[],
  getLabel: (item: T) => string | null | undefined,
  limit: number,
): string[] {
  return items
    .map((item) => ({ label: getLabel(item), rank: item.weight ?? item.intensity ?? 0 }))
    .filter((item): item is { label: string; rank: number } => Boolean(item.label))
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limit)
    .map((item) => item.label);
}

function buildPrompt(p: PerfumeData): string {
  const topNotes = top(
    p.notes.filter((n) => n.note?.noteType === "TOP"),
    (n) => n.note?.name,
    3,
  );
  const heartNotes = top(
    p.notes.filter((n) => n.note?.noteType === "HEART"),
    (n) => n.note?.name,
    3,
  );
  const baseNotes = top(
    p.notes.filter((n) => n.note?.noteType === "BASE"),
    (n) => n.note?.name,
    3,
  );
  const moods = top(p.moods, (m) => m.mood?.name, 3);
  const occasions = top(p.occasions, (o) => o.occasion?.name, 3);
  const seasons = top(p.seasons, (s) => s.season?.name, 2);

  const allNotes = [...new Set([...topNotes, ...heartNotes, ...baseNotes])];

  const genderMap: Record<string, string> = {
    MALE: "maschile",
    FEMALE: "femminile",
    UNISEX: "unisex",
  };

  return `Profumo: ${p.name}
Brand: ${p.brand.name}
Famiglia olfattiva: ${p.fragranceFamily ?? "non specificata"}
Genere: ${genderMap[p.gender] ?? p.gender}
Note di testa: ${topNotes.join(", ") || "—"}
Note di cuore: ${heartNotes.join(", ") || "—"}
Note di fondo: ${baseNotes.join(", ") || "—"}
Tutte le note principali: ${allNotes.slice(0, 6).join(", ") || "—"}
Mood: ${moods.join(", ") || "—"}
Occasioni: ${occasions.join(", ") || "—"}
Stagioni: ${seasons.join(", ") || "—"}`;
}

async function generateDescription(p: PerfumeData): Promise<string> {
  const prompt = buildPrompt(p);

  const message = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 200,
    system: `Sei un copywriter esperto di profumeria di lusso italiana.
Scrivi esattamente 2 frasi in italiano per la sezione "Panoramica" di una scheda profumo.
Regole:
- Esattamente 2 frasi, nessuna di più.
- Tono evocativo, mai promozionale o esagerato.
- La prima frase descrive il carattere e l'identità del profumo.
- La seconda frase indica quando/come indossarlo (occasione, stagione, mood).
- Menziona il nome del profumo e il brand nella prima frase (SEO).
- Cita 2-3 note in modo naturale nel testo, senza elencarle.
- Massimo 60 parole totali.
- Rispondi SOLO con le 2 frasi, senza introduzioni, virgolette o commenti.`,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");
  return content.text.trim();
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const limit = process.argv.find((a) => a.startsWith("--limit="))
    ? parseInt(process.argv.find((a) => a.startsWith("--limit="))!.replace("--limit=", ""))
    : undefined;

  console.log(`[descriptions:backfill] dryRun=${dryRun} limit=${limit ?? "all"}`);

  const perfumes = await prisma.perfume.findMany({
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      fragranceFamily: true,
      gender: true,
      brand: { select: { name: true } },
      notes: {
        select: {
          intensity: true,
          note: { select: { name: true, noteType: true } },
        },
      },
      moods: {
        select: {
          weight: true,
          mood: { select: { name: true } },
        },
      },
      occasions: {
        select: {
          weight: true,
          occasion: { select: { name: true } },
        },
      },
      seasons: {
        select: {
          weight: true,
          season: { select: { name: true } },
        },
      },
    },
    orderBy: { id: "asc" },
  });

  console.log(`[descriptions:backfill] found ${perfumes.length} perfumes`);

  let updated = 0;
  let failed = 0;

  for (const perfume of perfumes) {
    try {
      const description = await generateDescription(perfume as PerfumeData);

      if (dryRun) {
        console.log(`\n[${perfume.slug}]`);
        console.log(description);
        continue;
      }

      await prisma.perfume.update({
        where: { id: perfume.id },
        data: { descriptionLong: description },
      });

      updated++;
      if (updated % 10 === 0) {
        console.log(`[descriptions:backfill] progress: ${updated}/${perfumes.length}`);
      }

      // Rate limit: max ~1 req/sec per Haiku
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`[descriptions:backfill] failed for ${perfume.slug}:`, error);
      failed++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(`[descriptions:backfill] done. updated=${updated} failed=${failed}`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("[descriptions:backfill] fatal:", error);
  await prisma.$disconnect();
  process.exitCode = 1;
});

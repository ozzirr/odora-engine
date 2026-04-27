/**
 * scripts/backfill-blog-tldr.ts
 *
 * Generates a TL;DR (4-5 self-contained bullet points) for every existing
 * BlogPost that doesn't have one yet, using Claude.
 *
 * Usage:
 *   npx tsx scripts/backfill-blog-tldr.ts                # process all posts missing tldr
 *   npx tsx scripts/backfill-blog-tldr.ts --dry-run      # preview output, don't write to DB
 *   npx tsx scripts/backfill-blog-tldr.ts --slug=foo     # only this slug (both locales)
 *   npx tsx scripts/backfill-blog-tldr.ts --force        # regenerate even if tldr already populated
 */

import { config } from "dotenv";
config({ override: true });

import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";

import { PUBLIC_CACHE_TAGS } from "@/lib/cache-tags";

const prisma = new PrismaClient();
const anthropic = new Anthropic();

async function generateTldrForPost(post: {
  title: string;
  content: string;
  locale: string;
}): Promise<string[]> {
  const isIt = post.locale === "it";

  const systemPrompt = isIt
    ? `Sei un editor SEO esperto. Estrai 4-5 punti chiave da un articolo come bullet point auto-conclusivi.
Rispondi ONLY con JSON valido, nessun testo fuori dal JSON.`
    : `You are an SEO editor. Extract 4-5 key takeaways from an article as self-contained bullet points.
Reply ONLY with valid JSON, no text outside the JSON.`;

  const userPrompt = isIt
    ? `Articolo:
Titolo: "${post.title}"

${post.content}

Estrai 4-5 bullet point chiave (TL;DR) che:
- Sono auto-conclusivi (leggibili senza l'articolo)
- Massimo 120 caratteri ciascuno
- In italiano
- Riassumono i concetti centrali
- Possono essere citati da ChatGPT/Perplexity quando rispondono a domande sul tema

Rispondi con questo JSON esatto:
{ "tldr": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"] }`
    : `Article:
Title: "${post.title}"

${post.content}

Extract 4-5 key takeaway bullets (TL;DR) that:
- Are self-contained (readable without the article)
- Max 120 characters each
- In English
- Summarize the central concepts
- Can be quoted by ChatGPT/Perplexity when answering questions on the topic

Reply with this exact JSON:
{ "tldr": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"] }`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = message.content[0];
  if (textBlock.type !== "text") throw new Error("Unexpected response type");

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  const parsed = JSON.parse(jsonMatch[0]) as { tldr: unknown };
  if (!Array.isArray(parsed.tldr)) throw new Error("Invalid tldr in response");

  return parsed.tldr.map((item) => String(item).trim()).filter(Boolean);
}

async function revalidateBlogCache() {
  const revalidateUrl = process.env.ODORA_REVALIDATE_URL?.trim();
  const revalidateToken = process.env.ODORA_REVALIDATE_TOKEN?.trim();
  if (!revalidateUrl || !revalidateToken) return;

  const response = await fetch(revalidateUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${revalidateToken}`,
    },
    body: JSON.stringify({ tags: [PUBLIC_CACHE_TAGS.blog] }),
  });
  if (!response.ok) {
    console.warn(`[blog:backfill] cache revalidation failed: ${response.status}`);
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const force = process.argv.includes("--force");
  const slugArg = process.argv.find((a) => a.startsWith("--slug="));
  const targetSlug = slugArg ? slugArg.replace("--slug=", "") : null;

  const where = {
    ...(targetSlug ? { slug: targetSlug } : {}),
    ...(force ? {} : { tldr: { isEmpty: true } }),
  };

  const posts = await prisma.blogPost.findMany({
    where,
    select: { id: true, slug: true, locale: true, title: true, content: true, tldr: true },
    orderBy: [{ locale: "asc" }, { publishedAt: "desc" }],
  });

  console.log(`[blog:backfill] found ${posts.length} post(s) to process${dryRun ? " (dry-run)" : ""}`);

  let processed = 0;
  for (const post of posts) {
    console.log(`\n[${post.locale}] ${post.slug}`);
    try {
      const tldr = await generateTldrForPost(post);
      console.log(`  → ${tldr.length} bullets:`);
      tldr.forEach((b, i) => console.log(`    ${i + 1}. ${b}`));

      if (!dryRun) {
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { tldr },
        });
      }
      processed++;
    } catch (error) {
      console.error(`  ✗ failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  if (!dryRun && processed > 0) {
    await revalidateBlogCache();
  }

  console.log(`\n[blog:backfill] done — ${processed}/${posts.length} processed`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("[blog:backfill] fatal:", error);
  await prisma.$disconnect();
  process.exitCode = 1;
});

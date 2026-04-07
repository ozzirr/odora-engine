/**
 * scripts/backfill-blog-images.ts
 *
 * Generates and uploads cover images for existing blog posts that have no coverImageUrl.
 * One image per unique slug (shared across locales).
 *
 * Usage:
 *   npx tsx scripts/backfill-blog-images.ts
 */

import { config } from "dotenv";
config({ override: true });

import { fal } from "@fal-ai/client";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

fal.config({ credentials: process.env.FAL_KEY! });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Same prompt builder as the main script
function buildImagePrompt(tags: string[]): string {
  const t = tags.map((tag) => tag.toLowerCase());
  const base =
    "luxury perfume bottle, high-end fragrance product photography, editorial style, photorealistic, sharp focus, no text, no watermark, no people";

  if (t.some((x) => ["oud", "arabo", "arabic", "orientale", "oriental"].includes(x))) {
    return `${base}, draped on rich burgundy silk fabric with scattered rose petals and incense smoke, warm candlelight glow, deep jewel tones, cinematic dark luxury atmosphere`;
  }
  if (t.some((x) => ["vaniglia", "vanilla", "gourmand", "dolce", "sweet", "caldo", "warm"].includes(x))) {
    return `${base}, placed on warm cream marble with soft cashmere fabric and dried vanilla pods, golden hour window light, warm amber and caramel colour palette, cozy inviting mood`;
  }
  if (t.some((x) => ["floreale", "floral", "primavera", "spring"].includes(x))) {
    return `${base}, surrounded by fresh peony and rose petals on a white marble surface, soft natural daylight, pastel pink and blush tones, delicate airy atmosphere`;
  }
  if (t.some((x) => ["legnoso", "woody", "patchouli", "terroso", "earthy", "autunno", "autumn"].includes(x))) {
    return `${base}, resting on aged dark walnut wood with autumn leaves and cedar bark, warm amber sidelight, deep forest tones, moody sophisticated atmosphere`;
  }
  if (t.some((x) => ["acquatico", "marine", "acqua", "fresco", "fresh", "estate", "summer"].includes(x))) {
    return `${base}, on white stone surface with translucent water droplets and citrus slices, bright natural Mediterranean light, clean blue-white colour palette, airy refreshing mood`;
  }
  if (t.some((x) => ["inverno", "winter", "speziato", "spicy"].includes(x))) {
    return `${base}, on dark slate with cinnamon sticks, star anise and amber resin, dramatic chiaroscuro studio lighting, deep warm ochre and chocolate tones, bold moody atmosphere`;
  }
  if (t.some((x) => ["sera", "evening", "lusso", "luxury", "niche", "iconico", "iconic"].includes(x))) {
    return `${base}, on black velvet with scattered gold leaf and crystal elements, dramatic spotlight studio lighting, deep shadow contrast, ultra-luxury opulent aesthetic`;
  }
  if (t.some((x) => ["muschio", "musk", "pulito", "clean", "unisex"].includes(x))) {
    return `${base}, on minimalist white surface with soft linen fabric and a single white orchid, diffused studio light, neutral clean palette, modern elegant mood`;
  }

  return `${base}, on white Carrara marble with a single fresh gardenia flower, soft side window light, warm ivory and gold tones, timeless luxury aesthetic`;
}

async function generateAndUploadImage(tags: string[], slug: string): Promise<string | null> {
  const prompt = buildImagePrompt(tags);
  console.log(`  prompt: "${prompt.slice(0, 80)}..."`);

  const result = await fal.subscribe("fal-ai/flux-pro/v1.1", {
    input: {
      prompt,
      image_size: "landscape_16_9",
      num_images: 1,
      safety_tolerance: "2",
    },
    logs: false,
  }) as { data: { images: Array<{ url: string }> } };

  const generatedUrl = result.data.images[0]?.url;
  if (!generatedUrl) throw new Error("fal.ai returned no image URL");
  console.log(`  fal.ai ✓`);

  // Download
  const imageResponse = await fetch(generatedUrl);
  if (!imageResponse.ok) throw new Error(`fetch failed: ${imageResponse.status}`);
  const buffer = await imageResponse.arrayBuffer();

  // Upload to Supabase Storage
  const filename = `${slug}-${Date.now()}.webp`;
  const { error: uploadError } = await supabase.storage
    .from("blog-images")
    .upload(filename, buffer, {
      contentType: "image/webp",
      upsert: false,
      cacheControl: "31536000",
    });

  if (uploadError) {
    console.error(`  upload error: ${uploadError.message} — using fal.ai URL as fallback`);
    return generatedUrl;
  }

  const { data: { publicUrl } } = supabase.storage
    .from("blog-images")
    .getPublicUrl(filename);

  console.log(`  stored ✓ ${publicUrl}`);
  return publicUrl;
}

async function main() {
  // Get distinct slugs that have no coverImageUrl
  const posts = await prisma.blogPost.findMany({
    where: { coverImageUrl: null },
    select: { slug: true, tags: true },
    distinct: ["slug"],
  });

  if (posts.length === 0) {
    console.log("[backfill] All posts already have cover images. Nothing to do.");
    await prisma.$disconnect();
    return;
  }

  console.log(`[backfill] Found ${posts.length} slug(s) without cover image`);

  for (const post of posts) {
    console.log(`\n[backfill] Processing slug="${post.slug}" tags=[${post.tags.join(", ")}]`);
    try {
      const coverImageUrl = await generateAndUploadImage(post.tags, post.slug);
      if (!coverImageUrl) {
        console.log(`  skipped — no image URL`);
        continue;
      }

      // Update ALL locales for this slug
      const { count } = await prisma.blogPost.updateMany({
        where: { slug: post.slug },
        data: { coverImageUrl },
      });
      console.log(`  updated ${count} locale(s) with coverImageUrl`);
    } catch (err) {
      console.error(`  ERROR for slug="${post.slug}":`, err);
    }
  }

  console.log("\n[backfill] Done.");
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("[backfill] fatal:", err);
  await prisma.$disconnect();
  process.exitCode = 1;
});

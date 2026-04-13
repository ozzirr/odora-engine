/**
 * scripts/generate-blog-post.ts
 *
 * Generates a bilingual (IT + EN) SEO-optimised blog post using Claude,
 * then generates a cover image via fal.ai (Flux) and uploads it to Supabase Storage.
 *
 * Usage:
 *   npx tsx scripts/generate-blog-post.ts
 *   npx tsx scripts/generate-blog-post.ts --dry-run
 *   npx tsx scripts/generate-blog-post.ts --index=3
 *   npx tsx scripts/generate-blog-post.ts --no-image   (skip image generation)
 */

import { config } from "dotenv";
config({ override: true });

import Anthropic from "@anthropic-ai/sdk";
import { fal } from "@fal-ai/client";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const anthropic = new Anthropic();

// ---------------------------------------------------------------------------
// fal.ai + Supabase clients (lazy — only used when not --no-image / --dry-run)
// ---------------------------------------------------------------------------
function getFalClient() {
  fal.config({ credentials: process.env.FAL_KEY! });
  return fal;
}

function getSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ---------------------------------------------------------------------------
// Internal link anchors Claude can reference in the article
// ---------------------------------------------------------------------------
const INTERNAL_LINKS_IT = `
Puoi inserire link interni Odora usando la sintassi Markdown [testo](url):
- Catalogo profumi: [scopri tutti i profumi](https://www.odora.it/it/profumi)
- Finder intelligente: [usa il Finder Odora](https://www.odora.it/it/trova-profumo)
- Preset profumi freschi: [Fresco quotidiano](https://www.odora.it/it/trova-profumo?preset=Fresh+Daily)
- Preset vaniglia: [Amanti della vaniglia](https://www.odora.it/it/trova-profumo?preset=Vanilla+Lovers)
- Preset profumi arabi: [Firma araba](https://www.odora.it/it/trova-profumo?preset=Arabic+Signature&arabicOnly=true)
- Preset ufficio: [Perfetto per ufficio](https://www.odora.it/it/trova-profumo?preset=Office+Safe)
- Preset serata: [Serata romantica](https://www.odora.it/it/trova-profumo?preset=Date+Night)
- Classifiche top profumi: [classifiche Odora](https://www.odora.it/it/classifiche)
Inserisci 2-4 link interni in modo naturale nel testo, non tutti insieme.
`.trim();

const INTERNAL_LINKS_EN = `
You can include internal Odora links using Markdown syntax [text](url):
- Perfume catalog: [explore all fragrances](https://www.odora.it/en/perfumes)
- Smart Finder: [use the Odora Finder](https://www.odora.it/en/finder)
- Fresh preset: [Fresh Daily](https://www.odora.it/en/finder?preset=Fresh+Daily)
- Vanilla preset: [Vanilla Lovers](https://www.odora.it/en/finder?preset=Vanilla+Lovers)
- Arabic preset: [Arabic Signature](https://www.odora.it/en/finder?preset=Arabic+Signature&arabicOnly=true)
- Office preset: [Office Safe](https://www.odora.it/en/finder?preset=Office+Safe)
- Date night preset: [Date Night](https://www.odora.it/en/finder?preset=Date+Night)
- Top fragrances ranking: [Odora top rankings](https://www.odora.it/en/top)
Insert 2-4 internal links naturally in the text, not all at once.
`.trim();

// ---------------------------------------------------------------------------
// Topic pool with explicit primary + secondary keywords
// ---------------------------------------------------------------------------
type Topic = {
  title: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  tags: string[];
};

const TOPIC_POOL_IT: Topic[] = [
  { title: "I migliori profumi legnosi per l'autunno", primaryKeyword: "profumi legnosi uomo donna", secondaryKeywords: ["fragranze woody autunno", "note di sandalo cedro", "profumi legnosi 2026"], tags: ["legnoso", "autunno", "guida"] },
  { title: "Guida ai profumi arabi: oud, ambra e rosa", primaryKeyword: "profumi arabi oud", secondaryKeywords: ["fragranze orientali", "profumi con oud", "migliori profumi arabi"], tags: ["arabo", "oud", "orientale"] },
  { title: "Profumi da ufficio: come scegliere una firma discreta ed elegante", primaryKeyword: "profumi da ufficio uomo donna", secondaryKeywords: ["fragranze discrete lavoro", "profumo da lavoro elegante", "profumi non invasivi"], tags: ["ufficio", "elegante", "guida"] },
  { title: "Profumi gourmand: dolci, sensuali e irresistibili", primaryKeyword: "profumi gourmand vaniglia", secondaryKeywords: ["fragranze dolci", "profumi con note di vaniglia", "profumi gourmand donna"], tags: ["gourmand", "vaniglia", "dolce"] },
  { title: "Profumi estivi: freschi, agrumati e luminosi", primaryKeyword: "profumi estivi freschi", secondaryKeywords: ["fragranze estate", "profumi agrumati uomo donna", "migliori profumi per l'estate"], tags: ["estate", "fresco", "agrumato"] },
  { title: "Come leggere le note olfattive di un profumo", primaryKeyword: "note olfattive profumo", secondaryKeywords: ["piramide olfattiva", "note di testa cuore fondo", "come scegliere un profumo"], tags: ["guida", "note olfattive", "educazione"] },
  { title: "Profumi niche vs mainstream: quando vale la pena spendere di più", primaryKeyword: "profumi niche differenze", secondaryKeywords: ["profumo di nicchia vale la pena", "niche vs designer fragrance", "migliori profumi niche"], tags: ["niche", "guida", "lusso"] },
  { title: "I migliori profumi floreali per la primavera", primaryKeyword: "profumi floreali donna primavera", secondaryKeywords: ["fragranze floreali 2026", "profumi con note di rosa peonia", "migliori profumi primaverili"], tags: ["floreale", "primavera", "donna"] },
  { title: "Profumi orientali: spezie, resine e sensualità", primaryKeyword: "profumi orientali speziati", secondaryKeywords: ["fragranze con ambra resine", "profumi speziati uomo donna", "orientale profumo significato"], tags: ["orientale", "speziato", "sensuale"] },
  { title: "Come far durare il profumo più a lungo sulla pelle", primaryKeyword: "come far durare il profumo", secondaryKeywords: ["trucchi per applicare il profumo", "punti caldi profumo", "profumo durata pelle"], tags: ["guida", "applicazione", "consigli"] },
  { title: "Profumi unisex: i migliori da condividere", primaryKeyword: "profumi unisex migliori", secondaryKeywords: ["fragranze unisex 2026", "profumo per lui e lei", "profumi gender neutral"], tags: ["unisex", "guida", "coppia"] },
  { title: "Profumi acquatici e marini: freschezza senza stagioni", primaryKeyword: "profumi acquatici marini", secondaryKeywords: ["fragranze marine uomo", "profumi con note acquatiche", "profumo di mare"], tags: ["acquatico", "marino", "fresco"] },
  { title: "Il rituale del profumo: layering, storage e applicazione", primaryKeyword: "layering profumi come fare", secondaryKeywords: ["come conservare i profumi", "come applicare il profumo", "profumo layering guida"], tags: ["guida", "layering", "ritual"] },
  { title: "Profumi con note di vaniglia: caldi, avvolgenti, iconici", primaryKeyword: "profumi vaniglia migliori", secondaryKeywords: ["fragranze con vaniglia", "profumi caldi vaniglia 2026", "profumo vaniglia uomo donna"], tags: ["vaniglia", "gourmand", "caldo"] },
  { title: "Come scegliere il profumo per la stagione fredda", primaryKeyword: "profumi invernali migliori", secondaryKeywords: ["fragranze inverno uomo donna", "profumi caldi invernali", "migliori profumi autunno inverno"], tags: ["inverno", "guida", "stagionale"] },
  { title: "Profumi di nicchia italiani: eccellenze da scoprire", primaryKeyword: "profumi niche italiani", secondaryKeywords: ["profumeria artistica italiana", "niche italiani 2026", "brand profumi italiani"], tags: ["italiano", "niche", "lusso"] },
  { title: "I profumi più iconici degli ultimi 20 anni", primaryKeyword: "profumi iconici famosi", secondaryKeywords: ["migliori profumi di tutti i tempi", "profumi classici intramontabili", "profumi famosi storia"], tags: ["iconico", "classico", "storia"] },
  { title: "Profumi muschiati: puliti, sensuali, versatili", primaryKeyword: "profumi muschiati migliori", secondaryKeywords: ["note di muschio profumo", "profumi con muschio bianco", "muschiato profumo significato"], tags: ["muschio", "pulito", "versatile"] },
  { title: "Come scegliere un profumo in regalo", primaryKeyword: "profumo regalo idea", secondaryKeywords: ["regalo profumo uomo donna", "migliori profumi da regalare", "profumo regalo Natale"], tags: ["regalo", "guida", "occasione"] },
  { title: "Profumi cipriati: eleganza senza tempo", primaryKeyword: "profumi cipriati cosa sono", secondaryKeywords: ["fragranze chypre", "profumi cipriati donna", "caratteristiche profumo cipriato"], tags: ["cipriato", "elegante", "classico"] },
  { title: "I migliori profumi per la sera e le occasioni speciali", primaryKeyword: "profumi da sera eleganti", secondaryKeywords: ["fragranze per occasioni speciali", "profumo per serata romantica", "profumi sera uomo donna"], tags: ["sera", "elegante", "occasione"] },
  { title: "Profumi con patchouli: terrosi, ricchi, profondi", primaryKeyword: "profumi con patchouli", secondaryKeywords: ["note di patchouli profumo", "fragranze patchouli uomo donna", "patchouli profumo caratteristiche"], tags: ["patchouli", "terroso", "intenso"] },
  { title: "La piramide olfattiva: capire testa, cuore e fondo", primaryKeyword: "piramide olfattiva profumo spiegazione", secondaryKeywords: ["note di testa cuore fondo spiegazione", "come funziona un profumo", "evaporazione profumo"], tags: ["educazione", "guida", "note olfattive"] },
  { title: "Profumi speziati: audaci, caldi, indimenticabili", primaryKeyword: "profumi speziati migliori", secondaryKeywords: ["fragranze con pepe cardamomo", "profumi speziati uomo", "note speziate profumo"], tags: ["speziato", "audace", "caldo"] },
  { title: "I migliori profumi da uomo per ogni stagione", primaryKeyword: "migliori profumi uomo 2026", secondaryKeywords: ["profumo uomo primavera estate autunno inverno", "profumi maschili consigliati", "top profumi uomo"], tags: ["uomo", "guida", "stagionale"] },
];

const TOPIC_POOL_EN: Topic[] = [
  { title: "The best woody fragrances for autumn", primaryKeyword: "best woody fragrances men women", secondaryKeywords: ["woody autumn fragrances", "sandalwood cedar notes perfume", "woody fragrances 2026"], tags: ["woody", "autumn", "guide"] },
  { title: "A guide to Arabic perfumes: oud, amber and rose", primaryKeyword: "Arabic perfumes oud guide", secondaryKeywords: ["oriental fragrances", "best oud perfumes", "Arabic fragrance brands"], tags: ["arabic", "oud", "oriental"] },
  { title: "Office-friendly fragrances: how to choose a discreet signature scent", primaryKeyword: "best office fragrances men women", secondaryKeywords: ["work-appropriate perfume", "subtle office scent", "non-invasive fragrances"], tags: ["office", "elegant", "guide"] },
  { title: "Gourmand fragrances: sweet, sensual and irresistible", primaryKeyword: "best gourmand fragrances vanilla", secondaryKeywords: ["sweet fragrances women", "vanilla perfumes 2026", "gourmand perfume meaning"], tags: ["gourmand", "vanilla", "sweet"] },
  { title: "Summer fragrances: fresh, citrusy and luminous", primaryKeyword: "best summer fragrances 2026", secondaryKeywords: ["fresh citrus perfumes summer", "light fragrances hot weather", "best perfumes for summer"], tags: ["summer", "fresh", "citrus"] },
  { title: "How to read a fragrance's note pyramid", primaryKeyword: "fragrance notes pyramid explained", secondaryKeywords: ["top heart base notes perfume", "how to choose a fragrance", "perfume evaporation stages"], tags: ["guide", "fragrance notes", "education"] },
  { title: "Niche vs mainstream perfumes: when is it worth spending more?", primaryKeyword: "niche perfumes vs designer difference", secondaryKeywords: ["is niche perfume worth it", "best niche fragrances", "niche vs mainstream fragrance"], tags: ["niche", "guide", "luxury"] },
  { title: "The best floral fragrances for spring", primaryKeyword: "best floral fragrances women spring", secondaryKeywords: ["spring floral perfumes 2026", "rose peony perfumes", "light floral fragrances"], tags: ["floral", "spring", "women"] },
  { title: "Oriental fragrances: spices, resins and sensuality", primaryKeyword: "oriental fragrances spicy sensual", secondaryKeywords: ["amber resin perfumes", "spicy oriental perfume men women", "oriental fragrance meaning"], tags: ["oriental", "spicy", "sensual"] },
  { title: "How to make your fragrance last longer on skin", primaryKeyword: "how to make perfume last longer", secondaryKeywords: ["perfume application tips", "pulse points fragrance", "long lasting perfume tricks"], tags: ["guide", "application", "tips"] },
  { title: "Unisex fragrances: the best to share", primaryKeyword: "best unisex fragrances 2026", secondaryKeywords: ["gender neutral perfumes", "unisex fragrance for couples", "top unisex scents"], tags: ["unisex", "guide", "couples"] },
  { title: "Aquatic and marine fragrances: freshness for all seasons", primaryKeyword: "best aquatic marine fragrances", secondaryKeywords: ["sea water perfumes men", "aquatic fragrance notes", "best ocean inspired perfumes"], tags: ["aquatic", "marine", "fresh"] },
  { title: "The fragrance ritual: layering, storage and application", primaryKeyword: "how to layer perfumes guide", secondaryKeywords: ["how to store perfume properly", "fragrance layering tips", "perfume application guide"], tags: ["guide", "layering", "ritual"] },
  { title: "Vanilla fragrances: warm, enveloping and iconic", primaryKeyword: "best vanilla fragrances 2026", secondaryKeywords: ["vanilla perfumes men women", "warm vanilla scents", "gourmand vanilla fragrance"], tags: ["vanilla", "gourmand", "warm"] },
  { title: "How to choose a fragrance for cold weather", primaryKeyword: "best winter fragrances 2026", secondaryKeywords: ["autumn winter perfumes men women", "warm cozy fragrances", "best cold weather perfumes"], tags: ["winter", "guide", "seasonal"] },
  { title: "Italian niche perfumery: excellence to discover", primaryKeyword: "Italian niche perfumes best", secondaryKeywords: ["Italian artisan fragrance brands", "best Italian niche perfumers", "Italian luxury perfumes"], tags: ["Italian", "niche", "luxury"] },
  { title: "The most iconic fragrances of the last 20 years", primaryKeyword: "most iconic fragrances ever", secondaryKeywords: ["best classic perfumes all time", "most famous fragrances history", "timeless iconic scents"], tags: ["iconic", "classic", "history"] },
  { title: "Musky fragrances: clean, sensual and versatile", primaryKeyword: "best musky fragrances 2026", secondaryKeywords: ["white musk perfumes", "clean musk fragrance notes", "versatile musk scents"], tags: ["musk", "clean", "versatile"] },
  { title: "How to choose a perfume as a gift", primaryKeyword: "best perfume gift ideas", secondaryKeywords: ["fragrance gift men women", "best perfumes to give as gifts", "perfume Christmas gift"], tags: ["gift", "guide", "occasion"] },
  { title: "Chypre fragrances: timeless elegance", primaryKeyword: "chypre fragrances what are they", secondaryKeywords: ["best chypre perfumes women", "chypre fragrance notes", "oakmoss bergamot labdanum"], tags: ["chypre", "elegant", "classic"] },
  { title: "The best evening and special occasion fragrances", primaryKeyword: "best evening fragrances elegant", secondaryKeywords: ["special occasion perfumes men women", "romantic date night perfume", "night out fragrance"], tags: ["evening", "elegant", "occasion"] },
  { title: "Patchouli fragrances: earthy, rich and deep", primaryKeyword: "best patchouli fragrances", secondaryKeywords: ["patchouli perfume notes", "earthy deep fragrances men women", "patchouli perfume characteristics"], tags: ["patchouli", "earthy", "deep"] },
  { title: "The olfactory pyramid: understanding top, heart and base notes", primaryKeyword: "olfactory pyramid perfume explained", secondaryKeywords: ["top heart base notes explained", "how fragrance develops on skin", "perfume note stages"], tags: ["education", "guide", "fragrance notes"] },
  { title: "Spicy fragrances: bold, warm and unforgettable", primaryKeyword: "best spicy fragrances 2026", secondaryKeywords: ["pepper cardamom perfumes men", "warm spicy scents women", "bold spicy fragrances"], tags: ["spicy", "bold", "warm"] },
  { title: "The best men's fragrances for every season", primaryKeyword: "best men's fragrances 2026", secondaryKeywords: ["men's perfume spring summer autumn winter", "top fragrances for men", "men's fragrance guide"], tags: ["men", "guide", "seasonal"] },
];

// ---------------------------------------------------------------------------
// Image prompt builder — crafts an elegant perfume photo prompt per topic
// ---------------------------------------------------------------------------
function buildImagePrompt(tags: string[]): string {
  const t = tags.map((tag) => tag.toLowerCase());

  // Subject is always a luxury perfume bottle
  const base =
    "luxury perfume bottle, high-end fragrance product photography, editorial style, photorealistic, sharp focus, no text, no watermark, no people";

  // Background / mood / colour palette per category
  if (t.some((x) => ["oud", "arabo", "arabic", "orientale", "oriental"].includes(x))) {
    return `${base}, draped on rich burgundy silk fabric with scattered rose petals and incense smoke, warm candlelight glow, deep jewel tones, cinematic dark luxury atmosphere`;
  }
  if (t.some((x) => ["vaniglia", "vanilla", "gourmand", "dolce", "sweet"].includes(x))) {
    return `${base}, placed on warm cream marble with soft cashmere fabric and dried vanilla pods, golden hour window light, warm amber and caramel colour palette, cozy inviting mood`;
  }
  if (t.some((x) => ["floreale", "floral", "primavera", "spring"].includes(x))) {
    return `${base}, surrounded by fresh peony and rose petals on a white marble surface, soft natural daylight, pastel pink and blush tones, delicate airy atmosphere`;
  }
  if (t.some((x) => ["legnoso", "woody", "patchouli", "terroso", "earthy"].includes(x))) {
    return `${base}, resting on aged dark walnut wood with autumn leaves and cedar bark, warm amber sidelight, deep forest tones, moody sophisticated atmosphere`;
  }
  if (t.some((x) => ["acquatico", "marine", "acqua", "fresco", "fresh", "estate", "summer"].includes(x))) {
    return `${base}, on white stone surface with translucent water droplets and citrus slices, bright natural Mediterranean light, clean blue-white colour palette, airy refreshing mood`;
  }
  if (t.some((x) => ["inverno", "winter", "autunno", "autumn", "speziato", "spicy"].includes(x))) {
    return `${base}, on dark slate with cinnamon sticks, star anise and amber resin, dramatic chiaroscuro studio lighting, deep warm ochre and chocolate tones, bold moody atmosphere`;
  }
  if (t.some((x) => ["sera", "evening", "lusso", "luxury", "niche", "iconico", "iconic"].includes(x))) {
    return `${base}, on black velvet with scattered gold leaf and crystal elements, dramatic spotlight studio lighting, deep shadow contrast, ultra-luxury opulent aesthetic`;
  }
  if (t.some((x) => ["muschio", "musk", "pulito", "clean", "unisex"].includes(x))) {
    return `${base}, on minimalist white surface with soft linen fabric and a single white orchid, diffused studio light, neutral clean palette, modern elegant mood`;
  }
  if (t.some((x) => ["regalo", "gift", "occasione", "occasion"].includes(x))) {
    return `${base}, inside an open luxury gift box with satin ribbon and tissue paper on a marble table, soft warm studio light, cream and champagne gold tones, celebratory mood`;
  }

  // Generic fallback — always beautiful
  return `${base}, on white Carrara marble with a single fresh gardenia flower, soft side window light, warm ivory and gold tones, timeless luxury aesthetic`;
}

// ---------------------------------------------------------------------------
// Generate + upload cover image via fal.ai → Supabase Storage
// ---------------------------------------------------------------------------
async function generateAndUploadCoverImage(
  tags: string[],
  slug: string,
): Promise<string | null> {
  try {
    const falClient = getFalClient();
    const prompt = buildImagePrompt(tags);
    console.log(`[blog:image] prompt: "${prompt.slice(0, 90)}..."`);

    // Generate with Flux Pro v1.1 — best quality for editorial photography
    const result = await falClient.subscribe("fal-ai/flux-pro/v1.1", {
      input: {
        prompt,
        image_size: "landscape_16_9", // 1024×576 — perfect for 16:9 blog cards
        num_images: 1,
        output_format: "jpeg",
        safety_tolerance: "2",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach((message) => {
            console.log(`[blog:image] fal: ${message}`);
          });
        }
      },
    }) as { data: { images: Array<{ url: string; content_type?: string }> } };

    const generatedImage = result.data.images[0];
    const generatedUrl = generatedImage?.url;
    if (!generatedUrl) throw new Error("fal.ai returned no image URL");
    console.log(`[blog:image] generated: ${generatedUrl}`);

    // Download image bytes
    const imageResponse = await fetch(generatedUrl);
    if (!imageResponse.ok) throw new Error(`fetch failed: ${imageResponse.status}`);
    const buffer = await imageResponse.arrayBuffer();

    const contentType =
      generatedImage?.content_type ||
      imageResponse.headers.get("content-type") ||
      "image/jpeg";
    const extension =
      contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    console.log(`[blog:image] content-type: ${contentType}`);

    // Upload to Supabase Storage `blog-images` bucket
    const supabase = getSupabaseClient();
    const filename = `${slug}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("blog-images")
      .upload(filename, buffer, {
        contentType,
        upsert: false,
        cacheControl: "31536000", // 1 year
      });

    if (uploadError) {
      console.error("[blog:image] upload error:", uploadError.message);
      // Fallback: return the fal.ai URL directly (works but may expire)
      return generatedUrl;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("blog-images")
      .getPublicUrl(filename);

    console.log(`[blog:image] ✓ stored: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.error("[blog:image] generation failed (post will publish without image):", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Text generation via Claude
// ---------------------------------------------------------------------------
function getWeeklyTopicIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return week % TOPIC_POOL_IT.length;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáâä]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type GeneratedPost = {
  title: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
};

async function generatePost(topic: Topic, locale: "it" | "en"): Promise<GeneratedPost> {
  const isIt = locale === "it";
  const internalLinks = isIt ? INTERNAL_LINKS_IT : INTERNAL_LINKS_EN;

  const systemPrompt = isIt
    ? `Sei un copywriter SEO esperto specializzato in profumeria di lusso che scrive per Odora.it.
Odora è un sito italiano di scoperta e confronto profumi con catalogo selezionato e Finder intelligente.
Scrivi articoli in italiano ottimizzati per Google, con tono autorevole, caldo e accessibile.
Rispondi ONLY con un JSON valido, nessun testo aggiuntivo fuori dal JSON.`
    : `You are an SEO copywriter specialising in luxury perfumery writing for Odora.it.
Odora is an Italian fragrance discovery and price comparison site with a curated catalog and smart Finder.
Write articles in English optimised for Google, with an authoritative yet warm and accessible tone.
Reply ONLY with valid JSON, no additional text outside the JSON.`;

  const userPrompt = isIt
    ? `Scrivi un articolo blog SEO ottimizzato per Odora.it.

Titolo proposto: "${topic.title}"
Keyword primaria (usa esattamente questa keyword nel titolo H1, nel primo paragrafo e in 2-3 H2): "${topic.primaryKeyword}"
Keyword secondarie (distribuisci naturalmente nel testo): ${topic.secondaryKeywords.map((k) => `"${k}"`).join(", ")}
Tag suggeriti: ${topic.tags.map((t) => `"${t}"`).join(", ")}

Requisiti articolo:
- Lunghezza: 900-1100 parole nel campo "content"
- Struttura: intro (2 paragrafi), poi 4-5 sezioni H2 con eventuale H3, conclusione con CTA a Odora
- La keyword primaria appare nell'intro, in almeno 2 H2 e con densità ~1-2%
- Cita profumi reali e famosi (Sauvage Dior, Bleu de Chanel, Santal 33 Le Labo, Black Orchid Tom Ford, ecc.)
- Tono: esperto ma amichevole, non promozionale, no superlativi vuoti
- Formato Markdown (## per H2, ### per H3, **grassetto** per termini chiave, liste con -)

Link interni da inserire (2-4 nel testo in modo naturale):
${internalLinks}

Rispondi con questo JSON esatto (nessun testo fuori):
{
  "title": "titolo H1 ottimizzato SEO con keyword primaria (max 65 caratteri)",
  "excerpt": "meta snippet accattivante con keyword primaria, 1-2 frasi (max 155 caratteri)",
  "content": "contenuto markdown completo 900-1100 parole",
  "seoTitle": "title tag SEO (max 60 caratteri, keyword primaria all'inizio)",
  "seoDescription": "meta description con keyword primaria e CTA (max 155 caratteri)",
  "tags": ["tag1", "tag2", "tag3"]
}`
    : `Write an SEO-optimised blog post for Odora.it.

Proposed title: "${topic.title}"
Primary keyword (use this exact keyword in the H1 title, first paragraph, and 2-3 H2 headings): "${topic.primaryKeyword}"
Secondary keywords (distribute naturally throughout): ${topic.secondaryKeywords.map((k) => `"${k}"`).join(", ")}
Suggested tags: ${topic.tags.map((t) => `"${t}"`).join(", ")}

Article requirements:
- Length: 900-1100 words in the "content" field
- Structure: intro (2 paragraphs), then 4-5 H2 sections with optional H3s, conclusion with CTA to Odora
- Primary keyword appears in the intro, at least 2 H2s, and with ~1-2% density
- Mention real well-known fragrances (Sauvage Dior, Bleu de Chanel, Santal 33 Le Labo, Black Orchid Tom Ford, etc.)
- Tone: expert but friendly, not promotional, no empty superlatives
- Markdown format (## for H2, ### for H3, **bold** for key terms, lists with -)

Internal links to insert (2-4 naturally in the text):
${internalLinks}

Reply with this exact JSON (no text outside):
{
  "title": "SEO-optimised H1 title with primary keyword (max 65 chars)",
  "excerpt": "compelling meta snippet with primary keyword, 1-2 sentences (max 155 chars)",
  "content": "full markdown content 900-1100 words",
  "seoTitle": "SEO title tag (max 60 chars, primary keyword first)",
  "seoDescription": "meta description with primary keyword and CTA (max 155 chars)",
  "tags": ["tag1", "tag2", "tag3"]
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = message.content[0];
  if (text.type !== "text") throw new Error("Unexpected response type");

  const jsonMatch = text.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  return JSON.parse(jsonMatch[0]) as GeneratedPost;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const noImage = process.argv.includes("--no-image");
  const indexArg = process.argv.find((a) => a.startsWith("--index="));
  const idx = indexArg ? parseInt(indexArg.replace("--index=", "")) : getWeeklyTopicIndex();

  const topicIt = TOPIC_POOL_IT[idx];
  const topicEn = TOPIC_POOL_EN[idx];

  if (!topicIt || !topicEn) {
    console.error(`[blog:generate] invalid index ${idx}, max is ${TOPIC_POOL_IT.length - 1}`);
    process.exitCode = 1;
    return;
  }

  console.log(`[blog:generate] week-index=${idx} topic="${topicIt.title}" dryRun=${dryRun} noImage=${noImage}`);
  console.log(`[blog:generate] primary-keyword-it="${topicIt.primaryKeyword}"`);

  // 1. Generate text content for both locales in parallel
  console.log(`[blog:generate] generating text content (IT + EN)...`);
  const [postIt, postEn] = await Promise.all([
    generatePost(topicIt, "it"),
    generatePost(topicEn, "en"),
  ]);

  const slug = slugify(postIt.title);
  const publishedAt = new Date();

  if (dryRun) {
    console.log("\n=== ITALIAN ===");
    console.log(`title: ${postIt.title}`);
    console.log(`seoTitle: ${postIt.seoTitle}`);
    console.log(`seoDescription: ${postIt.seoDescription}`);
    console.log(`excerpt: ${postIt.excerpt}`);
    console.log(`tags: ${postIt.tags.join(", ")}`);
    console.log(`\nContent preview (first 500 chars):\n${postIt.content.slice(0, 500)}...`);
    console.log("\n=== ENGLISH ===");
    console.log(`title: ${postEn.title}`);
    console.log(`seoTitle: ${postEn.seoTitle}`);
    console.log(`seoDescription: ${postEn.seoDescription}`);
    console.log(`\nContent preview (first 500 chars):\n${postEn.content.slice(0, 500)}...`);
    console.log(`\nslug: ${slug}`);
    await prisma.$disconnect();
    return;
  }

  // 2. Generate cover image (single image shared between IT + EN)
  let coverImageUrl: string | null = null;
  if (!noImage) {
    console.log(`[blog:generate] generating cover image...`);
    coverImageUrl = await generateAndUploadCoverImage(topicIt.tags, slug);
  } else {
    console.log(`[blog:generate] skipping image generation (--no-image)`);
  }

  // 3. Save both locales to DB
  await prisma.blogPost.upsert({
    where: { slug_locale: { slug, locale: "it" } },
    create: { slug, locale: "it", publishedAt, coverImageUrl, ...postIt },
    update: { publishedAt, coverImageUrl, ...postIt },
  });

  await prisma.blogPost.upsert({
    where: { slug_locale: { slug, locale: "en" } },
    create: { slug, locale: "en", publishedAt, coverImageUrl, ...postEn },
    update: { publishedAt, coverImageUrl, ...postEn },
  });

  console.log(`[blog:generate] ✓ published slug="${slug}" (it + en) coverImage=${coverImageUrl ? "yes" : "none"}`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("[blog:generate] fatal:", error);
  await prisma.$disconnect();
  process.exitCode = 1;
});

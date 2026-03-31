/**
 * Uploads verified catalog images from approved-images/ to Supabase storage.
 * Run from the worktree root: node --import tsx scripts/upload-images-to-supabase.ts
 */

import { readFile, readdir, access } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const APPROVED_IMAGES_DIR = path.join(ROOT, "approved-images");
const CSV_PATH = path.join(ROOT, "data/verified/perfumes.csv");
const BUCKET = "perfumes";

function loadEnv() {
  // Try root repo .env (two levels up from worktree if in worktrees subdir, or CWD/.env)
  const candidates = [
    path.join(ROOT, ".env"),
    path.join(ROOT, ".env.local"),
  ];
  return candidates;
}

async function readDotenv(filePath: string): Promise<Record<string, string>> {
  const env: Record<string, string> = {};
  try {
    const content = await readFile(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  } catch {
    // file not found, skip
  }
  return env;
}

function parseCsv(content: string): Array<Record<string, string>> {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h.trim()] = (values[i] ?? "").trim(); });
    return row;
  });
}

async function uploadFile(params: {
  supabaseUrl: string;
  serviceRoleKey: string;
  bucket: string;
  storagePath: string;
  buffer: Buffer;
}): Promise<"uploaded" | "exists" | "error"> {
  const encodedPath = params.storagePath.split("/").map(encodeURIComponent).join("/");
  const url = `${params.supabaseUrl}/storage/v1/object/${encodeURIComponent(params.bucket)}/${encodedPath}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.serviceRoleKey}`,
        apikey: params.serviceRoleKey,
        "Content-Type": "image/jpeg",
        "x-upsert": "false",
      },
      body: new Uint8Array(params.buffer),
      signal: AbortSignal.timeout(30_000),
    });
    if (res.ok) return "uploaded";
    const body = await res.text();
    if (res.status === 400 && body.toLowerCase().includes("already exists")) return "exists";
    console.error(`  HTTP ${res.status}: ${body.slice(0, 200)}`);
    return "error";
  } catch (e) {
    console.error(`  fetch error: ${e}`);
    return "error";
  }
}

async function main() {
  // Load credentials
  let supabaseUrl = process.env.SUPABASE_URL ?? "";
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    for (const envFile of loadEnv()) {
      const parsed = await readDotenv(envFile);
      if (parsed.SUPABASE_URL && !supabaseUrl) supabaseUrl = parsed.SUPABASE_URL;
      if (parsed.SUPABASE_SERVICE_ROLE_KEY && !serviceRoleKey) serviceRoleKey = parsed.SUPABASE_SERVICE_ROLE_KEY;
    }
  }

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env");
  }

  console.log(`Supabase: ${supabaseUrl}`);
  console.log(`Bucket: ${BUCKET}`);

  // Build map: slug → storagePath from DB
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const perfumes = await db.perfume.findMany({
    select: { slug: true, brand: { select: { slug: true } } },
  });
  await db.$disconnect();

  const slugToStoragePath = new Map<string, string>();
  for (const p of perfumes) {
    slugToStoragePath.set(p.slug, `${p.brand.slug}/${p.slug}.jpg`);
  }

  // Also read CSV for any extra storage path overrides
  try {
    const csvContent = await readFile(CSV_PATH, "utf8");
    const rows = parseCsv(csvContent);
    for (const row of rows) {
      const slug = row["slug"];
      const storagePath = row["image_storage_path"];
      if (slug && storagePath) slugToStoragePath.set(slug, storagePath);
    }
  } catch { /* CSV optional */ }

  console.log(`\nFound ${slugToStoragePath.size} perfumes in catalog with storage paths.`);

  // List all files in approved-images/
  const files = await readdir(APPROVED_IMAGES_DIR);
  const jpgFiles = files.filter((f) => f.endsWith(".jpg") || f.endsWith(".png") || f.endsWith(".webp"));

  console.log(`Found ${jpgFiles.length} image files in approved-images/\n`);

  let uploaded = 0, exists = 0, skipped = 0, errors = 0;

  for (const file of jpgFiles) {
    const slug = file.replace(/\.(jpg|png|webp)$/, "");
    const storagePath = slugToStoragePath.get(slug);

    if (!storagePath) {
      // Not in verified catalog, skip silently
      skipped++;
      continue;
    }

    const localPath = path.join(APPROVED_IMAGES_DIR, file);
    const buffer = await readFile(localPath);

    process.stdout.write(`Uploading ${storagePath} ... `);
    const result = await uploadFile({ supabaseUrl, serviceRoleKey, bucket: BUCKET, storagePath, buffer });

    if (result === "uploaded") {
      console.log("✓ uploaded");
      uploaded++;
    } else if (result === "exists") {
      console.log("• already exists");
      exists++;
    } else {
      console.log("✗ error");
      errors++;
    }
  }

  console.log("\n── Summary ──────────────────────");
  console.log(`uploaded:      ${uploaded}`);
  console.log(`already exist: ${exists}`);
  console.log(`skipped:       ${skipped}`);
  console.log(`errors:        ${errors}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

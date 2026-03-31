import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CatalogStatus, PrismaClient } from "@prisma/client";

import { cleanString, normalizeCsvHeader } from "./lib/normalize";
import { slugify } from "./lib/slug";

type CliOptions = {
  limit: number;
  status: "VERIFIED" | "IMPORTED_UNVERIFIED" | "all";
  manifestPath: string;
  dryRun: boolean;
};

type RowObject = Record<string, string>;

type ManifestRow = {
  brand: string;
  name: string;
  slug: string;
  local_image_path: string;
  approved_image_url: string;
  image_storage_path: string;
};

const DEFAULT_LIMIT = 2000;
const DEFAULT_MANIFEST_PATH = "data/archive/verified/images/approved-images-manifest.csv";
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..");
const rootEnvPath = path.join(repoRoot, ".env");

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    limit: DEFAULT_LIMIT,
    status: "all",
    manifestPath: DEFAULT_MANIFEST_PATH,
    dryRun: false,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const parsed = Number.parseInt(arg.replace("--limit=", ""), 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.limit = parsed;
      }
      continue;
    }

    if (arg.startsWith("--status=")) {
      const raw = cleanString(arg.replace("--status=", "")).toUpperCase();
      if (raw === "VERIFIED" || raw === "IMPORTED_UNVERIFIED") {
        options.status = raw;
      } else {
        options.status = "all";
      }
      continue;
    }

    if (arg.startsWith("--manifest=")) {
      const input = cleanString(arg.replace("--manifest=", ""));
      if (input) {
        options.manifestPath = input;
      }
    }
  }

  return options;
}

function parseDotenvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const withoutExport = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
  const separatorIndex = withoutExport.indexOf("=");
  if (separatorIndex <= 0) {
    return null;
  }

  const key = withoutExport.slice(0, separatorIndex).trim();
  let value = withoutExport.slice(separatorIndex + 1).trim();

  if (!key) {
    return null;
  }

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  return [key, value];
}

async function loadRootDotenv() {
  try {
    await access(rootEnvPath);
  } catch {
    return;
  }

  const content = await readFile(rootEnvPath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const parsed = parseDotenvLine(line);
    if (!parsed) {
      continue;
    }

    const [key, value] = parsed;
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function parseCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];

    if (char === '"') {
      if (inQuotes && content[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && content[index + 1] === "\n") {
        index += 1;
      }

      row.push(field);
      field = "";

      if (row.some((cell) => cleanString(cell).length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cleanString(cell).length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

function escapeCsvValue(value: string): string {
  if (value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  if (value.includes(",") || value.includes("\n") || value.includes("\r")) {
    return `"${value}"`;
  }
  return value;
}

function toCsv(headers: string[], rows: RowObject[]): string {
  const lines = [headers.join(",")];

  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvValue(row[header] ?? "")).join(","));
  }

  return `${lines.join("\n")}\n`;
}

async function loadExistingManifest(filePath: string): Promise<{ headers: string[]; rows: RowObject[] }> {
  const requiredHeaders = [
    "brand",
    "name",
    "slug",
    "local_image_path",
    "approved_image_url",
    "image_storage_path",
  ];

  try {
    await access(filePath);
  } catch {
    return {
      headers: requiredHeaders,
      rows: [],
    };
  }

  const content = await readFile(filePath, "utf8");
  const parsed = parseCsvRows(content);

  if (parsed.length === 0) {
    return {
      headers: requiredHeaders,
      rows: [],
    };
  }

  const headers = [...parsed[0]];
  const headerMap = new Map<string, string>();

  for (const header of headers) {
    const normalized = normalizeCsvHeader(header);
    if (!normalized || headerMap.has(normalized)) {
      continue;
    }
    headerMap.set(normalized, header);
  }

  for (const required of requiredHeaders) {
    const normalized = normalizeCsvHeader(required);
    if (!headerMap.has(normalized)) {
      headers.push(required);
      headerMap.set(normalized, required);
    }
  }

  const originalHeaders = parsed[0];
  const dataRows = parsed.slice(1);

  const rows: RowObject[] = dataRows.map((dataRow) => {
    const row: RowObject = {};
    for (let index = 0; index < headers.length; index += 1) {
      const header = headers[index];
      const originalIndex = originalHeaders.indexOf(header);
      row[header] = originalIndex >= 0 ? (dataRow[originalIndex] ?? "") : "";
    }
    return row;
  });

  return {
    headers,
    rows,
  };
}

function buildManifestRow(params: {
  brand: string;
  name: string;
  slug: string;
  brandSlug: string;
  approvedImageUrl?: string;
}): ManifestRow {
  return {
    brand: params.brand,
    name: params.name,
    slug: params.slug,
    local_image_path: `approved-images/${params.slug}.jpg`,
    approved_image_url: cleanString(params.approvedImageUrl),
    image_storage_path: `${params.brandSlug}/${params.slug}.jpg`,
  };
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const manifestPath = path.resolve(repoRoot, options.manifestPath);

  await loadRootDotenv();

  const prisma = new PrismaClient();

  try {
    const statusWhere =
      options.status === "VERIFIED"
        ? { catalogStatus: CatalogStatus.VERIFIED }
        : options.status === "IMPORTED_UNVERIFIED"
          ? { catalogStatus: CatalogStatus.IMPORTED_UNVERIFIED }
          : undefined;

    const perfumes = await prisma.perfume.findMany({
      where: {
        AND: [
          {
            OR: [{ imageUrl: null }, { imageUrl: "" }],
          },
          ...(statusWhere ? [statusWhere] : []),
        ],
      },
      include: {
        brand: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
      take: options.limit,
    });

    const existing = await loadExistingManifest(manifestPath);

    const bySlug = new Map<string, RowObject>();
    for (const row of existing.rows) {
      const slug = cleanString(row.slug);
      if (slug) {
        bySlug.set(slug, row);
      }
    }

    let addedRows = 0;

    for (const perfume of perfumes) {
      const brandName = cleanString(perfume.brand.name);
      const brandSlug = cleanString(perfume.brand.slug) || slugify(brandName);
      const rowData = buildManifestRow({
        brand: brandName,
        name: cleanString(perfume.name),
        slug: cleanString(perfume.slug),
        brandSlug,
      });

      const existingRow = bySlug.get(rowData.slug);
      if (!existingRow) {
        bySlug.set(rowData.slug, {
          ...rowData,
        });
        addedRows += 1;
        continue;
      }

      existingRow.brand = rowData.brand;
      existingRow.name = rowData.name;
      existingRow.slug = rowData.slug;
      existingRow.local_image_path = rowData.local_image_path;
      existingRow.image_storage_path = rowData.image_storage_path;
      if (!cleanString(existingRow.approved_image_url)) {
        existingRow.approved_image_url = rowData.approved_image_url;
      }
    }

    const sortedRows = [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));

    if (!options.dryRun) {
      const output = toCsv(existing.headers, sortedRows);
      await writeFile(manifestPath, output, "utf8");
    }

    console.log(`[manifest-from-db] status: ${options.status}`);
    console.log(`[manifest-from-db] limit: ${options.limit}`);
    console.log(`[manifest-from-db] manifest path: ${manifestPath}`);
    console.log(`[manifest-from-db] perfumes selected: ${perfumes.length}`);
    console.log(`[manifest-from-db] manifest rows added: ${addedRows}`);
    console.log(`[manifest-from-db] manifest total rows: ${sortedRows.length}`);
    console.log(`[manifest-from-db] dryRun: ${options.dryRun}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[manifest-from-db] failed:", error);
  process.exitCode = 1;
});

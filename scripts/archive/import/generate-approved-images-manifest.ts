import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { cleanString, normalizeCsvHeader } from "./lib/normalize";
import { slugify } from "./lib/slug";

type RowObject = Record<string, string>;

type CliOptions = {
  inputPath: string;
  outputPath: string;
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..");

const DEFAULT_INPUT = "data/verified/perfumes.csv";
const DEFAULT_OUTPUT = "data/verified/approved-images-manifest.csv";

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    inputPath: DEFAULT_INPUT,
    outputPath: DEFAULT_OUTPUT,
  };

  for (const arg of argv) {
    if (arg.startsWith("--input=")) {
      options.inputPath = arg.replace("--input=", "");
      continue;
    }

    if (arg.startsWith("--output=")) {
      options.outputPath = arg.replace("--output=", "");
    }
  }

  return options;
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

function normalizeStoragePath(value: string): string {
  return cleanString(value).replace(/^\/+/, "").replace(/^perfumes\//i, "");
}

function getField(row: RowObject, headerMap: Map<string, string>, aliases: string[]) {
  for (const alias of aliases) {
    const header = headerMap.get(normalizeCsvHeader(alias));
    if (!header) {
      continue;
    }

    const value = cleanString(row[header]);
    if (value) {
      return value;
    }
  }

  return "";
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const inputPath = path.resolve(repoRoot, options.inputPath);
  const outputPath = path.resolve(repoRoot, options.outputPath);

  const inputContent = await readFile(inputPath, "utf8");
  const parsed = parseCsvRows(inputContent);
  if (parsed.length === 0) {
    throw new Error("Input CSV is empty");
  }

  const headers = parsed[0];
  const dataRows = parsed.slice(1);

  const headerMap = new Map<string, string>();
  for (const header of headers) {
    const key = normalizeCsvHeader(header);
    if (!key || headerMap.has(key)) {
      continue;
    }
    headerMap.set(key, header);
  }

  const rows: RowObject[] = dataRows.map((dataRow) => {
    const row: RowObject = {};
    for (let index = 0; index < headers.length; index += 1) {
      row[headers[index]] = dataRow[index] ?? "";
    }
    return row;
  });

  const manifestHeaders = ["brand", "name", "slug", "local_image_path", "approved_image_url", "image_storage_path"];
  const manifestRows: RowObject[] = [];

  for (const row of rows) {
    const brand = getField(row, headerMap, ["brand"]);
    const name = getField(row, headerMap, ["name"]);

    if (!brand || !name) {
      continue;
    }

    const slug =
      getField(row, headerMap, ["slug", "perfume_slug", "perfumeslug"]) || slugify(`${brand}-${name}`);

    const storagePath =
      normalizeStoragePath(getField(row, headerMap, ["image_storage_path", "imagestoragepath"])) ||
      `${slugify(brand)}/${slug}.jpg`;

    manifestRows.push({
      brand,
      name,
      slug,
      local_image_path: `approved-images/${slug}.jpg`,
      approved_image_url: "",
      image_storage_path: storagePath,
    });
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, toCsv(manifestHeaders, manifestRows), "utf8");

  console.log(`[manifest] input: ${inputPath}`);
  console.log(`[manifest] output: ${outputPath}`);
  console.log(`[manifest] rows: ${manifestRows.length}`);
}

main().catch((error) => {
  console.error("[manifest] failed:", error);
  process.exitCode = 1;
});

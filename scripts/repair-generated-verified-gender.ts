import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { parseCsvRows, toCsv } from "@/lib/perfume-data/csv";
import { VERIFIED_CLEANED_PATH, VERIFIED_ENRICHED_PATH, VERIFIED_INPUT_PATH } from "@/lib/perfume-data/paths";
import { normalizeCsvHeader } from "@/lib/perfume-data/normalize";

type CsvRow = Record<string, string>;

function parseCsvWithHeaders(content: string) {
  const rows = parseCsvRows(content);
  if (rows.length === 0) {
    throw new Error("CSV is empty.");
  }

  const headers = rows[0];
  const records: CsvRow[] = [];

  for (const row of rows.slice(1)) {
    const record: CsvRow = {};
    for (let index = 0; index < headers.length; index += 1) {
      record[headers[index]] = row[index] ?? "";
    }
    records.push(record);
  }

  return { headers, records };
}

function findHeader(headers: string[], alias: string) {
  return headers.find((header) => normalizeCsvHeader(header) === normalizeCsvHeader(alias));
}

async function loadCsv(csvPath: string) {
  const resolvedPath = path.resolve(process.cwd(), csvPath);
  const content = await readFile(resolvedPath, "utf8");
  return {
    resolvedPath,
    ...parseCsvWithHeaders(content),
  };
}

async function main() {
  const source = await loadCsv(VERIFIED_INPUT_PATH);
  const sourceSlugHeader = findHeader(source.headers, "slug");
  const sourceGenderHeader = findHeader(source.headers, "gender");

  if (!sourceSlugHeader || !sourceGenderHeader) {
    throw new Error("Source CSV must include slug and gender headers.");
  }

  const genderBySlug = new Map<string, string>();
  for (const record of source.records) {
    const slug = record[sourceSlugHeader]?.trim();
    const gender = record[sourceGenderHeader]?.trim();
    if (!slug || !gender) {
      continue;
    }
    genderBySlug.set(slug, gender);
  }

  for (const csvPath of [VERIFIED_CLEANED_PATH, VERIFIED_ENRICHED_PATH]) {
    const target = await loadCsv(csvPath);
    const slugHeader = findHeader(target.headers, "slug");
    const genderHeader = findHeader(target.headers, "gender");

    if (!slugHeader || !genderHeader) {
      throw new Error(`${csvPath} must include slug and gender headers.`);
    }

    let updatedRows = 0;
    for (const record of target.records) {
      const slug = record[slugHeader]?.trim();
      const expectedGender = slug ? genderBySlug.get(slug) : undefined;
      if (!slug || !expectedGender || record[genderHeader] === expectedGender) {
        continue;
      }

      record[genderHeader] = expectedGender;
      updatedRows += 1;
    }

    await writeFile(target.resolvedPath, toCsv(target.headers, target.records), "utf8");
    console.log(`[repair-generated-verified-gender] ${csvPath}: updated ${updatedRows} row(s)`);
  }
}

main().catch((error) => {
  console.error("[repair-generated-verified-gender] failed:", error);
  process.exitCode = 1;
});

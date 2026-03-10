import { access, readFile } from "node:fs/promises";
import path from "node:path";

import type { LoadedPerfumeInput, RawPerfumeRecord } from "@/lib/perfume-data/types";

export function parseCsvRows(content: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];

    if (char === "\"") {
      if (inQuotes && content[index + 1] === "\"") {
        field += "\"";
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

      if (row.some((cell) => cell.trim().length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim().length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

export function escapeCsvValue(value: string) {
  if (value.includes("\"")) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }

  if (value.includes(",") || value.includes("\n") || value.includes("\r")) {
    return `"${value}"`;
  }

  return value;
}

export function toCsv(headers: string[], rows: Array<Record<string, string>>) {
  const lines = [headers.join(",")];

  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvValue(row[header] ?? "")).join(","));
  }

  return `${lines.join("\n")}\n`;
}

function parseCsv(content: string, normalizeHeader: (value: string) => string): LoadedPerfumeInput {
  const rows = parseCsvRows(content);
  if (rows.length < 2) {
    return { format: "csv", malformedRows: ["CSV has no data rows."], records: [] };
  }

  const headers = rows[0].map((value) => normalizeHeader(value));
  const malformedRows: string[] = [];
  const records: LoadedPerfumeInput["records"] = [];

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    const sourceRow = index + 1;

    if (row.length !== headers.length) {
      malformedRows.push(`row ${sourceRow}: expected ${headers.length} columns, found ${row.length}`);
      continue;
    }

    const record: RawPerfumeRecord = {};
    for (let column = 0; column < headers.length; column += 1) {
      record[headers[column]] = row[column] ?? "";
    }

    records.push({ sourceRow, record });
  }

  return { format: "csv", malformedRows, records };
}

function parseJson(content: string): LoadedPerfumeInput {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) {
      return { format: "json", malformedRows: ["JSON must be an array of records."], records: [] };
    }

    return {
      format: "json",
      malformedRows: [],
      records: parsed
        .map((item, index) => ({
          sourceRow: index + 1,
          record: typeof item === "object" && item !== null ? (item as RawPerfumeRecord) : {},
        }))
        .filter((item) => Object.keys(item.record).length > 0),
    };
  } catch (error) {
    return {
      format: "json",
      malformedRows: [`invalid JSON: ${error instanceof Error ? error.message : "unknown parse error"}`],
      records: [],
    };
  }
}

export async function loadPerfumeInput(params: {
  inputPath: string;
  format: "auto" | "csv" | "json";
  normalizeHeader: (value: string) => string;
}) {
  const resolvedPath = path.resolve(process.cwd(), params.inputPath);
  await access(resolvedPath);
  const content = await readFile(resolvedPath, "utf8");

  const resolvedFormat =
    params.format !== "auto"
      ? params.format
      : resolvedPath.toLowerCase().endsWith(".json")
        ? "json"
        : "csv";

  const loaded =
    resolvedFormat === "json"
      ? parseJson(content)
      : parseCsv(content, params.normalizeHeader);

  return {
    inputPath: resolvedPath,
    ...loaded,
  };
}

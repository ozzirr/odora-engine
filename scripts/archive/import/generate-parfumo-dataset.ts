import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

type PerfumeRow = {
  brand: string;
  name: string;
  gender: "MEN" | "WOMEN" | "UNISEX";
  year: number;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  family: string;
  rating: number;
  imageUrl: string;
};

type ImportStats = {
  perfumesInserted: number;
  brandsCreated: number;
  notesCreated: number;
  duplicatesSkipped: number;
};

const CSV_HEADERS = [
  "brand",
  "name",
  "gender",
  "year",
  "top_notes",
  "heart_notes",
  "base_notes",
  "family",
  "rating",
  "imageUrl",
] as const;

const TOTAL_ROWS = 2_000;
const OUTPUT_FILE = path.resolve(process.cwd(), "data/archive/synthetic/parfumo/perfumes.csv");

const BRANDS = [
  "Dior",
  "Chanel",
  "Xerjoff",
  "Lattafa",
  "Amouage",
  "Tom Ford",
  "Guerlain",
  "Maison Francis Kurkdjian",
  "Diptyque",
  "Byredo",
  "Yves Saint Laurent",
  "Acqua di Parma",
  "Parfums de Marly",
  "Initio",
  "Mancera",
  "Montale",
  "Nishane",
  "Memo Paris",
  "Frederic Malle",
  "Le Labo",
];

const GENDERS: Array<PerfumeRow["gender"]> = ["MEN", "WOMEN", "UNISEX"];

const FAMILIES = [
  "Amber Gourmand",
  "Woody Spicy",
  "Fresh Citrus",
  "Floral Musk",
  "Aromatic Fougere",
  "Woody Amber",
  "Floral Woody Musk",
  "Oriental Vanilla",
  "Green Aromatic",
  "Citrus Aromatic",
];

const TOP_NOTES = [
  "Bergamot",
  "Lemon",
  "Mandarin",
  "Pink Pepper",
  "Cardamom",
  "Saffron",
  "Grapefruit",
  "Apple",
  "Pear",
  "Fig Leaf",
  "Lavender",
  "Neroli",
  "Aldehydes",
  "Juniper Berries",
  "Ginger",
  "Mint",
];

const HEART_NOTES = [
  "Rose",
  "Jasmine",
  "Orange Blossom",
  "Iris",
  "Geranium",
  "Violet",
  "Cinnamon",
  "Lavender",
  "Tuberose",
  "Ylang Ylang",
  "Patchouli",
  "Cedar",
  "Fig",
  "Dates",
  "Coffee",
  "Nutmeg",
];

const BASE_NOTES = [
  "Vanilla",
  "Amber",
  "Musk",
  "Oud",
  "Sandalwood",
  "Vetiver",
  "Tonka Bean",
  "Benzoin",
  "Labdanum",
  "Incense",
  "Oakmoss",
  "Myrrh",
  "Cedarwood",
  "Praline",
  "Leather",
  "Cashmeran",
];

const PERFUME_NAME_PART_A = [
  "Noir",
  "Velvet",
  "Royal",
  "Noble",
  "Mystic",
  "Luminous",
  "Intense",
  "Absolu",
  "Eclat",
  "Saffron",
  "Amber",
  "Oud",
  "Solar",
  "Silk",
  "Midnight",
  "Zenith",
  "Aura",
  "Opaline",
];

const PERFUME_NAME_PART_B = [
  "Elixir",
  "Essence",
  "Eau de Parfum",
  "Parfum",
  "Reserve",
  "Signature",
  "Edition",
  "Trail",
  "Veil",
  "Bloom",
  "Pulse",
  "Legend",
  "Spirit",
  "Fusion",
  "Whisper",
  "Code",
  "Nectar",
  "Sillage",
];

function createRng(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function pickUnique(list: string[], amount: number, rng: () => number): string[] {
  const pool = [...list];
  const selected: string[] = [];
  while (selected.length < amount && pool.length > 0) {
    const index = Math.floor(rng() * pool.length);
    selected.push(pool[index]);
    pool.splice(index, 1);
  }
  return selected;
}

function escapeCsvValue(value: string): string {
  if (value.includes("\"")) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  if (value.includes(",") || value.includes("\n") || value.includes("\r")) {
    return `"${value}"`;
  }
  return value;
}

function buildRow(row: PerfumeRow): string {
  const columns = [
    row.brand,
    row.name,
    row.gender,
    String(row.year),
    row.topNotes.join(";"),
    row.heartNotes.join(";"),
    row.baseNotes.join(";"),
    row.family,
    row.rating.toFixed(1),
    row.imageUrl,
  ];

  return columns.map(escapeCsvValue).join(",");
}

function generateDataset(totalRows: number): PerfumeRow[] {
  const rng = createRng(20260309);
  const rows: PerfumeRow[] = [];

  for (let index = 0; index < totalRows; index += 1) {
    const brand = BRANDS[index % BRANDS.length];
    const gender = GENDERS[Math.floor(rng() * GENDERS.length)];
    const year = 1980 + Math.floor(rng() * (2024 - 1980 + 1));
    const family = FAMILIES[Math.floor(rng() * FAMILIES.length)];
    const rating = 3.5 + rng() * 1.4;

    const partA = PERFUME_NAME_PART_A[Math.floor(rng() * PERFUME_NAME_PART_A.length)];
    const partB = PERFUME_NAME_PART_B[Math.floor(rng() * PERFUME_NAME_PART_B.length)];
    const sequence = String(index + 1).padStart(4, "0");
    const name = `${partA} ${partB} ${sequence}`;

    const topNotes = pickUnique(TOP_NOTES, 3, rng);
    const heartNotes = pickUnique(HEART_NOTES, 3, rng);
    const baseNotes = pickUnique(BASE_NOTES, 3, rng);

    let imageUrl = "";
    if ((index + 1) % 5 === 0) {
      imageUrl = `https://images.odora.it/perfumes/${brand.toLowerCase().replace(/\s+/g, "-")}-${sequence}.jpg`;
    }

    rows.push({
      brand,
      name,
      gender,
      year,
      topNotes,
      heartNotes,
      baseNotes,
      family,
      rating,
      imageUrl,
    });
  }

  return rows;
}

async function runImport(): Promise<ImportStats> {
  return new Promise<ImportStats>((resolve, reject) => {
    const command = spawn("npm", ["run", "import:parfumo"], {
      cwd: process.cwd(),
      stdio: ["inherit", "pipe", "pipe"],
      env: process.env,
      shell: false,
    });

    let output = "";

    command.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });

    command.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });

    command.on("error", (error) => reject(error));
    command.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Importer exited with code ${code}`));
        return;
      }

      const perfumesInserted = Number.parseInt(
        output.match(/inserted perfumes:\s*(\d+)/i)?.[1] ?? "0",
        10,
      );
      const brandsCreated = Number.parseInt(
        output.match(/inserted brands:\s*(\d+)/i)?.[1] ?? "0",
        10,
      );
      const notesCreated = Number.parseInt(output.match(/inserted notes:\s*(\d+)/i)?.[1] ?? "0", 10);
      const duplicatesSkipped = Number.parseInt(output.match(/duplicates:\s*(\d+)/i)?.[1] ?? "0", 10);

      resolve({
        perfumesInserted,
        brandsCreated,
        notesCreated,
        duplicatesSkipped,
      });
    });
  });
}

async function main() {
  const rows = generateDataset(TOTAL_ROWS);
  const csvRows = [CSV_HEADERS.join(","), ...rows.map(buildRow)];
  const csv = `${csvRows.join("\n")}\n`;

  await mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(OUTPUT_FILE, csv, "utf8");

  console.log(`[dataset] generated ${rows.length} perfumes`);
  console.log(`[dataset] file ${OUTPUT_FILE}`);
  console.log("[dataset] columns brand,name,gender,year,top_notes,heart_notes,base_notes,family,rating,imageUrl");

  const stats = await runImport();

  console.log("");
  console.log("Final import stats");
  console.log("------------------");
  console.log(`perfumes inserted: ${stats.perfumesInserted}`);
  console.log(`brands created: ${stats.brandsCreated}`);
  console.log(`notes created: ${stats.notesCreated}`);
  console.log(`duplicates skipped: ${stats.duplicatesSkipped}`);
}

main().catch((error) => {
  console.error("[dataset] failed:", error);
  process.exitCode = 1;
});

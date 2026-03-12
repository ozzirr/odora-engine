import { Gender, NoteType, type Prisma, PriceRange } from "@prisma/client";

export type SearchParamInput = Record<string, string | string[] | undefined>;

export const genderOptions = [
  { value: "male" },
  { value: "female" },
  { value: "unisex" },
] as const;

export const familyOptions = [
  { value: "woody" },
  { value: "fresh" },
  { value: "oriental" },
  { value: "gourmand" },
  { value: "citrus" },
  { value: "aromatic" },
] as const;

export const priceOptions = [
  { value: "budget" },
  { value: "mid" },
  { value: "premium" },
  { value: "luxury" },
] as const;

export const noteFilterOptions = [
  { value: "oud" },
  { value: "vanilla" },
  { value: "amber" },
  { value: "rose" },
  { value: "sandalwood" },
  { value: "musk" },
  { value: "citrus" },
  { value: "jasmine" },
  { value: "coffee" },
  { value: "patchouli" },
] as const;

export const sortOptions = [
  { value: "rating" },
  { value: "price_low" },
  { value: "price_high" },
  { value: "longevity" },
  { value: "sillage" },
] as const;

export type GenderParam = (typeof genderOptions)[number]["value"];
export type FamilyParam = (typeof familyOptions)[number]["value"];
export type PriceParam = (typeof priceOptions)[number]["value"];
export type SortParam = (typeof sortOptions)[number]["value"];

export type ParsedPerfumeFilters = {
  gender?: GenderParam;
  family?: FamilyParam;
  price?: PriceParam;
  arabic?: boolean;
  niche?: boolean;
  sort?: SortParam;
  note?: string;
  top?: string;
  heart?: string;
  base?: string;
};

type SortingResult = {
  query: Prisma.PerfumeFindManyArgs;
  postSort?: "price_low" | "price_high";
};

const genderMap: Record<GenderParam, Gender> = {
  male: Gender.MEN,
  female: Gender.WOMEN,
  unisex: Gender.UNISEX,
};

const priceMap: Record<PriceParam, PriceRange> = {
  budget: PriceRange.BUDGET,
  mid: PriceRange.MID,
  premium: PriceRange.PREMIUM,
  luxury: PriceRange.LUXURY,
};

const familyKeywords: Record<FamilyParam, string[]> = {
  woody: ["woody", "wood"],
  fresh: ["fresh", "green"],
  oriental: ["oriental", "amber", "oud"],
  gourmand: ["gourmand", "vanilla"],
  citrus: ["citrus"],
  aromatic: ["aromatic"],
};

const noteAliases: Record<string, string[]> = {
  citrus: ["bergamot", "lemon", "grapefruit", "mandarin"],
};

function readParamValue(input: string | string[] | undefined) {
  if (!input) {
    return undefined;
  }

  return Array.isArray(input) ? input[0] : input;
}

function parseBoolean(input: string | undefined) {
  if (input === "true") {
    return true;
  }

  if (input === "false") {
    return false;
  }

  return undefined;
}

function normalizeNoteInput(input: string | undefined) {
  if (!input) {
    return undefined;
  }

  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return normalized.length > 0 ? normalized : undefined;
}

function resolveNoteSlugs(noteValue: string) {
  return noteAliases[noteValue] ?? [noteValue];
}

function buildTypedNoteFilter(slugOrAlias: string, noteType: NoteType): Prisma.PerfumeWhereInput {
  const slugs = resolveNoteSlugs(slugOrAlias);

  return {
    notes: {
      some: {
        note: {
          noteType,
          slug: {
            in: slugs,
          },
        },
      },
    },
  };
}

export function buildPerfumeQuery(searchParams: SearchParamInput) {
  const genderParam = readParamValue(searchParams.gender);
  const familyParam = readParamValue(searchParams.family);
  const priceParam = readParamValue(searchParams.price);
  const arabicParam = readParamValue(searchParams.arabic);
  const nicheParam = readParamValue(searchParams.niche);
  const sortParam = readParamValue(searchParams.sort);
  const noteParam = readParamValue(searchParams.note);
  const topParam = readParamValue(searchParams.top);
  const heartParam = readParamValue(searchParams.heart);
  const baseParam = readParamValue(searchParams.base);

  const parsed: ParsedPerfumeFilters = {
    gender: genderOptions.some((option) => option.value === genderParam)
      ? (genderParam as GenderParam)
      : undefined,
    family: familyOptions.some((option) => option.value === familyParam)
      ? (familyParam as FamilyParam)
      : undefined,
    price: priceOptions.some((option) => option.value === priceParam)
      ? (priceParam as PriceParam)
      : undefined,
    arabic: parseBoolean(arabicParam),
    niche: parseBoolean(nicheParam),
    sort: sortOptions.some((option) => option.value === sortParam)
      ? (sortParam as SortParam)
      : undefined,
    note: normalizeNoteInput(noteParam),
    top: normalizeNoteInput(topParam),
    heart: normalizeNoteInput(heartParam),
    base: normalizeNoteInput(baseParam),
  };

  const andFilters: Prisma.PerfumeWhereInput[] = [];

  if (parsed.gender) {
    andFilters.push({ gender: genderMap[parsed.gender] });
  }

  if (parsed.price) {
    andFilters.push({ priceRange: priceMap[parsed.price] });
  }

  if (parsed.family) {
    andFilters.push({
      OR: familyKeywords[parsed.family].map((keyword) => ({
        fragranceFamily: {
          contains: keyword,
        },
      })),
    });
  }

  if (parsed.arabic !== undefined) {
    andFilters.push({ isArabic: parsed.arabic });
  }

  if (parsed.niche !== undefined) {
    andFilters.push({ isNiche: parsed.niche });
  }

  if (parsed.note) {
    const noteSearch = parsed.note.replace(/-/g, " ");
    const slugs = resolveNoteSlugs(parsed.note);

    andFilters.push({
      notes: {
        some: {
          note: {
            OR: [
              {
                slug: {
                  in: slugs,
                },
              },
              {
                slug: {
                  contains: parsed.note,
                },
              },
              {
                name: {
                  contains: noteSearch,
                },
              },
            ],
          },
        },
      },
    });
  }

  if (parsed.top) {
    andFilters.push(buildTypedNoteFilter(parsed.top, NoteType.TOP));
  }

  if (parsed.heart) {
    andFilters.push(buildTypedNoteFilter(parsed.heart, NoteType.HEART));
  }

  if (parsed.base) {
    andFilters.push(buildTypedNoteFilter(parsed.base, NoteType.BASE));
  }

  return {
    parsed,
    where: andFilters.length > 0 ? { AND: andFilters } : undefined,
  };
}

export function applySorting(
  query: Prisma.PerfumeFindManyArgs,
  sortParam?: SortParam,
): SortingResult {
  const defaultOrderBy: Prisma.PerfumeOrderByWithRelationInput[] = [
    { ratingInternal: "desc" },
    { name: "asc" },
  ];

  if (!sortParam) {
    return {
      query: {
        ...query,
        orderBy: defaultOrderBy,
      },
      postSort: undefined,
    };
  }

  if (sortParam === "price_low" || sortParam === "price_high") {
    return {
      query: {
        ...query,
        orderBy:
          sortParam === "price_low"
            ? [
                { hasAvailableOffer: "desc" },
                { bestTotalPriceAmount: "asc" },
                { ratingInternal: "desc" },
                { name: "asc" },
              ]
            : [
                { hasAvailableOffer: "desc" },
                { bestTotalPriceAmount: "desc" },
                { ratingInternal: "desc" },
                { name: "asc" },
              ],
      },
      postSort: undefined,
    };
  }

  if (sortParam === "longevity") {
    return {
      query: {
        ...query,
        orderBy: [{ longevityScore: "desc" }, { ratingInternal: "desc" }, { name: "asc" }],
      },
      postSort: undefined,
    };
  }

  if (sortParam === "sillage") {
    return {
      query: {
        ...query,
        orderBy: [{ sillageScore: "desc" }, { ratingInternal: "desc" }, { name: "asc" }],
      },
      postSort: undefined,
    };
  }

  return {
    query: {
      ...query,
      orderBy: defaultOrderBy,
    },
    postSort: undefined,
  };
}

import {
  Availability,
  Gender,
  NoteType,
  PriceRange,
  PrismaClient,
} from "@prisma/client";

import { bootstrapHomepageContent } from "../scripts/homepage/lib/bootstrap";

const prisma = new PrismaClient();

type PerfumeSeed = {
  brandSlug: string;
  name: string;
  slug: string;
  gender: Gender;
  descriptionShort: string;
  descriptionLong: string;
  fragranceFamily: string;
  priceRange: PriceRange;
  releaseYear?: number;
  isArabic: boolean;
  isNiche: boolean;
  imageUrl?: string;
  ratingInternal?: number;
  longevityScore?: number;
  sillageScore?: number;
  versatilityScore?: number;
  notes: Array<{ slug: string; intensity?: number }>;
  moods: Array<{ slug: string; weight?: number }>;
  seasons: Array<{ slug: string; weight?: number }>;
  occasions: Array<{ slug: string; weight?: number }>;
  offers: Array<{
    storeSlug: string;
    productUrl: string;
    affiliateUrl?: string;
    priceAmount: number;
    currency: string;
    shippingCost?: number;
    availability: Availability;
  }>;
};

const brands = [
  {
    name: "Lattafa",
    slug: "lattafa",
    country: "United Arab Emirates",
    description: "Popular Arabic house known for rich, affordable compositions.",
  },
  {
    name: "Dior",
    slug: "dior",
    country: "France",
    description: "Iconic designer brand with modern classics.",
  },
  {
    name: "Maison Francis Kurkdjian",
    slug: "maison-francis-kurkdjian",
    country: "France",
    description: "Luxury niche perfumery blending precision and opulence.",
  },
  {
    name: "Xerjoff",
    slug: "xerjoff",
    country: "Italy",
    description: "Italian niche house with bold storytelling fragrances.",
  },
  {
    name: "Chanel",
    slug: "chanel",
    country: "France",
    description: "Timeless designer fragrances spanning refined everyday wear.",
  },
  {
    name: "Diptyque",
    slug: "diptyque",
    country: "France",
    description: "Artful niche fragrances focused on texture and atmosphere.",
  },
];

const notes = [
  { name: "Bergamot", slug: "bergamot", noteType: NoteType.TOP },
  { name: "Lemon", slug: "lemon", noteType: NoteType.TOP },
  { name: "Apple", slug: "apple", noteType: NoteType.TOP },
  { name: "Saffron", slug: "saffron", noteType: NoteType.TOP },
  { name: "Pink Pepper", slug: "pink-pepper", noteType: NoteType.TOP },
  { name: "Cardamom", slug: "cardamom", noteType: NoteType.TOP },
  { name: "Fig Leaf", slug: "fig-leaf", noteType: NoteType.TOP },
  { name: "Ginger", slug: "ginger", noteType: NoteType.TOP },
  { name: "Mandarin", slug: "mandarin", noteType: NoteType.TOP },
  { name: "Nutmeg", slug: "nutmeg", noteType: NoteType.TOP },
  { name: "Lavender", slug: "lavender", noteType: NoteType.TOP },
  { name: "Grapefruit", slug: "grapefruit", noteType: NoteType.TOP },
  { name: "Rose", slug: "rose", noteType: NoteType.HEART },
  { name: "Jasmine", slug: "jasmine", noteType: NoteType.HEART },
  { name: "Orange Blossom", slug: "orange-blossom", noteType: NoteType.HEART },
  { name: "Cinnamon", slug: "cinnamon", noteType: NoteType.HEART },
  { name: "Patchouli", slug: "patchouli", noteType: NoteType.HEART },
  { name: "Iris", slug: "iris", noteType: NoteType.HEART },
  { name: "Cedar", slug: "cedar", noteType: NoteType.HEART },
  { name: "Fig", slug: "fig", noteType: NoteType.HEART },
  { name: "Tobacco", slug: "tobacco", noteType: NoteType.HEART },
  { name: "Lily of the Valley", slug: "lily-of-the-valley", noteType: NoteType.HEART },
  { name: "Vanilla", slug: "vanilla", noteType: NoteType.BASE },
  { name: "Amber", slug: "amber", noteType: NoteType.BASE },
  { name: "Oud", slug: "oud", noteType: NoteType.BASE },
  { name: "Musk", slug: "musk", noteType: NoteType.BASE },
  { name: "Tonka Bean", slug: "tonka-bean", noteType: NoteType.BASE },
  { name: "Sandalwood", slug: "sandalwood", noteType: NoteType.BASE },
  { name: "Benzoin", slug: "benzoin", noteType: NoteType.BASE },
  { name: "Praline", slug: "praline", noteType: NoteType.BASE },
  { name: "Vetiver", slug: "vetiver", noteType: NoteType.BASE },
  { name: "Incense", slug: "incense", noteType: NoteType.BASE },
  { name: "Oakmoss", slug: "oakmoss", noteType: NoteType.BASE },
];

const moods = [
  { name: "Elegant", slug: "elegant" },
  { name: "Bold", slug: "bold" },
  { name: "Cozy", slug: "cozy" },
  { name: "Fresh", slug: "fresh" },
  { name: "Romantic", slug: "romantic" },
  { name: "Confident", slug: "confident" },
];

const seasons = [
  { name: "Spring", slug: "spring" },
  { name: "Summer", slug: "summer" },
  { name: "Autumn", slug: "autumn" },
  { name: "Winter", slug: "winter" },
];

const occasions = [
  { name: "Office", slug: "office" },
  { name: "Date Night", slug: "date-night" },
  { name: "Evening", slug: "evening" },
  { name: "Daily Wear", slug: "daily-wear" },
  { name: "Special Event", slug: "special-event" },
  { name: "Weekend", slug: "weekend" },
];

const stores = [
  {
    name: "Notino Italia",
    slug: "notino-italia",
    websiteUrl: "https://www.notino.it",
    affiliateProgram: "Awin",
  },
  {
    name: "Sephora Italia",
    slug: "sephora-italia",
    websiteUrl: "https://www.sephora.it",
    affiliateProgram: "Impact",
  },
  {
    name: "Douglas Italia",
    slug: "douglas-italia",
    websiteUrl: "https://www.douglas.it",
    affiliateProgram: "Tradedoubler",
  },
];

const perfumes: PerfumeSeed[] = [
  {
    brandSlug: "lattafa",
    name: "Khamrah",
    slug: "lattafa-khamrah",
    gender: Gender.UNISEX,
    descriptionShort: "Warm spicy gourmand with cinnamon and vanilla.",
    descriptionLong:
      "Khamrah is a rich Arabic-inspired gourmand profile that opens spicy and settles into a sweet amber-vanilla base. It is popular for evening wear and colder seasons thanks to strong projection and long trail.",
    fragranceFamily: "Amber Gourmand",
    priceRange: PriceRange.BUDGET,
    releaseYear: 2022,
    isArabic: true,
    isNiche: false,
    ratingInternal: 4.4,
    longevityScore: 9,
    sillageScore: 8,
    versatilityScore: 6,
    notes: [
      { slug: "cardamom", intensity: 7 },
      { slug: "bergamot", intensity: 5 },
      { slug: "cinnamon", intensity: 8 },
      { slug: "orange-blossom", intensity: 6 },
      { slug: "vanilla", intensity: 9 },
      { slug: "praline", intensity: 8 },
      { slug: "amber", intensity: 8 },
    ],
    moods: [
      { slug: "cozy", weight: 9 },
      { slug: "bold", weight: 7 },
      { slug: "confident", weight: 7 },
    ],
    seasons: [
      { slug: "autumn", weight: 9 },
      { slug: "winter", weight: 10 },
      { slug: "spring", weight: 5 },
    ],
    occasions: [
      { slug: "evening", weight: 9 },
      { slug: "date-night", weight: 8 },
      { slug: "special-event", weight: 7 },
    ],
    offers: [
      {
        storeSlug: "notino-italia",
        productUrl: "https://www.notino.it/lattafa/khamrah-edp",
        affiliateUrl: "https://trk.odora.it/notino/lattafa-khamrah",
        priceAmount: 41.9,
        currency: "EUR",
        shippingCost: 4.9,
        availability: Availability.IN_STOCK,
      },
      {
        storeSlug: "sephora-italia",
        productUrl: "https://www.sephora.it/p/lattafa-khamrah-edp",
        affiliateUrl: "https://trk.odora.it/sephora/lattafa-khamrah",
        priceAmount: 46,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.LIMITED,
      },
      {
        storeSlug: "douglas-italia",
        productUrl: "https://www.douglas.it/it/p/lattafa-khamrah-edp",
        affiliateUrl: "https://trk.odora.it/douglas/lattafa-khamrah",
        priceAmount: 44.5,
        currency: "EUR",
        shippingCost: 3.5,
        availability: Availability.IN_STOCK,
      },
    ],
  },
  {
    brandSlug: "lattafa",
    name: "Bade'e Al Oud Oud for Glory",
    slug: "lattafa-badee-al-oud-for-glory",
    gender: Gender.UNISEX,
    descriptionShort: "Dense oud-amber accord with saffron spice.",
    descriptionLong:
      "Bade'e Al Oud brings an intense oud-and-amber structure with an assertive spicy opening. It delivers high performance and a statement profile favored by fans of darker oriental compositions.",
    fragranceFamily: "Amber Oud",
    priceRange: PriceRange.BUDGET,
    releaseYear: 2020,
    isArabic: true,
    isNiche: false,
    ratingInternal: 4.2,
    longevityScore: 9,
    sillageScore: 8,
    versatilityScore: 5,
    notes: [
      { slug: "saffron", intensity: 8 },
      { slug: "nutmeg", intensity: 6 },
      { slug: "lavender", intensity: 5 },
      { slug: "oud", intensity: 9 },
      { slug: "patchouli", intensity: 7 },
      { slug: "musk", intensity: 7 },
      { slug: "amber", intensity: 8 },
    ],
    moods: [
      { slug: "bold", weight: 9 },
      { slug: "confident", weight: 8 },
      { slug: "elegant", weight: 6 },
    ],
    seasons: [
      { slug: "winter", weight: 10 },
      { slug: "autumn", weight: 9 },
      { slug: "spring", weight: 4 },
    ],
    occasions: [
      { slug: "evening", weight: 9 },
      { slug: "special-event", weight: 8 },
      { slug: "date-night", weight: 7 },
    ],
    offers: [
      {
        storeSlug: "notino-italia",
        productUrl: "https://www.notino.it/lattafa/oud-for-glory-edp",
        affiliateUrl: "https://trk.odora.it/notino/oud-for-glory",
        priceAmount: 36.9,
        currency: "EUR",
        shippingCost: 4.9,
        availability: Availability.IN_STOCK,
      },
      {
        storeSlug: "sephora-italia",
        productUrl: "https://www.sephora.it/p/lattafa-oud-for-glory-edp",
        affiliateUrl: "https://trk.odora.it/sephora/oud-for-glory",
        priceAmount: 42,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.OUT_OF_STOCK,
      },
      {
        storeSlug: "douglas-italia",
        productUrl: "https://www.douglas.it/it/p/lattafa-oud-for-glory-edp",
        affiliateUrl: "https://trk.odora.it/douglas/oud-for-glory",
        priceAmount: 39.9,
        currency: "EUR",
        shippingCost: 3.5,
        availability: Availability.LIMITED,
      },
    ],
  },
  {
    brandSlug: "dior",
    name: "Sauvage Elixir",
    slug: "dior-sauvage-elixir",
    gender: Gender.MEN,
    descriptionShort: "Spicy aromatic concentration with dark woods.",
    descriptionLong:
      "Sauvage Elixir is a concentrated take on the Sauvage DNA, emphasizing spices, aromatic freshness, and a dense woody base. It is known for powerful performance and evening presence.",
    fragranceFamily: "Aromatic Spicy",
    priceRange: PriceRange.PREMIUM,
    releaseYear: 2021,
    isArabic: false,
    isNiche: false,
    ratingInternal: 4.5,
    longevityScore: 9,
    sillageScore: 8,
    versatilityScore: 6,
    notes: [
      { slug: "grapefruit", intensity: 6 },
      { slug: "nutmeg", intensity: 8 },
      { slug: "cardamom", intensity: 7 },
      { slug: "lavender", intensity: 7 },
      { slug: "cinnamon", intensity: 6 },
      { slug: "amber", intensity: 8 },
      { slug: "vetiver", intensity: 7 },
    ],
    moods: [
      { slug: "confident", weight: 9 },
      { slug: "bold", weight: 8 },
      { slug: "elegant", weight: 6 },
    ],
    seasons: [
      { slug: "autumn", weight: 8 },
      { slug: "winter", weight: 9 },
      { slug: "spring", weight: 6 },
    ],
    occasions: [
      { slug: "evening", weight: 8 },
      { slug: "special-event", weight: 8 },
      { slug: "date-night", weight: 7 },
    ],
    offers: [
      {
        storeSlug: "notino-italia",
        productUrl: "https://www.notino.it/dior/sauvage-elixir",
        affiliateUrl: "https://trk.odora.it/notino/sauvage-elixir",
        priceAmount: 129,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.IN_STOCK,
      },
      {
        storeSlug: "sephora-italia",
        productUrl: "https://www.sephora.it/p/dior-sauvage-elixir",
        affiliateUrl: "https://trk.odora.it/sephora/sauvage-elixir",
        priceAmount: 141,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.IN_STOCK,
      },
      {
        storeSlug: "douglas-italia",
        productUrl: "https://www.douglas.it/it/p/dior-sauvage-elixir",
        affiliateUrl: "https://trk.odora.it/douglas/sauvage-elixir",
        priceAmount: 136,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.LIMITED,
      },
    ],
  },
  {
    brandSlug: "dior",
    name: "J'adore L'Or",
    slug: "dior-jadore-lor",
    gender: Gender.WOMEN,
    descriptionShort: "Floral amber composition with golden warmth.",
    descriptionLong:
      "J'adore L'Or enriches the J'adore floral signature with fuller jasmine and orange blossom facets over a warm vanilla-sandalwood base. It balances elegance and sensuality for formal and evening settings.",
    fragranceFamily: "Floral Amber",
    priceRange: PriceRange.LUXURY,
    releaseYear: 2023,
    isArabic: false,
    isNiche: false,
    ratingInternal: 4.3,
    longevityScore: 8,
    sillageScore: 7,
    versatilityScore: 7,
    notes: [
      { slug: "mandarin", intensity: 5 },
      { slug: "jasmine", intensity: 9 },
      { slug: "orange-blossom", intensity: 8 },
      { slug: "rose", intensity: 7 },
      { slug: "vanilla", intensity: 7 },
      { slug: "sandalwood", intensity: 6 },
      { slug: "musk", intensity: 5 },
    ],
    moods: [
      { slug: "elegant", weight: 9 },
      { slug: "romantic", weight: 8 },
      { slug: "confident", weight: 7 },
    ],
    seasons: [
      { slug: "spring", weight: 7 },
      { slug: "autumn", weight: 8 },
      { slug: "winter", weight: 7 },
    ],
    occasions: [
      { slug: "special-event", weight: 9 },
      { slug: "date-night", weight: 8 },
      { slug: "evening", weight: 8 },
    ],
    offers: [
      {
        storeSlug: "notino-italia",
        productUrl: "https://www.notino.it/dior/jadore-lor",
        affiliateUrl: "https://trk.odora.it/notino/jadore-lor",
        priceAmount: 152,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.LIMITED,
      },
      {
        storeSlug: "sephora-italia",
        productUrl: "https://www.sephora.it/p/dior-jadore-l-or",
        affiliateUrl: "https://trk.odora.it/sephora/jadore-lor",
        priceAmount: 159,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.IN_STOCK,
      },
      {
        storeSlug: "douglas-italia",
        productUrl: "https://www.douglas.it/it/p/dior-jadore-l-or",
        affiliateUrl: "https://trk.odora.it/douglas/jadore-lor",
        priceAmount: 155,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.IN_STOCK,
      },
    ],
  },
  {
    brandSlug: "maison-francis-kurkdjian",
    name: "Oud Satin Mood",
    slug: "mfk-oud-satin-mood",
    gender: Gender.UNISEX,
    descriptionShort: "Silky rose-oud with ambered vanilla depth.",
    descriptionLong:
      "Oud Satin Mood pairs lush rose petals with smooth oud and benzoin for a luxurious, velvety effect. It feels opulent and enveloping, with a lingering trail ideal for statement evenings.",
    fragranceFamily: "Floral Oud",
    priceRange: PriceRange.LUXURY,
    releaseYear: 2015,
    isArabic: false,
    isNiche: true,
    ratingInternal: 4.7,
    longevityScore: 10,
    sillageScore: 9,
    versatilityScore: 6,
    notes: [
      { slug: "bergamot", intensity: 4 },
      { slug: "rose", intensity: 9 },
      { slug: "jasmine", intensity: 7 },
      { slug: "oud", intensity: 8 },
      { slug: "benzoin", intensity: 8 },
      { slug: "vanilla", intensity: 7 },
      { slug: "amber", intensity: 8 },
    ],
    moods: [
      { slug: "elegant", weight: 9 },
      { slug: "romantic", weight: 8 },
      { slug: "bold", weight: 7 },
    ],
    seasons: [
      { slug: "winter", weight: 9 },
      { slug: "autumn", weight: 9 },
      { slug: "spring", weight: 5 },
    ],
    occasions: [
      { slug: "special-event", weight: 10 },
      { slug: "evening", weight: 9 },
      { slug: "date-night", weight: 8 },
    ],
    offers: [
      {
        storeSlug: "notino-italia",
        productUrl: "https://www.notino.it/maison-francis-kurkdjian/oud-satin-mood",
        affiliateUrl: "https://trk.odora.it/notino/oud-satin-mood",
        priceAmount: 248,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.IN_STOCK,
      },
      {
        storeSlug: "sephora-italia",
        productUrl: "https://www.sephora.it/p/mfk-oud-satin-mood",
        affiliateUrl: "https://trk.odora.it/sephora/oud-satin-mood",
        priceAmount: 265,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.LIMITED,
      },
      {
        storeSlug: "douglas-italia",
        productUrl: "https://www.douglas.it/it/p/mfk-oud-satin-mood",
        affiliateUrl: "https://trk.odora.it/douglas/oud-satin-mood",
        priceAmount: 254,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.IN_STOCK,
      },
    ],
  },
  {
    brandSlug: "maison-francis-kurkdjian",
    name: "Baccarat Rouge 540",
    slug: "mfk-baccarat-rouge-540",
    gender: Gender.UNISEX,
    descriptionShort: "Amber woody signature with airy sweetness.",
    descriptionLong:
      "Baccarat Rouge 540 blends saffron brightness, airy amber woods, and musky sweetness into a modern iconic profile. It performs strongly while retaining a polished transparent feel.",
    fragranceFamily: "Amber Woody",
    priceRange: PriceRange.LUXURY,
    releaseYear: 2016,
    isArabic: false,
    isNiche: true,
    ratingInternal: 4.6,
    longevityScore: 9,
    sillageScore: 8,
    versatilityScore: 7,
    notes: [
      { slug: "saffron", intensity: 8 },
      { slug: "jasmine", intensity: 6 },
      { slug: "cedar", intensity: 7 },
      { slug: "amber", intensity: 8 },
      { slug: "musk", intensity: 7 },
      { slug: "oakmoss", intensity: 5 },
    ],
    moods: [
      { slug: "confident", weight: 8 },
      { slug: "elegant", weight: 8 },
      { slug: "romantic", weight: 7 },
    ],
    seasons: [
      { slug: "autumn", weight: 8 },
      { slug: "winter", weight: 8 },
      { slug: "spring", weight: 7 },
      { slug: "summer", weight: 5 },
    ],
    occasions: [
      { slug: "special-event", weight: 8 },
      { slug: "date-night", weight: 8 },
      { slug: "evening", weight: 7 },
    ],
    offers: [
      {
        storeSlug: "notino-italia",
        productUrl: "https://www.notino.it/maison-francis-kurkdjian/baccarat-rouge-540",
        affiliateUrl: "https://trk.odora.it/notino/baccarat-rouge-540",
        priceAmount: 239,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.IN_STOCK,
      },
      {
        storeSlug: "sephora-italia",
        productUrl: "https://www.sephora.it/p/mfk-baccarat-rouge-540",
        affiliateUrl: "https://trk.odora.it/sephora/baccarat-rouge-540",
        priceAmount: 249,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.IN_STOCK,
      },
      {
        storeSlug: "douglas-italia",
        productUrl: "https://www.douglas.it/it/p/mfk-baccarat-rouge-540",
        affiliateUrl: "https://trk.odora.it/douglas/baccarat-rouge-540",
        priceAmount: 245,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.LIMITED,
      },
    ],
  },
  {
    brandSlug: "xerjoff",
    name: "Naxos",
    slug: "xerjoff-naxos",
    gender: Gender.UNISEX,
    descriptionShort: "Honeyed tobacco aromatic with citrus sparkle.",
    descriptionLong:
      "Naxos opens with bright citrus and lavender, then transitions into honeyed tobacco and warm vanilla-tonka nuances. It is expressive and refined, working especially well in cooler weather.",
    fragranceFamily: "Aromatic Tobacco",
    priceRange: PriceRange.LUXURY,
    releaseYear: 2015,
    isArabic: false,
    isNiche: true,
    ratingInternal: 4.7,
    longevityScore: 9,
    sillageScore: 8,
    versatilityScore: 7,
    notes: [
      { slug: "bergamot", intensity: 6 },
      { slug: "lemon", intensity: 6 },
      { slug: "lavender", intensity: 7 },
      { slug: "cinnamon", intensity: 6 },
      { slug: "jasmine", intensity: 5 },
      { slug: "tobacco", intensity: 8 },
      { slug: "vanilla", intensity: 7 },
      { slug: "tonka-bean", intensity: 7 },
    ],
    moods: [
      { slug: "elegant", weight: 8 },
      { slug: "confident", weight: 8 },
      { slug: "cozy", weight: 7 },
    ],
    seasons: [
      { slug: "autumn", weight: 9 },
      { slug: "winter", weight: 8 },
      { slug: "spring", weight: 6 },
    ],
    occasions: [
      { slug: "date-night", weight: 9 },
      { slug: "special-event", weight: 8 },
      { slug: "evening", weight: 8 },
    ],
    offers: [
      {
        storeSlug: "notino-italia",
        productUrl: "https://www.notino.it/xerjoff/naxos",
        affiliateUrl: "https://trk.odora.it/notino/xerjoff-naxos",
        priceAmount: 188,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.IN_STOCK,
      },
      {
        storeSlug: "sephora-italia",
        productUrl: "https://www.sephora.it/p/xerjoff-naxos",
        affiliateUrl: "https://trk.odora.it/sephora/xerjoff-naxos",
        priceAmount: 199,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.LIMITED,
      },
      {
        storeSlug: "douglas-italia",
        productUrl: "https://www.douglas.it/it/p/xerjoff-naxos",
        affiliateUrl: "https://trk.odora.it/douglas/xerjoff-naxos",
        priceAmount: 194,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.IN_STOCK,
      },
    ],
  },
  {
    brandSlug: "xerjoff",
    name: "Erba Pura",
    slug: "xerjoff-erba-pura",
    gender: Gender.UNISEX,
    descriptionShort: "Bright fruity citrus over soft musky amber.",
    descriptionLong:
      "Erba Pura is an energetic fruity-citrus fragrance with a plush musky amber base. It has strong projection and a playful tone, making it popular for daytime and social settings.",
    fragranceFamily: "Fruity Musky",
    priceRange: PriceRange.PREMIUM,
    releaseYear: 2019,
    isArabic: false,
    isNiche: true,
    ratingInternal: 4.3,
    longevityScore: 8,
    sillageScore: 8,
    versatilityScore: 7,
    notes: [
      { slug: "bergamot", intensity: 7 },
      { slug: "lemon", intensity: 7 },
      { slug: "mandarin", intensity: 8 },
      { slug: "jasmine", intensity: 5 },
      { slug: "amber", intensity: 7 },
      { slug: "musk", intensity: 8 },
      { slug: "vanilla", intensity: 6 },
    ],
    moods: [
      { slug: "fresh", weight: 8 },
      { slug: "confident", weight: 7 },
      { slug: "romantic", weight: 6 },
    ],
    seasons: [
      { slug: "summer", weight: 8 },
      { slug: "spring", weight: 8 },
      { slug: "autumn", weight: 6 },
    ],
    occasions: [
      { slug: "daily-wear", weight: 8 },
      { slug: "weekend", weight: 8 },
      { slug: "date-night", weight: 6 },
    ],
    offers: [
      {
        storeSlug: "notino-italia",
        productUrl: "https://www.notino.it/xerjoff/erba-pura",
        affiliateUrl: "https://trk.odora.it/notino/xerjoff-erba-pura",
        priceAmount: 169,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.IN_STOCK,
      },
      {
        storeSlug: "sephora-italia",
        productUrl: "https://www.sephora.it/p/xerjoff-erba-pura",
        affiliateUrl: "https://trk.odora.it/sephora/xerjoff-erba-pura",
        priceAmount: 179,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.LIMITED,
      },
      {
        storeSlug: "douglas-italia",
        productUrl: "https://www.douglas.it/it/p/xerjoff-erba-pura",
        affiliateUrl: "https://trk.odora.it/douglas/xerjoff-erba-pura",
        priceAmount: 173,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.IN_STOCK,
      },
    ],
  },
  {
    brandSlug: "chanel",
    name: "Bleu de Chanel Eau de Parfum",
    slug: "chanel-bleu-de-chanel-edp",
    gender: Gender.MEN,
    descriptionShort: "Fresh woody aromatic with refined depth.",
    descriptionLong:
      "Bleu de Chanel EDP balances citrus freshness with aromatic woods and incense. It is versatile and polished, suitable for office settings while still elegant for evening transitions.",
    fragranceFamily: "Woody Aromatic",
    priceRange: PriceRange.PREMIUM,
    releaseYear: 2014,
    isArabic: false,
    isNiche: false,
    ratingInternal: 4.4,
    longevityScore: 7,
    sillageScore: 7,
    versatilityScore: 9,
    notes: [
      { slug: "grapefruit", intensity: 7 },
      { slug: "lemon", intensity: 6 },
      { slug: "ginger", intensity: 6 },
      { slug: "cedar", intensity: 7 },
      { slug: "jasmine", intensity: 4 },
      { slug: "sandalwood", intensity: 7 },
      { slug: "incense", intensity: 6 },
      { slug: "vetiver", intensity: 6 },
    ],
    moods: [
      { slug: "confident", weight: 8 },
      { slug: "fresh", weight: 7 },
      { slug: "elegant", weight: 7 },
    ],
    seasons: [
      { slug: "spring", weight: 8 },
      { slug: "autumn", weight: 8 },
      { slug: "summer", weight: 7 },
      { slug: "winter", weight: 6 },
    ],
    occasions: [
      { slug: "office", weight: 9 },
      { slug: "daily-wear", weight: 9 },
      { slug: "special-event", weight: 6 },
    ],
    offers: [
      {
        storeSlug: "notino-italia",
        productUrl: "https://www.notino.it/chanel/bleu-de-chanel-edp",
        affiliateUrl: "https://trk.odora.it/notino/bleu-de-chanel-edp",
        priceAmount: 112,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.IN_STOCK,
      },
      {
        storeSlug: "sephora-italia",
        productUrl: "https://www.sephora.it/p/chanel-bleu-de-chanel-edp",
        affiliateUrl: "https://trk.odora.it/sephora/bleu-de-chanel-edp",
        priceAmount: 118,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.IN_STOCK,
      },
      {
        storeSlug: "douglas-italia",
        productUrl: "https://www.douglas.it/it/p/chanel-bleu-de-chanel-edp",
        affiliateUrl: "https://trk.odora.it/douglas/bleu-de-chanel-edp",
        priceAmount: 115,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.LIMITED,
      },
    ],
  },
  {
    brandSlug: "chanel",
    name: "Coco Mademoiselle Eau de Parfum",
    slug: "chanel-coco-mademoiselle-edp",
    gender: Gender.WOMEN,
    descriptionShort: "Sparkling citrus floral with patchouli elegance.",
    descriptionLong:
      "Coco Mademoiselle EDP combines bright citrus with a chic rose-jasmine heart and a patchouli-vanilla base. It remains one of the most versatile luxury florals for day-to-night wear.",
    fragranceFamily: "Floral Chypre",
    priceRange: PriceRange.PREMIUM,
    releaseYear: 2001,
    isArabic: false,
    isNiche: false,
    ratingInternal: 4.5,
    longevityScore: 8,
    sillageScore: 7,
    versatilityScore: 9,
    notes: [
      { slug: "mandarin", intensity: 7 },
      { slug: "bergamot", intensity: 6 },
      { slug: "rose", intensity: 7 },
      { slug: "jasmine", intensity: 7 },
      { slug: "patchouli", intensity: 8 },
      { slug: "vanilla", intensity: 6 },
      { slug: "musk", intensity: 6 },
      { slug: "vetiver", intensity: 5 },
    ],
    moods: [
      { slug: "elegant", weight: 9 },
      { slug: "romantic", weight: 8 },
      { slug: "confident", weight: 8 },
    ],
    seasons: [
      { slug: "spring", weight: 8 },
      { slug: "autumn", weight: 8 },
      { slug: "summer", weight: 6 },
      { slug: "winter", weight: 6 },
    ],
    occasions: [
      { slug: "office", weight: 8 },
      { slug: "daily-wear", weight: 8 },
      { slug: "date-night", weight: 7 },
    ],
    offers: [
      {
        storeSlug: "notino-italia",
        productUrl: "https://www.notino.it/chanel/coco-mademoiselle-edp",
        affiliateUrl: "https://trk.odora.it/notino/coco-mademoiselle-edp",
        priceAmount: 109,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.IN_STOCK,
      },
      {
        storeSlug: "sephora-italia",
        productUrl: "https://www.sephora.it/p/chanel-coco-mademoiselle-edp",
        affiliateUrl: "https://trk.odora.it/sephora/coco-mademoiselle-edp",
        priceAmount: 115,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.IN_STOCK,
      },
      {
        storeSlug: "douglas-italia",
        productUrl: "https://www.douglas.it/it/p/chanel-coco-mademoiselle-edp",
        affiliateUrl: "https://trk.odora.it/douglas/coco-mademoiselle-edp",
        priceAmount: 112,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.LIMITED,
      },
    ],
  },
  {
    brandSlug: "diptyque",
    name: "Philosykos Eau de Toilette",
    slug: "diptyque-philosykos-edt",
    gender: Gender.UNISEX,
    descriptionShort: "Green fig and creamy woods in a natural style.",
    descriptionLong:
      "Philosykos captures the full fig tree experience from green leaves to milky wood. The composition feels airy, artistic, and quietly distinctive, excellent for spring and summer wear.",
    fragranceFamily: "Green Woody",
    priceRange: PriceRange.PREMIUM,
    releaseYear: 1996,
    isArabic: false,
    isNiche: true,
    ratingInternal: 4.4,
    longevityScore: 6,
    sillageScore: 5,
    versatilityScore: 8,
    notes: [
      { slug: "fig-leaf", intensity: 9 },
      { slug: "bergamot", intensity: 5 },
      { slug: "fig", intensity: 8 },
      { slug: "cedar", intensity: 6 },
      { slug: "sandalwood", intensity: 6 },
      { slug: "musk", intensity: 4 },
    ],
    moods: [
      { slug: "fresh", weight: 9 },
      { slug: "elegant", weight: 7 },
      { slug: "cozy", weight: 5 },
    ],
    seasons: [
      { slug: "spring", weight: 9 },
      { slug: "summer", weight: 9 },
      { slug: "autumn", weight: 6 },
    ],
    occasions: [
      { slug: "daily-wear", weight: 8 },
      { slug: "office", weight: 7 },
      { slug: "weekend", weight: 8 },
    ],
    offers: [
      {
        storeSlug: "notino-italia",
        productUrl: "https://www.notino.it/diptyque/philosykos-edt",
        affiliateUrl: "https://trk.odora.it/notino/philosykos-edt",
        priceAmount: 132,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.IN_STOCK,
      },
      {
        storeSlug: "sephora-italia",
        productUrl: "https://www.sephora.it/p/diptyque-philosykos-edt",
        affiliateUrl: "https://trk.odora.it/sephora/philosykos-edt",
        priceAmount: 139,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.LIMITED,
      },
      {
        storeSlug: "douglas-italia",
        productUrl: "https://www.douglas.it/it/p/diptyque-philosykos-edt",
        affiliateUrl: "https://trk.odora.it/douglas/philosykos-edt",
        priceAmount: 135,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.IN_STOCK,
      },
    ],
  },
  {
    brandSlug: "diptyque",
    name: "Eau Duelle Eau de Parfum",
    slug: "diptyque-eau-duelle-edp",
    gender: Gender.UNISEX,
    descriptionShort: "Dry spicy vanilla with resinous depth.",
    descriptionLong:
      "Eau Duelle EDP explores vanilla in a less sweet direction by pairing spices, incense, and woods. The result is refined and introspective, ideal for cool evenings and minimal style lovers.",
    fragranceFamily: "Spicy Vanilla",
    priceRange: PriceRange.PREMIUM,
    releaseYear: 2013,
    isArabic: false,
    isNiche: true,
    ratingInternal: 4.3,
    longevityScore: 7,
    sillageScore: 6,
    versatilityScore: 7,
    notes: [
      { slug: "cardamom", intensity: 7 },
      { slug: "bergamot", intensity: 5 },
      { slug: "iris", intensity: 5 },
      { slug: "incense", intensity: 7 },
      { slug: "vanilla", intensity: 8 },
      { slug: "benzoin", intensity: 7 },
      { slug: "sandalwood", intensity: 6 },
    ],
    moods: [
      { slug: "cozy", weight: 8 },
      { slug: "elegant", weight: 7 },
      { slug: "romantic", weight: 6 },
    ],
    seasons: [
      { slug: "autumn", weight: 8 },
      { slug: "winter", weight: 8 },
      { slug: "spring", weight: 5 },
    ],
    occasions: [
      { slug: "evening", weight: 7 },
      { slug: "date-night", weight: 7 },
      { slug: "weekend", weight: 6 },
    ],
    offers: [
      {
        storeSlug: "notino-italia",
        productUrl: "https://www.notino.it/diptyque/eau-duelle-edp",
        affiliateUrl: "https://trk.odora.it/notino/eau-duelle-edp",
        priceAmount: 145,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.IN_STOCK,
      },
      {
        storeSlug: "sephora-italia",
        productUrl: "https://www.sephora.it/p/diptyque-eau-duelle-edp",
        affiliateUrl: "https://trk.odora.it/sephora/eau-duelle-edp",
        priceAmount: 151,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.LIMITED,
      },
      {
        storeSlug: "douglas-italia",
        productUrl: "https://www.douglas.it/it/p/diptyque-eau-duelle-edp",
        affiliateUrl: "https://trk.odora.it/douglas/eau-duelle-edp",
        priceAmount: 148,
        currency: "EUR",
        shippingCost: 0,
        availability: Availability.IN_STOCK,
      },
    ],
  },
];

async function main() {
  await prisma.offer.deleteMany();
  await prisma.perfumeHomepagePlacement.deleteMany();
  await prisma.homepageCollection.deleteMany();
  await prisma.perfumeOccasion.deleteMany();
  await prisma.perfumeSeason.deleteMany();
  await prisma.perfumeMood.deleteMany();
  await prisma.perfumeNote.deleteMany();
  await prisma.perfume.deleteMany();
  await prisma.store.deleteMany();
  await prisma.occasion.deleteMany();
  await prisma.season.deleteMany();
  await prisma.mood.deleteMany();
  await prisma.note.deleteMany();
  await prisma.brand.deleteMany();

  await prisma.brand.createMany({ data: brands });
  await prisma.note.createMany({ data: notes });
  await prisma.mood.createMany({ data: moods });
  await prisma.season.createMany({ data: seasons });
  await prisma.occasion.createMany({ data: occasions });
  await prisma.store.createMany({ data: stores });

  const [brandRows, noteRows, moodRows, seasonRows, occasionRows, storeRows] =
    await Promise.all([
      prisma.brand.findMany(),
      prisma.note.findMany(),
      prisma.mood.findMany(),
      prisma.season.findMany(),
      prisma.occasion.findMany(),
      prisma.store.findMany(),
    ]);

  const brandBySlug = new Map(brandRows.map((row) => [row.slug, row]));
  const noteBySlug = new Map(noteRows.map((row) => [row.slug, row]));
  const moodBySlug = new Map(moodRows.map((row) => [row.slug, row]));
  const seasonBySlug = new Map(seasonRows.map((row) => [row.slug, row]));
  const occasionBySlug = new Map(occasionRows.map((row) => [row.slug, row]));
  const storeBySlug = new Map(storeRows.map((row) => [row.slug, row]));

  const lastCheckedAt = new Date();

  for (const perfume of perfumes) {
    const brand = brandBySlug.get(perfume.brandSlug);

    if (!brand) {
      throw new Error(`Missing brand: ${perfume.brandSlug}`);
    }

    const bestPrice = Math.min(...perfume.offers.map((offer) => offer.priceAmount));

    await prisma.perfume.create({
      data: {
        brandId: brand.id,
        name: perfume.name,
        slug: perfume.slug,
        gender: perfume.gender,
        descriptionShort: perfume.descriptionShort,
        descriptionLong: perfume.descriptionLong,
        fragranceFamily: perfume.fragranceFamily,
        priceRange: perfume.priceRange,
        releaseYear: perfume.releaseYear,
        isArabic: perfume.isArabic,
        isNiche: perfume.isNiche,
        imageUrl: perfume.imageUrl,
        ratingInternal: perfume.ratingInternal,
        longevityScore: perfume.longevityScore,
        sillageScore: perfume.sillageScore,
        versatilityScore: perfume.versatilityScore,
        notes: {
          create: perfume.notes.map((note) => {
            const noteRow = noteBySlug.get(note.slug);

            if (!noteRow) {
              throw new Error(`Missing note: ${note.slug}`);
            }

            return {
              noteId: noteRow.id,
              intensity: note.intensity,
            };
          }),
        },
        moods: {
          create: perfume.moods.map((mood) => {
            const moodRow = moodBySlug.get(mood.slug);

            if (!moodRow) {
              throw new Error(`Missing mood: ${mood.slug}`);
            }

            return {
              moodId: moodRow.id,
              weight: mood.weight,
            };
          }),
        },
        seasons: {
          create: perfume.seasons.map((season) => {
            const seasonRow = seasonBySlug.get(season.slug);

            if (!seasonRow) {
              throw new Error(`Missing season: ${season.slug}`);
            }

            return {
              seasonId: seasonRow.id,
              weight: season.weight,
            };
          }),
        },
        occasions: {
          create: perfume.occasions.map((occasion) => {
            const occasionRow = occasionBySlug.get(occasion.slug);

            if (!occasionRow) {
              throw new Error(`Missing occasion: ${occasion.slug}`);
            }

            return {
              occasionId: occasionRow.id,
              weight: occasion.weight,
            };
          }),
        },
        offers: {
          create: perfume.offers.map((offer) => {
            const store = storeBySlug.get(offer.storeSlug);

            if (!store) {
              throw new Error(`Missing store: ${offer.storeSlug}`);
            }

            return {
              storeId: store.id,
              productUrl: offer.productUrl,
              affiliateUrl: offer.affiliateUrl,
              priceAmount: offer.priceAmount,
              currency: offer.currency,
              shippingCost: offer.shippingCost,
              availability: offer.availability,
              lastCheckedAt,
              isBestPrice: offer.priceAmount === bestPrice,
            };
          }),
        },
      },
    });
  }

  await bootstrapHomepageContent(prisma, {
    logger: console,
    resetExisting: false,
  });

  console.info(`Seed completed with ${brands.length} brands and ${perfumes.length} perfumes.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export type QuickFilterIllustration =
  | "vanilla"
  | "fresh"
  | "oud"
  | "musk"
  | "rose"
  | "citrus";

export type QuickFilterPreset = {
  preset: string;
  mood?: string;
  season?: string;
  occasion?: string;
  preferredNote?: string;
  arabicOnly?: "true";
  nicheOnly?: "true";
};

export type DiscoveryCollection = {
  title: string;
  description: string;
  href: string;
};

export const quickFilters = [
  {
    label: "Vanilla Lovers",
    tone: "Warm",
    subtitle: "Softly sweet gourmands with creamy depth and an elegant trail.",
    gradientClass: "from-[#f7eddc] via-[#f2e7d4] to-[#eadcc7]",
    illustration: "vanilla" as const,
    preset: {
      preset: "Vanilla Lovers",
      mood: "cozy",
      preferredNote: "vanilla",
    } satisfies QuickFilterPreset,
  },
  {
    label: "Fresh Daily",
    tone: "Clean",
    subtitle: "Crisp citrus, airy musks, and watery brightness for everyday wear.",
    gradientClass: "from-[#edf6f2] via-[#e2f1ee] to-[#d7ece8]",
    illustration: "fresh" as const,
    preset: {
      preset: "Fresh Daily",
      mood: "fresh",
      occasion: "daily-wear",
      preferredNote: "bergamot",
    } satisfies QuickFilterPreset,
  },
  {
    label: "Arabic Signature",
    tone: "Bold",
    subtitle: "Rich woods, resins, and statement trails with luxurious presence.",
    gradientClass: "from-[#efe5d9] via-[#ead8c6] to-[#dfc5ac]",
    illustration: "oud" as const,
    preset: {
      preset: "Arabic Signature",
      mood: "bold",
      preferredNote: "oud",
      arabicOnly: "true",
    } satisfies QuickFilterPreset,
  },
  {
    label: "Office Safe",
    tone: "Balanced",
    subtitle: "Polished musks and discreet florals that stay refined all day.",
    gradientClass: "from-[#f5f1ea] via-[#efe9df] to-[#e7dfd4]",
    illustration: "musk" as const,
    preset: {
      preset: "Office Safe",
      mood: "elegant",
      occasion: "office",
      preferredNote: "musk",
    } satisfies QuickFilterPreset,
  },
  {
    label: "Date Night",
    tone: "Magnetic",
    subtitle: "Velvet rose, amber, and darker textures with intimate warmth.",
    gradientClass: "from-[#efe3e0] via-[#ead8d6] to-[#ddc3c0]",
    illustration: "rose" as const,
    preset: {
      preset: "Date Night",
      mood: "romantic",
      occasion: "date-night",
      preferredNote: "amber",
    } satisfies QuickFilterPreset,
  },
  {
    label: "Summer Citrus",
    tone: "Bright",
    subtitle: "Sunlit lemon and orange accents cut with sparkling freshness.",
    gradientClass: "from-[#f7efdc] via-[#f4e4b8] to-[#edd49a]",
    illustration: "citrus" as const,
    preset: {
      preset: "Summer Citrus",
      mood: "fresh",
      season: "summer",
      preferredNote: "bergamot",
    } satisfies QuickFilterPreset,
  },
];

export const discoveryCollections: DiscoveryCollection[] = [
  {
    title: "Vanilla Signatures",
    description: "Real catalog picks built around creamy bases, amber warmth, and long-lasting comfort.",
    href: "/perfumes?base=vanilla&sort=rating",
  },
  {
    title: "Oud & Arabic Profiles",
    description: "Compare darker woody styles with real store offers and URL-driven filtering.",
    href: "/perfumes?arabic=true&base=oud&sort=rating",
  },
  {
    title: "Fresh Everyday",
    description: "A lighter route into crisp, wearable fragrances for daily discovery.",
    href: "/perfumes?family=fresh&note=bergamot&sort=rating",
  },
];

export const topCollections = [
  {
    title: "Top Arabic Perfumes",
    description: "Deep amber and oud signatures with long-lasting performance.",
    href: "/perfumes",
  },
  {
    title: "Top Summer Fragrances",
    description: "Citrus, neroli, and aromatic woods for warm weather.",
    href: "/perfumes",
  },
  {
    title: "Best Vanilla Perfumes",
    description: "From creamy gourmand blends to dry, elegant vanilla.",
    href: "/perfumes",
  },
  {
    title: "Best Compliment Getters",
    description: "Popular crowd-pleasers with projection and personality.",
    href: "/perfumes",
  },
];

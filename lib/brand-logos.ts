const CURATED_BRAND_LOGOS: Record<string, string> = {
  casamorati: "/images/brand-logos/xerjoff.png",
  chanel: "/images/brand-logos/chanel.png",
  dior: "/images/brand-logos/dior.png",
  guerlain: "/images/brand-logos/guerlain.png",
  hermes: "/images/brand-logos/hermes.png",
  prada: "/images/brand-logos/prada.png",
  tomford: "/images/brand-logos/tom-ford.png",
  xerjoff: "/images/brand-logos/xerjoff.png",
};

const BRAND_LOGO_ALIASES: Record<string, string> = {
  christiandior: "dior",
  hermesparis: "hermes",
  tomfordbeauty: "tomford",
  xerjoffcasamorati: "casamorati",
};

function normalizeBrandLogoKey(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const key = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");

  return BRAND_LOGO_ALIASES[key] ?? key;
}

export function getCuratedBrandLogoUrl(brandName: string | null | undefined, brandSlug?: string | null) {
  const keys = [normalizeBrandLogoKey(brandName), normalizeBrandLogoKey(brandSlug)];

  for (const key of keys) {
    if (key && CURATED_BRAND_LOGOS[key]) {
      return CURATED_BRAND_LOGOS[key];
    }
  }

  return null;
}

export function resolveBrandLogoUrl(
  logoUrl: string | null | undefined,
  brandName: string | null | undefined,
  brandSlug?: string | null,
) {
  const cleanLogoUrl = logoUrl?.trim();
  return cleanLogoUrl || getCuratedBrandLogoUrl(brandName, brandSlug);
}

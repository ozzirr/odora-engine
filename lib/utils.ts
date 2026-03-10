import { defaultLocale, type AppLocale } from "@/lib/i18n";

export function cn(...classes: Array<string | null | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

const genderLabels: Record<AppLocale, Record<string, string>> = {
  en: {
    MEN: "Men",
    WOMEN: "Women",
    UNISEX: "Unisex",
  },
  it: {
    MEN: "Uomo",
    WOMEN: "Donna",
    UNISEX: "Unisex",
  },
};

const priceRangeLabels: Record<AppLocale, Record<string, string>> = {
  en: {
    BUDGET: "Budget",
    MID: "Mid",
    PREMIUM: "Premium",
    LUXURY: "Luxury",
  },
  it: {
    BUDGET: "Budget",
    MID: "Medio",
    PREMIUM: "Premium",
    LUXURY: "Lusso",
  },
};

export function formatGender(gender: string, locale: AppLocale = defaultLocale) {
  return genderLabels[locale][gender] ?? gender;
}

export function formatPriceRange(priceRange: string, locale: AppLocale = defaultLocale) {
  return priceRangeLabels[locale][priceRange] ?? priceRange;
}

export function formatCurrency(
  amount: number,
  currency: string,
  locale: AppLocale = defaultLocale,
) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const safeCurrency = /^[A-Z]{3}$/.test(currency) ? currency : "EUR";
  const localeTag = locale === "it" ? "it-IT" : "en-US";

  try {
    return new Intl.NumberFormat(localeTag, {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    return `€${safeAmount.toFixed(2)}`;
  }
}

export function formatNoteType(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

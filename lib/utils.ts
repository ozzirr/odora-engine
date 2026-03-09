export function cn(...classes: Array<string | null | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

const genderLabels: Record<string, string> = {
  MEN: "Men",
  WOMEN: "Women",
  UNISEX: "Unisex",
};

const priceRangeLabels: Record<string, string> = {
  BUDGET: "Budget",
  MID: "Mid",
  PREMIUM: "Premium",
  LUXURY: "Luxury",
};

export function formatGender(gender: string) {
  return genderLabels[gender] ?? gender;
}

export function formatPriceRange(priceRange: string) {
  return priceRangeLabels[priceRange] ?? priceRange;
}

export function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNoteType(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

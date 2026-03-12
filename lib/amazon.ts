import { defaultLocale, type AppLocale } from "@/lib/i18n";

type AmazonTargetInput = {
  amazonUrl?: string | null;
  brandName?: string | null;
  perfumeName: string;
  locale?: AppLocale;
};

function getAmazonDomain(locale: AppLocale) {
  return locale === "it" ? "www.amazon.it" : "www.amazon.com";
}

function getValidatedAmazonUrl(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    if (!parsed.hostname.includes("amazon.")) {
      return null;
    }

    return normalized;
  } catch {
    return null;
  }
}

export function getAmazonProductUrl({
  amazonUrl,
  brandName,
  perfumeName,
  locale = defaultLocale,
}: AmazonTargetInput) {
  const directUrl = getValidatedAmazonUrl(amazonUrl);
  if (directUrl) {
    return directUrl;
  }

  const query = [brandName?.trim(), perfumeName.trim(), locale === "it" ? "profumo" : "perfume"]
    .filter(Boolean)
    .join(" ");

  return `https://${getAmazonDomain(locale)}/s?k=${encodeURIComponent(query)}`;
}

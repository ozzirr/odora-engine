import { defaultLocale, type AppLocale } from "@/lib/i18n";

const AFFILIATE_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG ?? "2erre-21";
const ALLOWED_AMAZON_HOSTS = new Set(["amazon.it", "www.amazon.it", "amazon.com", "www.amazon.com"]);

type AmazonTargetInput = {
  amazonUrl?: string | null;
  brandName?: string | null;
  perfumeName: string;
  locale?: AppLocale;
  perfumeSlug?: string | null;
};

function getAmazonDomain(locale: AppLocale) {
  return locale === "it" ? "www.amazon.it" : "www.amazon.com";
}

function appendAffiliateTag(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("tag", AFFILIATE_TAG);
    return parsed.toString();
  } catch {
    return url;
  }
}

export function isAllowedAmazonHostname(hostname: string) {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return (
    ALLOWED_AMAZON_HOSTS.has(normalized) ||
    normalized.endsWith(".amazon.it") ||
    normalized.endsWith(".amazon.com")
  );
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

    if (!isAllowedAmazonHostname(parsed.hostname)) {
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
  perfumeSlug,
}: AmazonTargetInput) {
  const directUrl = getValidatedAmazonUrl(amazonUrl);

  const finalUrl = directUrl
    ? appendAffiliateTag(directUrl)
    : appendAffiliateTag(
        `https://${getAmazonDomain(locale)}/s?k=${encodeURIComponent(
          [brandName?.trim(), perfumeName.trim(), locale === "it" ? "profumo" : "perfume"]
            .filter(Boolean)
            .join(" "),
        )}`,
      );

  if (!perfumeSlug) {
    return finalUrl;
  }

  const params = new URLSearchParams({ url: finalUrl, slug: perfumeSlug, type: "amazon", locale });
  return `/api/track?${params.toString()}`;
}

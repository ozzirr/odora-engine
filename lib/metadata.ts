import type { Metadata } from "next";

import {
  getAlternateLinks,
  type AppPathname,
} from "@/lib/i18n";
import { getBaseSiteUrl } from "@/lib/site-url";

type QueryValue = string | number | boolean | null | undefined;

type BuildPageMetadataParams = {
  title: string;
  description?: string;
  locale: string;
  pathname: AppPathname;
  params?: Record<string, string>;
  query?: URLSearchParams | Record<string, QueryValue>;
  image?: string | null;
  robots?: Metadata["robots"];
  type?: "website" | "article";
};

const siteName = "Odora";
const localeToOpenGraphLocale = {
  en: "en_US",
  it: "it_IT",
} as const;

export function toAbsoluteUrl(pathname: string) {
  return new URL(pathname, getBaseSiteUrl()).toString();
}

export function resolveSocialImageUrl(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return toAbsoluteUrl("/opengraph-image");
  }

  if (trimmed.startsWith("/")) {
    return toAbsoluteUrl(trimmed);
  }

  try {
    const url = new URL(trimmed);

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {}

  return toAbsoluteUrl("/opengraph-image");
}

export function buildPageMetadata({
  title,
  description,
  locale,
  pathname,
  params,
  query,
  image,
  robots,
  type = "website",
}: BuildPageMetadataParams): Metadata {
  const resolvedLocale = locale === "it" ? "it" : "en";
  const alternateLinks = getAlternateLinks(pathname, params, query);
  const canonicalPath = alternateLinks[resolvedLocale];
  const canonicalUrl = toAbsoluteUrl(canonicalPath);
  const socialImageUrl = resolveSocialImageUrl(image);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: alternateLinks,
    },
    openGraph: {
      type,
      url: canonicalUrl,
      title,
      description,
      siteName,
      locale: localeToOpenGraphLocale[resolvedLocale],
      images: [
        {
          url: socialImageUrl,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImageUrl],
    },
    robots,
  };
}

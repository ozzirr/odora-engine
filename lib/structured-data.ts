import type { AppLocale } from "@/lib/i18n";
import { resolveSocialImageUrl, toAbsoluteUrl } from "@/lib/metadata";

type BreadcrumbSchemaItem = {
  name: string;
  path: string;
};

type ItemListEntry = {
  name: string;
  path: string;
};

type CollectionPageSchemaParams = {
  name: string;
  description: string;
  path: string;
  locale: AppLocale;
};

type ItemListSchemaParams = {
  name: string;
  path: string;
  items: ItemListEntry[];
};

type ProductSchemaParams = {
  name: string;
  description: string;
  path: string;
  image?: string | null;
  brandName: string;
  category?: string | null;
  currency?: string | null;
  price?: number | null;
  offerUrl?: string | null;
  editorialReview?: {
    ratingValue: number;
    bestRating?: number;
    worstRating?: number;
    reviewBody?: string;
  } | null;
};

type FaqEntry = {
  question: string;
  answer: string;
};

type ArticleSchemaParams = {
  headline: string;
  description: string;
  path: string;
  locale: AppLocale;
  datePublished: Date | string;
  dateModified?: Date | string | null;
  image?: string | null;
  authorName?: string;
  keywords?: string[];
};

function withContext<T extends Record<string, unknown>>(schema: T) {
  return {
    "@context": "https://schema.org",
    ...schema,
  };
}

type BrandSchemaParams = {
  name: string;
  path: string;
  description?: string | null;
  logoUrl?: string | null;
  country?: string | null;
};

export function buildBrandSchema({ name, path, description, logoUrl, country }: BrandSchemaParams) {
  return withContext({
    "@type": "Brand",
    name,
    url: toAbsoluteUrl(path),
    ...(description ? { description } : {}),
    ...(logoUrl ? { logo: resolveSocialImageUrl(logoUrl) } : {}),
    ...(country ? { areaServed: country } : {}),
  });
}

export function buildOrganizationSchema() {
  return withContext({
    "@type": "Organization",
    name: "Odora",
    url: toAbsoluteUrl("/"),
    logo: toAbsoluteUrl("/images/odora_logo_m.png"),
  });
}

export function buildWebsiteSchema(locale: AppLocale) {
  return withContext({
    "@type": "WebSite",
    name: "Odora",
    url: toAbsoluteUrl(`/${locale}`),
    inLanguage: locale,
  });
}

export function buildBreadcrumbSchema(items: BreadcrumbSchemaItem[]) {
  return withContext({
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  });
}

export function buildCollectionPageSchema({
  name,
  description,
  path,
  locale,
}: CollectionPageSchemaParams) {
  return withContext({
    "@type": "CollectionPage",
    name,
    description,
    url: toAbsoluteUrl(path),
    inLanguage: locale,
    isPartOf: {
      "@type": "WebSite",
      name: "Odora",
      url: toAbsoluteUrl(`/${locale}`),
    },
  });
}

export function buildItemListSchema({ name, path, items }: ItemListSchemaParams) {
  return withContext({
    "@type": "ItemList",
    name,
    url: toAbsoluteUrl(path),
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  });
}

export function buildProductSchema({
  name,
  description,
  path,
  image,
  brandName,
  category,
  currency,
  price,
  offerUrl,
  editorialReview,
}: ProductSchemaParams) {
  const offerPath = offerUrl?.startsWith("/") ? toAbsoluteUrl(offerUrl) : offerUrl ?? toAbsoluteUrl(path);

  return withContext({
    "@type": "Product",
    name,
    description,
    url: toAbsoluteUrl(path),
    image: [resolveSocialImageUrl(image)],
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    ...(category ? { category } : {}),
    ...(currency && typeof price === "number"
        ? {
          offers: {
            "@type": "Offer",
            priceCurrency: currency,
            price,
            url: offerPath,
            itemCondition: "https://schema.org/NewCondition",
          },
        }
      : {}),
    ...(editorialReview
      ? {
          review: {
            "@type": "Review",
            author: {
              "@type": "Organization",
              name: "Odora",
              url: toAbsoluteUrl("/"),
            },
            reviewRating: {
              "@type": "Rating",
              ratingValue: Number(editorialReview.ratingValue.toFixed(1)),
              bestRating: editorialReview.bestRating ?? 5,
              worstRating: editorialReview.worstRating ?? 1,
            },
            ...(editorialReview.reviewBody ? { reviewBody: editorialReview.reviewBody } : {}),
          },
        }
      : {}),
  });
}

export function buildFaqSchema(entries: FaqEntry[]) {
  return withContext({
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  });
}

export function buildArticleSchema({
  headline,
  description,
  path,
  locale,
  datePublished,
  dateModified,
  image,
  authorName = "Odora",
  keywords,
}: ArticleSchemaParams) {
  const url = toAbsoluteUrl(path);
  const inLanguage = locale === "it" ? "it-IT" : "en-GB";
  const published = new Date(datePublished).toISOString();
  const modified = new Date(dateModified ?? datePublished).toISOString();

  return withContext({
    "@type": "BlogPosting",
    headline,
    description,
    datePublished: published,
    dateModified: modified,
    inLanguage,
    author: {
      "@type": "Organization",
      name: authorName,
      url: toAbsoluteUrl("/"),
    },
    publisher: {
      "@type": "Organization",
      name: "Odora",
      url: toAbsoluteUrl("/"),
      logo: {
        "@type": "ImageObject",
        url: toAbsoluteUrl("/images/odora_logo_m.png"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    url,
    image: [resolveSocialImageUrl(image)],
    ...(keywords && keywords.length > 0 ? { keywords: keywords.join(", ") } : {}),
  });
}

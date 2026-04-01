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
  availability?: string | null;
  offerUrl?: string | null;
};

function withContext<T extends Record<string, unknown>>(schema: T) {
  return {
    "@context": "https://schema.org",
    ...schema,
  };
}

function toSchemaAvailability(value?: string | null) {
  if (value === "OUT_OF_STOCK") {
    return "https://schema.org/OutOfStock";
  }

  if (value === "PREORDER") {
    return "https://schema.org/PreOrder";
  }

  if (value === "LIMITED") {
    return "https://schema.org/LimitedAvailability";
  }

  return "https://schema.org/InStock";
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
  availability,
  offerUrl,
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
            availability: toSchemaAvailability(availability),
            url: offerPath,
            itemCondition: "https://schema.org/NewCondition",
          },
        }
      : {}),
  });
}

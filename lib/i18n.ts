import { defineRouting } from "next-intl/routing";

export const locales = ["it", "en"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";
export const localeCookieName = "NEXT_LOCALE";

export const pathnames = {
  "/": "/",
  "/perfumes": {
    en: "/perfumes",
    it: "/profumi",
  },
  "/perfumes/[slug]": {
    en: "/perfumes/[slug]",
    it: "/profumi/[slug]",
  },
  "/finder": {
    en: "/finder",
    it: "/trova-profumo",
  },
  "/top": {
    en: "/top",
    it: "/classifiche",
  },
  "/privacy": {
    en: "/privacy",
    it: "/privacy",
  },
  "/terms": {
    en: "/terms",
    it: "/termini",
  },
  "/affiliate-disclosure": {
    en: "/affiliate-disclosure",
    it: "/trasparenza-affiliazione",
  },
  "/login": {
    en: "/login",
    it: "/accedi",
  },
  "/signup": {
    en: "/signup",
    it: "/registrati",
  },
  "/profile": {
    en: "/profile",
    it: "/profilo",
  },
} as const;

export type AppPathname = keyof typeof pathnames;

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeCookie: {
    name: localeCookieName,
  },
  pathnames,
});

export function hasLocale(value: string): value is AppLocale {
  return locales.includes(value as AppLocale);
}

export function getLocaleFromAcceptLanguage(value: string | null | undefined): AppLocale {
  const preferredLanguage = value?.split(",")[0]?.trim().toLowerCase() ?? "";
  return preferredLanguage.startsWith("it") ? "it" : "en";
}

function localizeTemplate(locale: AppLocale, pathname: AppPathname) {
  const localizedPath = pathnames[pathname];
  return String(typeof localizedPath === "string" ? localizedPath : localizedPath[locale]);
}

export function getLocalizedPathname(
  locale: AppLocale,
  pathname: AppPathname,
  params?: Record<string, string>,
  query?: URLSearchParams | Record<string, string | number | boolean | null | undefined>,
) {
  let localizedPath = localizeTemplate(locale, pathname);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      localizedPath = localizedPath.replace(`[${key}]`, encodeURIComponent(value));
    }
  }

  const searchParams = new URLSearchParams();

  if (query instanceof URLSearchParams) {
    query.forEach((value, key) => {
      searchParams.append(key, value);
    });
  } else if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value == null || value === "") {
        continue;
      }

      searchParams.set(key, String(value));
    }
  }

  const search = searchParams.toString();
  const basePath = localizedPath === "/" ? `/${locale}` : `/${locale}${localizedPath}`;
  return search ? `${basePath}?${search}` : basePath;
}

export function getAlternateLinks(
  pathname: AppPathname,
  params?: Record<string, string>,
  query?: URLSearchParams | Record<string, string | number | boolean | null | undefined>,
) {
  return Object.fromEntries(
    locales.map((locale) => [locale, getLocalizedPathname(locale, pathname, params, query)]),
  );
}

export function normalizeTranslationKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatSlugLabel(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

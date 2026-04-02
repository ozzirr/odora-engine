import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import { LocaleShell } from "@/components/layout/LocaleShell";
import { NotFoundExperience } from "@/components/not-found/NotFoundExperience";
import { getHomepageData, toPerfumeCardItem } from "@/lib/homepage";
import {
  defaultLocale,
  getLocalizedPathname,
  hasLocale,
  localeCookieName,
  type AppLocale,
} from "@/lib/i18n";
import { pickAlternativePerfumes } from "@/lib/not-found";
import { getIsAuthenticated } from "@/lib/supabase/auth-state";

export default async function RootNotFoundPage() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  let locale: AppLocale = defaultLocale;

  if (cookieLocale && hasLocale(cookieLocale)) {
    locale = cookieLocale;
  }

  setRequestLocale(locale);

  const [messages, isAuthenticated, homepageData, t] = await Promise.all([
    getMessages({ locale }),
    getIsAuthenticated(),
    getHomepageData(),
    getTranslations({ locale, namespace: "notFound" }),
  ]);

  const alternatives = pickAlternativePerfumes([
    ...homepageData.trending,
    ...homepageData.featured,
    ...homepageData.heroSpotlights,
  ]).map(toPerfumeCardItem);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleShell initialIsAuthenticated={isAuthenticated}>
        <NotFoundExperience
          copy={{
            eyebrow: t("eyebrow"),
            title: t("title"),
            description: t("description"),
            primaryCta: t("primaryCta"),
            secondaryCta: t("secondaryCta"),
            helperCards: {
              finder: {
                title: t("helperCards.finder.title"),
                description: t("helperCards.finder.description"),
              },
              catalog: {
                title: t("helperCards.catalog.title"),
                description: t("helperCards.catalog.description"),
              },
              compare: {
                title: t("helperCards.compare.title"),
                description: t("helperCards.compare.description"),
              },
            },
            alternatives: {
              eyebrow: t("alternatives.eyebrow"),
              title: t("alternatives.title"),
              subtitle: t("alternatives.subtitle"),
            },
          }}
          primaryHref={getLocalizedPathname(locale, "/finder")}
          secondaryHref={getLocalizedPathname(locale, "/perfumes")}
          alternatives={alternatives}
        />
      </LocaleShell>
    </NextIntlClientProvider>
  );
}

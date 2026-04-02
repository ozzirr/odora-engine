import { getLocale, getTranslations } from "next-intl/server";

import { NotFoundExperience } from "@/components/not-found/NotFoundExperience";
import { getHomepageData, toPerfumeCardItem } from "@/lib/homepage";
import { getLocalizedPathname, type AppLocale } from "@/lib/i18n";
import { pickAlternativePerfumes } from "@/lib/not-found";

export default async function LocaleNotFoundPage() {
  const locale = await getLocale();
  const t = await getTranslations("notFound");
  const homepageData = await getHomepageData();
  const alternatives = pickAlternativePerfumes([
    ...homepageData.trending,
    ...homepageData.featured,
    ...homepageData.heroSpotlights,
  ]).map(toPerfumeCardItem);

  return (
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
      primaryHref={getLocalizedPathname(locale as AppLocale, "/finder")}
      secondaryHref={getLocalizedPathname(locale as AppLocale, "/perfumes")}
      alternatives={alternatives}
    />
  );
}

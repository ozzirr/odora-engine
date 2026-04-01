import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";

import { LegalPage } from "@/components/legal/LegalPage";
import { getAlternateLinks, hasLocale } from "@/lib/i18n";

type PrivacyPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.privacy" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: getAlternateLinks("/privacy")[resolvedLocale],
      languages: getAlternateLinks("/privacy"),
    },
  };
}

export default async function PrivacyPage() {
  const messages = await getMessages();
  const content = (
    messages as {
      legal: {
        common: {
          relatedLinks: {
            cookiePolicy: string;
          };
        };
        privacy: Parameters<typeof LegalPage>[0];
      };
    }
  ).legal;

  return (
    <LegalPage
      eyebrow={content.privacy.eyebrow}
      title={content.privacy.title}
      intro={content.privacy.intro}
      effectiveDate={content.privacy.effectiveDate}
      sections={content.privacy.sections}
      relatedLinks={[{ href: "/cookie-policy", label: content.common.relatedLinks.cookiePolicy }]}
    />
  );
}
